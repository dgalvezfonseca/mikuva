import "@tanstack/react-start/server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { getDatabase } from "./index.server";
import { createOrderInputSchema, orderFolioSchema, orderIdSchema } from "./order-input";
import {
  customers,
  categories,
  orderFolioCounters,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
  products,
  productVariants,
  type OrderItemConfigurationSnapshot,
} from "./schema";

const INITIAL_ORDER_STATUS = "pedido_recibido" as const;
const INITIAL_PAYMENT_STATUS = "pending" as const;
const FOLIO_TIME_ZONE = "America/Mexico_City";

function assertMoney(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer.`);
  }
  return value;
}

function formatFolio(year: number, sequence: number): string {
  return `MK-${year}-${String(sequence).padStart(5, "0")}`;
}

function getFolioYear(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: FOLIO_TIME_ZONE,
      year: "numeric",
    }).format(date),
  );
}

export async function createOrder(input: unknown) {
  const parsed = createOrderInputSchema.parse(input);
  const db = getDatabase();

  if (parsed.checkoutRequestId) {
    const existingOrderId = await getOrderIdByCheckoutRequestId(parsed.checkoutRequestId);
    if (existingOrderId) {
      const existingOrder = await getOrderDetailsById(existingOrderId);
      if (existingOrder) return existingOrder;
    }
  }

  let orderId: number;
  try {
    orderId = await db.transaction(async (tx) => {
      const normalizedItems = new Map<string, (typeof parsed.items)[number]>();

      for (const item of parsed.items) {
        const key = `${item.productId}:${item.variantId ?? "base"}`;
        const existing = normalizedItems.get(key);
        const combinedQuantity = (existing?.quantity ?? 0) + item.quantity;
        if (combinedQuantity > 10_000) {
          throw new Error("Combined quantity for one product configuration exceeds 10,000.");
        }
        normalizedItems.set(key, {
          ...item,
          quantity: combinedQuantity,
        });
      }

      const itemSnapshots = [];
      let currency: string | undefined;
      let subtotal = 0;

      for (const item of normalizedItems.values()) {
        const [product] = await tx
          .select({
            id: products.id,
            slug: products.slug,
            name: products.name,
            basePrice: products.basePrice,
            currency: products.currency,
          })
          .from(products)
          .innerJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.isActive, true),
              eq(categories.isActive, true),
            ),
          )
          .limit(1);

        if (!product) {
          throw new Error(`Active product ${item.productId} was not found.`);
        }

        let productVariantId: number | null = null;
        let variantNameSnapshot: string | null = null;
        let unitPrice = product.basePrice;
        const configurationSnapshot: OrderItemConfigurationSnapshot = {
          productSlug: product.slug,
          variantCode: null,
          variantMetadata: null,
        };

        if (item.variantId != null) {
          const [variant] = await tx
            .select({
              id: productVariants.id,
              code: productVariants.code,
              name: productVariants.name,
              price: productVariants.price,
              metadata: productVariants.metadata,
            })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.id, item.variantId),
                eq(productVariants.productId, product.id),
                eq(productVariants.isActive, true),
              ),
            )
            .limit(1);

          if (!variant) {
            throw new Error(`Active variant ${item.variantId} was not found for this product.`);
          }

          productVariantId = variant.id;
          variantNameSnapshot = variant.name;
          unitPrice = variant.price;
          configurationSnapshot.variantCode = variant.code;
          configurationSnapshot.variantMetadata = variant.metadata;
        }

        currency ??= product.currency;
        if (currency !== product.currency) {
          throw new Error("All order items must use the same currency.");
        }

        const lineSubtotal = assertMoney(unitPrice * item.quantity, "Line subtotal");
        subtotal = assertMoney(subtotal + lineSubtotal, "Order subtotal");

        itemSnapshots.push({
          productId: product.id,
          productVariantId,
          productNameSnapshot: product.name,
          variantNameSnapshot,
          unitPrice,
          quantity: item.quantity,
          subtotal: lineSubtotal,
          configurationSnapshot,
        });
      }

      const orderCurrency = currency ?? "MXN";
      const currentYear = getFolioYear(new Date());

      await tx
        .insert(orderFolioCounters)
        .values({ year: currentYear, lastValue: 1 })
        .onDuplicateKeyUpdate({
          set: {
            lastValue: sql`${orderFolioCounters.lastValue} + 1`,
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
          },
        });

      const [counter] = await tx
        .select({ lastValue: orderFolioCounters.lastValue })
        .from(orderFolioCounters)
        .where(eq(orderFolioCounters.year, currentYear))
        .limit(1);

      if (!counter) throw new Error("Could not allocate an order folio.");
      const folio = formatFolio(currentYear, counter.lastValue);

      await tx
        .insert(customers)
        .values(parsed.customer)
        .onDuplicateKeyUpdate({
          set: {
            firstName: parsed.customer.firstName,
            lastName: parsed.customer.lastName,
            phone: parsed.customer.phone,
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
          },
        });

      const [customer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, parsed.customer.email))
        .limit(1);

      if (!customer) throw new Error("Could not create or locate the customer.");

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          folio,
          checkoutRequestId: parsed.checkoutRequestId ?? null,
          customerId: customer.id,
          orderStatus: INITIAL_ORDER_STATUS,
          paymentStatus: INITIAL_PAYMENT_STATUS,
          currency: orderCurrency,
          subtotal,
          discount: 0,
          shipping: 0,
          total: subtotal,
        })
        .$returningId();

      if (!createdOrder) throw new Error("Could not create the order.");

      await tx.insert(orderItems).values(
        itemSnapshots.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        })),
      );

      await tx.insert(orderStatusHistory).values({
        orderId: createdOrder.id,
        status: INITIAL_ORDER_STATUS,
        note: "Pedido creado.",
      });

      return createdOrder.id;
    });
  } catch (error) {
    // A concurrent retry can win the unique checkout_request_id race.
    if (parsed.checkoutRequestId) {
      const existingOrderId = await getOrderIdByCheckoutRequestId(parsed.checkoutRequestId);
      if (existingOrderId) {
        const existingOrder = await getOrderDetailsById(existingOrderId);
        if (existingOrder) return existingOrder;
      }
    }
    throw error;
  }

  const createdOrder = await getOrderById(orderId);
  if (!createdOrder) throw new Error("The newly created order could not be loaded.");
  return createdOrder;
}

async function getOrderIdByCheckoutRequestId(checkoutRequestId: string) {
  const db = getDatabase();
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.checkoutRequestId, checkoutRequestId))
    .limit(1);
  return order?.id ?? null;
}

export async function getOrderById(input: unknown) {
  const orderId = orderIdSchema.parse(input);
  return getOrderDetailsById(orderId);
}

/** Internal-only lookup. Do not expose this as a public endpoint without email/token verification. */
export async function getOrderByFolio(input: unknown) {
  const folio = orderFolioSchema.parse(input);
  const db = getDatabase();
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.folio, folio))
    .limit(1);
  return order ? getOrderDetailsById(order.id) : null;
}

async function getOrderDetailsById(orderId: number) {
  const db = getDatabase();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;

  // Separate selects keep this read compatible with MariaDB, which rejects the
  // LATERAL joins generated by Drizzle's relational query builder in MySQL mode.
  const [customerRows, items, paymentRows, statusHistory] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1),
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.createdAt)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);

  const customer = customerRows[0];
  if (!customer)
    throw new Error(`Customer ${order.customerId} was not found for order ${order.id}.`);

  return {
    ...order,
    customer,
    items,
    payments: paymentRows,
    statusHistory,
  };
}

import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const ORDER_STATUSES = [
  "pedido_recibido",
  "esperando_material",
  "material_recibido",
  "digitalizacion",
  "control_calidad",
  "preparando_entrega",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
] as const;

export const PAYMENT_PROVIDERS = ["mercadopago"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type ProductVariantMetadata =
  | {
      type: "volume";
      units: number;
      unitLabel: string;
    }
  | {
      type: "reel";
      format: "8mm" | "super8";
      diameterInches: number;
      approximateFeet?: number;
      approximateMinutes?: number;
    }
  | {
      type: "simple";
    };

export type OrderItemConfigurationSnapshot = {
  productSlug: string;
  variantCode: string | null;
  variantMetadata: ProductVariantMetadata | null;
};

const currentTimestamp3 = () => sql`CURRENT_TIMESTAMP(3)`;
const createdAt = () =>
  timestamp("created_at", { mode: "date", fsp: 3 }).default(currentTimestamp3()).notNull();
const updatedAt = () =>
  timestamp("updated_at", { mode: "date", fsp: 3 })
    .default(currentTimestamp3())
    .onUpdateNow()
    .notNull();
const money = (name: string) => bigint(name, { mode: "number", unsigned: true });

export const categories = mysqlTable(
  "categories",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    sortOrder: int("sort_order", { unsigned: true }).default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("categories_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const products = mysqlTable(
  "products",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    categoryId: int("category_id", { unsigned: true })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict", onUpdate: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    shortDescription: varchar("short_description", { length: 500 }).notNull(),
    description: text("description").notNull(),
    basePrice: money("base_price").notNull(),
    currency: char("currency", { length: 3 }).default("MXN").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_category_active_idx").on(table.categoryId, table.isActive),
    check("products_base_price_nonnegative", sql`${table.basePrice} >= 0`),
  ],
);

export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    productId: int("product_id", { unsigned: true })
      .notNull()
      .references(() => products.id, { onDelete: "restrict", onUpdate: "cascade" }),
    code: varchar("code", { length: 96 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    price: money("price").notNull(),
    metadata: json("metadata").$type<ProductVariantMetadata | null>(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("product_variants_code_unique").on(table.code),
    index("product_variants_product_active_sort_idx").on(
      table.productId,
      table.isActive,
      table.sortOrder,
    ),
    check("product_variants_price_nonnegative", sql`${table.price} >= 0`),
  ],
);

export const customers = mysqlTable(
  "customers",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 140 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("customers_email_unique").on(table.email)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    folio: varchar("folio", { length: 24 }).notNull(),
    checkoutRequestId: varchar("checkout_request_id", { length: 64 }),
    customerId: int("customer_id", { unsigned: true })
      .notNull()
      .references(() => customers.id, { onDelete: "restrict", onUpdate: "cascade" }),
    orderStatus: mysqlEnum("order_status", ORDER_STATUSES).default("pedido_recibido").notNull(),
    paymentStatus: mysqlEnum("payment_status", PAYMENT_STATUSES).default("pending").notNull(),
    currency: char("currency", { length: 3 }).default("MXN").notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").default(0).notNull(),
    shipping: money("shipping").default(0).notNull(),
    total: money("total").notNull(),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("orders_folio_unique").on(table.folio),
    uniqueIndex("orders_checkout_request_unique").on(table.checkoutRequestId),
    index("orders_customer_created_idx").on(table.customerId, table.createdAt),
    index("orders_status_created_idx").on(table.orderStatus, table.createdAt),
    index("orders_payment_status_created_idx").on(table.paymentStatus, table.createdAt),
    check("orders_subtotal_nonnegative", sql`${table.subtotal} >= 0`),
    check("orders_discount_nonnegative", sql`${table.discount} >= 0`),
    check("orders_discount_not_above_subtotal", sql`${table.discount} <= ${table.subtotal}`),
    check("orders_shipping_nonnegative", sql`${table.shipping} >= 0`),
    check(
      "orders_total_formula",
      sql`${table.total} = ${table.subtotal} - ${table.discount} + ${table.shipping}`,
    ),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    orderId: int("order_id", { unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: "restrict", onUpdate: "cascade" }),
    productId: int("product_id", { unsigned: true })
      .notNull()
      .references(() => products.id, { onDelete: "restrict", onUpdate: "cascade" }),
    productVariantId: int("product_variant_id", { unsigned: true }).references(
      () => productVariants.id,
      { onDelete: "restrict", onUpdate: "cascade" },
    ),
    productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
    variantNameSnapshot: varchar("variant_name_snapshot", { length: 200 }),
    unitPrice: money("unit_price").notNull(),
    quantity: int("quantity", { unsigned: true }).notNull(),
    subtotal: money("subtotal").notNull(),
    configurationSnapshot: json("configuration_snapshot")
      .$type<OrderItemConfigurationSnapshot>()
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_nonnegative", sql`${table.unitPrice} >= 0`),
    check(
      "order_items_subtotal_formula",
      sql`${table.subtotal} = ${table.unitPrice} * ${table.quantity}`,
    ),
  ],
);

export const payments = mysqlTable(
  "payments",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    orderId: int("order_id", { unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: "restrict", onUpdate: "cascade" }),
    provider: mysqlEnum("provider", PAYMENT_PROVIDERS).notNull(),
    providerPreferenceId: varchar("provider_preference_id", { length: 160 }),
    providerPaymentId: varchar("provider_payment_id", { length: 160 }),
    status: mysqlEnum("status", PAYMENT_STATUSES).default("pending").notNull(),
    amount: money("amount").notNull(),
    currency: char("currency", { length: 3 }).default("MXN").notNull(),
    externalReference: varchar("external_reference", { length: 64 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("payments_order_created_idx").on(table.orderId, table.createdAt),
    uniqueIndex("payments_provider_preference_unique").on(
      table.provider,
      table.providerPreferenceId,
    ),
    uniqueIndex("payments_provider_payment_unique").on(table.provider, table.providerPaymentId),
    index("payments_external_reference_idx").on(table.externalReference),
    check("payments_amount_nonnegative", sql`${table.amount} >= 0`),
  ],
);

/** Minimal, non-sensitive audit trail for signed provider notifications. */
export const paymentEvents = mysqlTable(
  "payment_events",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    provider: mysqlEnum("provider", PAYMENT_PROVIDERS).notNull(),
    providerEventKey: varchar("provider_event_key", { length: 191 }).notNull(),
    providerPaymentId: varchar("provider_payment_id", { length: 160 }).notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    action: varchar("action", { length: 96 }).notNull(),
    processedStatus: varchar("processed_status", { length: 96 }).notNull(),
    createdAt: createdAt(),
    processedAt: timestamp("processed_at", { mode: "date", fsp: 3 })
      .default(currentTimestamp3())
      .notNull(),
  },
  (table) => [
    uniqueIndex("payment_events_provider_event_unique").on(table.provider, table.providerEventKey),
    index("payment_events_provider_payment_idx").on(table.provider, table.providerPaymentId),
  ],
);

export const orderStatusHistory = mysqlTable(
  "order_status_history",
  {
    id: int("id", { unsigned: true }).autoincrement().primaryKey(),
    orderId: int("order_id", { unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: mysqlEnum("status", ORDER_STATUSES).notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: createdAt(),
  },
  (table) => [index("order_status_history_order_created_idx").on(table.orderId, table.createdAt)],
);

/** Internal counter used only while creating a folio inside a transaction. */
export const orderFolioCounters = mysqlTable("order_folio_counters", {
  year: int("year", { unsigned: true }).primaryKey(),
  lastValue: int("last_value", { unsigned: true }).notNull(),
  updatedAt: updatedAt(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const paymentEventsRelations = relations(paymentEvents, () => ({}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

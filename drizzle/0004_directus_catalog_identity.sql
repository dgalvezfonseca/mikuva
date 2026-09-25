ALTER TABLE `categories` ADD `directus_id` varchar(191);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_directus_id_unique` UNIQUE(`directus_id`);
--> statement-breakpoint
ALTER TABLE `products` ADD `directus_id` varchar(191);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_directus_id_unique` UNIQUE(`directus_id`);
--> statement-breakpoint
ALTER TABLE `product_variants` ADD `directus_id` varchar(191);
--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_directus_id_unique` UNIQUE(`directus_id`);

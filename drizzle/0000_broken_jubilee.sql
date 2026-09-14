CREATE TABLE IF NOT EXISTS `appointments` (
	`code` text PRIMARY KEY NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`service_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`location_type` text DEFAULT 'client' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`district` text DEFAULT '' NOT NULL,
	`ward` text DEFAULT '' NOT NULL,
	`style` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`total` integer NOT NULL,
	`deposit` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'unverified' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `appointments_date_idx` ON `appointments` (`date`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `appointments_phone_idx` ON `appointments` (`phone`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `appointments_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `schedule_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slot_date` text NOT NULL,
	`slot_time` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `schedule_date_time_unique` ON `schedule_slots` (`slot_date`,`slot_time`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `schedule_date_idx` ON `schedule_slots` (`slot_date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`contact` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

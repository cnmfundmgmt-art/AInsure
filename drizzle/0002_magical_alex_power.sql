CREATE TABLE `advisor_client_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_client_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`advisor_client_id`) REFERENCES `advisor_clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `advisor_client_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_client_id` text NOT NULL,
	`goal_type` text NOT NULL,
	`goal_name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0,
	`target_year` integer,
	`priority` integer DEFAULT 1,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`advisor_client_id`) REFERENCES `advisor_clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `advisor_client_liabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_client_id` text NOT NULL,
	`liability_type` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`interest_rate` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`advisor_client_id`) REFERENCES `advisor_clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `advisor_client_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_client_id` text NOT NULL,
	`monthly_income` real,
	`monthly_expenses` real,
	`emergency_fund` real,
	`snapshot_date` integer NOT NULL,
	FOREIGN KEY (`advisor_client_id`) REFERENCES `advisor_clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `advisor_clients` ADD `client_number` text NOT NULL;--> statement-breakpoint
ALTER TABLE `advisor_clients` ADD `gender` text;--> statement-breakpoint
CREATE UNIQUE INDEX `advisor_clients_client_number_unique` ON `advisor_clients` (`client_number`);
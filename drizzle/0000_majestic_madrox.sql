CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `advisor_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`date_of_birth` text,
	`nric_passport` text,
	`address_street` text,
	`address_city` text,
	`address_postcode` text,
	`address_state` text,
	`preferred_language` text DEFAULT 'EN',
	`notes` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`advisor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `analysis` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`net_worth` real,
	`monthly_surplus` real,
	`emergency_fund_months` real,
	`insurance_gap` real,
	`retirement_adequacy` real,
	`health_score` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`client_id` text,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`details` text,
	`ip_address` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `category_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword` text NOT NULL,
	`category` text NOT NULL,
	`is_regex` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `client_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`processed` integer DEFAULT false,
	`upload_date` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`full_name` text NOT NULL,
	`dob` text,
	`gender` text,
	`age` integer,
	`ic_number` text,
	`nationality` text,
	`marital_status` text,
	`dependents` integer,
	`employment_status` text,
	`annual_income` real,
	`phone_number` text,
	`occupation` text,
	`employer` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_user_id_unique` ON `clients` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clients_reference_id_unique` ON `clients` (`reference_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clients_ic_number_unique` ON `clients` (`ic_number`);--> statement-breakpoint
CREATE TABLE `comparison_items` (
	`id` text PRIMARY KEY NOT NULL,
	`comparison_id` text NOT NULL,
	`product_type` text NOT NULL,
	`product_id` text NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`comparison_id`) REFERENCES `product_comparisons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `face_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`selfie_path` text NOT NULL,
	`match_score` real,
	`verification_status` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `financial_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`monthly_income` real,
	`monthly_expenses` real,
	`emergency_fund` real,
	`snapshot_date` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`goal_type` text NOT NULL,
	`target_amount` real NOT NULL,
	`target_year` integer,
	`priority` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `id_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`document_type` text NOT NULL,
	`document_number` text,
	`full_name` text,
	`date_of_birth` text,
	`nationality` text,
	`address` text,
	`issue_date` text,
	`expiry_date` text,
	`file_path` text,
	`ocr_raw_text` text,
	`ocr_confidence` real,
	`verification_status` text,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `insurance_products` (
	`id` text PRIMARY KEY NOT NULL,
	`product_code` text NOT NULL,
	`product_name` text NOT NULL,
	`provider` text,
	`policy_type` text,
	`monthly_premium_min` real,
	`coverage_amount_max` real,
	`is_takaful` integer DEFAULT false,
	`last_updated` integer,
	`min_entry_age` integer DEFAULT 0,
	`max_entry_age` integer DEFAULT 65,
	`coverage_features` text,
	`guaranteed_cash_10y` real DEFAULT 0,
	`guaranteed_cash_20y` real DEFAULT 0,
	`guaranteed_cash_30y` real DEFAULT 0,
	`projected_cash_10y` real DEFAULT 0,
	`projected_cash_20y` real DEFAULT 0,
	`projected_cash_30y` real DEFAULT 0,
	`life_cover_10y` real DEFAULT 0,
	`life_cover_20y` real DEFAULT 0,
	`life_cover_30y` real DEFAULT 0,
	`ci_cover` real DEFAULT 0,
	`medical_cover` real DEFAULT 0,
	`annual_premium` real DEFAULT 0,
	`payment_term_years` integer DEFAULT 0,
	`product_summary` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_products_product_code_unique` ON `insurance_products` (`product_code`);--> statement-breakpoint
CREATE TABLE `investment_products` (
	`id` text PRIMARY KEY NOT NULL,
	`product_code` text NOT NULL,
	`product_name` text NOT NULL,
	`provider` text,
	`category` text,
	`risk_rating` text,
	`fund_size` real,
	`management_fee` real,
	`sales_charge` real,
	`nav_per_unit` real,
	`one_year_return` real,
	`is_shariah_compliant` integer DEFAULT false,
	`last_updated` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_products_product_code_unique` ON `investment_products` (`product_code`);--> statement-breakpoint
CREATE TABLE `liabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`liability_type` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`interest_rate` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ocr_extractions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`extracted_text` text,
	`structured_data` text,
	`confidence_score` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `client_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parsed_holdings` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`provider` text,
	`product_name` text NOT NULL,
	`quantity` real,
	`current_value` real,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parsed_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`transaction_date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`transaction_type` text,
	`category` text,
	`is_verified` integer DEFAULT false,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portfolio_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`risk_level` text NOT NULL,
	`equity_pct` real NOT NULL,
	`bond_pct` real NOT NULL,
	`cash_pct` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_models_risk_level_unique` ON `portfolio_models` (`risk_level`);--> statement-breakpoint
CREATE TABLE `product_comparisons` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`comparison_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`analysis_id` text,
	`portfolio_model_id` integer,
	`ai_explanation` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`analysis_id`) REFERENCES `analysis`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`portfolio_model_id`) REFERENCES `portfolio_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risk_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`score` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `risk_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `risk_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_text` text NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `risk_results` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`total_score` integer NOT NULL,
	`risk_level` text NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`role` text NOT NULL,
	`verification_status` text DEFAULT 'pending',
	`approved_by_admin` integer DEFAULT false,
	`approved_at` integer,
	`rejection_reason` text,
	`company_name` text,
	`license_number` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);

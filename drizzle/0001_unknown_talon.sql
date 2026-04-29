CREATE TABLE `client_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`provider` text,
	`policy_name` text,
	`policy_type` text,
	`annual_premium` real,
	`sum_assured` real,
	`ci_cover` real,
	`medical_cover` real,
	`life_cover` real,
	`policy_start_date` text,
	`status` text DEFAULT 'active',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `insurance_analysis_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`advisor_id` text NOT NULL,
	`client_name` text,
	`client_ic` text,
	`annual_income` real,
	`monthly_budget` real,
	`analysis_data` text,
	`created_at` integer NOT NULL
);

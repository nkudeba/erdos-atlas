CREATE TABLE `publisher_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `run_results` (
	`id` text PRIMARY KEY NOT NULL,
	`problem` integer NOT NULL,
	`revision` text NOT NULL,
	`updated_at` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_run_problem_updated` ON `run_results` (`problem`,`updated_at`);
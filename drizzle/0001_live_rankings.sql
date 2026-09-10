CREATE TABLE `problem_rankings` (
	`problem` integer PRIMARY KEY NOT NULL,
	`revision` text NOT NULL,
	`updated_at` text NOT NULL,
	`payload` text NOT NULL
);

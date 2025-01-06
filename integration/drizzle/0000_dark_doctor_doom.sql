CREATE DATABASE drizzle_zero;
CREATE DATABASE drizzle_zero_cvr;
CREATE DATABASE drizzle_zero_cdb;

\c drizzle_zero;

CREATE TABLE "medium" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"senderId" text,
	"mediumId" text,
	"body" text NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"partner" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_user_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_mediumId_medium_id_fk" FOREIGN KEY ("mediumId") REFERENCES "public"."medium"("id") ON DELETE no action ON UPDATE no action;
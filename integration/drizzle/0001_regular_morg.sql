CREATE TABLE "friendship" (
	"requesting_id" text NOT NULL,
	"accepting_id" text NOT NULL,
	"accepted" boolean NOT NULL,
	CONSTRAINT "friendship_requesting_id_accepting_id_pk" PRIMARY KEY("requesting_id","accepting_id")
);
--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_requesting_id_user_id_fk" FOREIGN KEY ("requesting_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_accepting_id_user_id_fk" FOREIGN KEY ("accepting_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
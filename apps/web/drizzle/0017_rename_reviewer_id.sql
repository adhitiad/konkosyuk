-- Rename reviewer_id to created_by_id in reviews table
ALTER TABLE "reviews" RENAME COLUMN "reviewer_id" TO "created_by_id";

-- Drop old unique constraint
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_property_user_unique";

-- Add new unique constraint with renamed column
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_user_unique" UNIQUE("property_id","created_by_id");

-- Rename index
ALTER INDEX IF EXISTS "reviews_reviewer_id_idx" RENAME TO "reviews_created_by_id_idx";

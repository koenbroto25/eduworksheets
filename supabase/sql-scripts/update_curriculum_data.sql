-- This script updates the grade and semester columns in the curriculum table.
-- It should be run after the migration to change the column types to TEXT.

-- Example of how to update the values. 
-- You should replace these with the actual update statements you need.
UPDATE "public"."curriculum" SET "grade" = '1' WHERE "grade" = '1';
UPDATE "public"."curriculum" SET "grade" = '2' WHERE "grade" = '2';
UPDATE "public"."curriculum" SET "grade" = '3' WHERE "grade" = '3';
UPDATE "public"."curriculum" SET "grade" = '4' WHERE "grade" = '4';
UPDATE "public"."curriculum" SET "grade" = '5' WHERE "grade" = '5';
UPDATE "public"."curriculum" SET "grade" = '6' WHERE "grade" = '6';
UPDATE "public"."curriculum" SET "grade" = '7' WHERE "grade" = '7';
UPDATE "public"."curriculum" SET "grade" = '8' WHERE "grade" = '8';
UPDATE "public"."curriculum" SET "grade" = '9' WHERE "grade" = '9';
UPDATE "public"."curriculum" SET "grade" = '10 SMA' WHERE "grade" = '10';
UPDATE "public"."curriculum" SET "grade" = '11 SMA' WHERE "grade" = '11';
UPDATE "public"."curriculum" SET "grade" = '12 SMA' WHERE "grade" = '12';

UPDATE "public"."curriculum" SET "semester" = '1' WHERE "semester" = '1';
UPDATE "public"."curriculum" SET "semester" = '2' WHERE "semester" = '2';

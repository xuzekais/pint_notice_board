-- Migration: change `address_num` to BIGINT AUTO_INCREMENT (destructive)
-- Date: 2025-11-14
-- WARNING: This migration is destructive if you choose the "truncate" path.
-- Read the comments below and choose the appropriate section to run on your database.

-- 0) Recommended: backup the table first (run on shell)
-- mysqldump -u <user> -p <database> t_address_type > t_address_type_backup.sql

-- OR in SQL create a quick backup table (fast but note triggers/indexes not copied)
CREATE TABLE IF NOT EXISTS `t_address_type_backup` AS SELECT * FROM `t_address_type`;

-- ==================================================================================
-- PATH A: If you ACCEPT DATA LOSS / will RECREATE the table content (fast, destructive)
-- Use this when it's acceptable to remove existing rows (e.g., table is test or you will re-seed)
-- ==================================================================================

-- Option A: TRUNCATE then alter column
-- 1) Truncate the table (removes all rows)
-- TRUNCATE TABLE `t_address_type`;

-- 2) Change column type and set AUTO_INCREMENT + PRIMARY KEY
-- Note: If address_num was previously PRIMARY KEY, you may need to DROP PRIMARY KEY first
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `t_address_type` DROP PRIMARY KEY;
ALTER TABLE `t_address_type` MODIFY COLUMN `address_num` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `t_address_type` ADD PRIMARY KEY (`address_num`);
SET FOREIGN_KEY_CHECKS=1;

-- ==================================================================================
-- PATH B: Attempt in-place conversion (ONLY if table is EMPTY or all address_num values are numeric)
-- If current address_num values are non-numeric (UUIDs), this will fail or produce incorrect data.
-- ==================================================================================

-- 1) If table empty, do the same as above without TRUNCATE
-- SET FOREIGN_KEY_CHECKS=0;
-- ALTER TABLE `t_address_type` DROP PRIMARY KEY;
-- ALTER TABLE `t_address_type` MODIFY COLUMN `address_num` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
-- ALTER TABLE `t_address_type` ADD PRIMARY KEY (`address_num`);
-- SET FOREIGN_KEY_CHECKS=1;

-- ==================================================================================
-- PATH C: Safer migration when table has existing non-numeric values (recommended if you want to keep data)
-- Steps:
-- 1) Create new auto-increment column `id`, populate it, then (optionally) drop old column and rename.
-- 2) This preserves existing data in other columns and assigns new numeric ids.
-- ==================================================================================

-- 1) Add new id column as BIGINT AUTO_INCREMENT
ALTER TABLE `t_address_type` ADD COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST;

-- 2) Optionally set id as PRIMARY KEY and keep old address_num as historical field
-- If you need id as primary key and address_num no longer primary:
ALTER TABLE `t_address_type` DROP PRIMARY KEY;
ALTER TABLE `t_address_type` ADD PRIMARY KEY (`id`);

-- 3) (Optional) If you want to remove the old UUID column afterwards (destructive):
-- ALTER TABLE `t_address_type` DROP COLUMN `address_num`;
-- THEN optionally rename `id` -> `address_num` (if you must preserve column name):
-- ALTER TABLE `t_address_type` CHANGE COLUMN `id` `address_num` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- ==================================================================================
-- NOTES & WARNINGS
-- - If other tables reference `t_address_type.address_num` as a foreign key, you MUST drop or update those foreign keys before changing the type or dropping the column.
-- - ALTER TABLE MODIFY/CHANGE on large tables can take time and lock the table; do this in maintenance window.
-- - Always test on staging first.
-- ==================================================================================

-- End of migration file

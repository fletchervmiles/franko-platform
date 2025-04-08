-- Mark migration 0033 as completed
INSERT INTO __drizzle_migrations (migration_name, migrated_at)
VALUES ('0033_illegal_runaways', NOW())
ON CONFLICT (migration_name) DO NOTHING; -- Add this to avoid errors if it's somehow already there

-- Mark migration 0034 as completed
INSERT INTO __drizzle_migrations (migration_name, migrated_at)
VALUES ('0034_careless_silver_fox', NOW())
ON CONFLICT (migration_name) DO NOTHING; -- Add this to avoid errors if it's somehow already there
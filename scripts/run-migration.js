require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationPath) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      // Read the migration file
      const migrationFile = path.resolve(process.cwd(), migrationPath);
      console.log(`Running migration from: ${migrationFile}`);
      const sql = fs.readFileSync(migrationFile, 'utf8');

      // Execute the SQL
      await client.query(sql);
      console.log('Migration applied successfully!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await pool.end();
  }
}

// Get the migration path from command line arguments
const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error('Please provide a migration file path as an argument');
  process.exit(1);
}

runMigration(migrationPath);
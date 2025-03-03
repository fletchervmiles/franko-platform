require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      // Read the migration file
      const migrationFile = path.join(__dirname, '../db/migrations/0018_chilly_colleen_wing.sql');
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

runMigration(); 
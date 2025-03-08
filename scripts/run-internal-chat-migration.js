/**
 * Run Internal Chat Migration Script
 * 
 * This script runs the migration SQL for the internal chat sessions table.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const migrationFilePath = path.join(__dirname, '../db/migrations/add_internal_chat_sessions.sql');

if (!fs.existsSync(migrationFilePath)) {
  console.error(`Migration file not found: ${migrationFilePath}`);
  process.exit(1);
}

const command = `cat ${migrationFilePath} | npx drizzle-kit push:pg`;

console.log(`Running migration from ${migrationFilePath}...`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running migration: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  
  console.log(`Migration stdout: ${stdout}`);
  console.log('Migration completed successfully!');
});
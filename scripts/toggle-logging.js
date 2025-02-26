#!/usr/bin/env node

/**
 * Logging Toggle Utility
 * 
 * This script helps you quickly toggle logging settings by creating
 * a .env.local file with the appropriate environment variables.
 * 
 * Usage:
 *   node scripts/toggle-logging.js [options]
 * 
 * Options:
 *   --all=on|off         Toggle all logs on or off
 *   --level=debug|info|error|none  Set log level
 *   --ai=on|off          Toggle AI logs
 *   --api=on|off         Toggle API request logs
 *   --profile=on|off     Toggle profile update logs
 * 
 * Examples:
 *   node scripts/toggle-logging.js --all=on
 *   node scripts/toggle-logging.js --level=debug --ai=on
 *   node scripts/toggle-logging.js --api=on --profile=on
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  const [key, value] = arg.replace('--', '').split('=');
  options[key] = value;
});

// Set default .env file path
const envFilePath = path.join(process.cwd(), '.env.local');

// Read existing .env file if it exists
let envContent = '';
try {
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, 'utf8');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Parse existing environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Process options
if (options.all === 'on') {
  envVars['LOG_LEVEL'] = 'debug';
  envVars['LOG_AI_DETAILS'] = 'true';
  envVars['LOG_API_REQUESTS'] = 'true';
  envVars['LOG_PROFILE_UPDATES'] = 'true';
} else if (options.all === 'off') {
  envVars['LOG_LEVEL'] = 'none';
  envVars['LOG_AI_DETAILS'] = 'false';
  envVars['LOG_API_REQUESTS'] = 'false';
  envVars['LOG_PROFILE_UPDATES'] = 'false';
}

if (options.level) {
  envVars['LOG_LEVEL'] = options.level;
}

if (options.ai === 'on') {
  envVars['LOG_AI_DETAILS'] = 'true';
} else if (options.ai === 'off') {
  envVars['LOG_AI_DETAILS'] = 'false';
}

if (options.api === 'on') {
  envVars['LOG_API_REQUESTS'] = 'true';
} else if (options.api === 'off') {
  envVars['LOG_API_REQUESTS'] = 'false';
}

if (options.profile === 'on') {
  envVars['LOG_PROFILE_UPDATES'] = 'true';
} else if (options.profile === 'off') {
  envVars['LOG_PROFILE_UPDATES'] = 'false';
}

// Generate new .env content
const newEnvContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env.local file
fs.writeFileSync(envFilePath, newEnvContent);

// Make sure all variables are set for display
const displayVars = {
  LOG_LEVEL: envVars['LOG_LEVEL'] || 'Not set',
  LOG_AI_DETAILS: envVars['LOG_AI_DETAILS'] || 'Not set',
  LOG_API_REQUESTS: envVars['LOG_API_REQUESTS'] || 'Not set',
  LOG_PROFILE_UPDATES: envVars['LOG_PROFILE_UPDATES'] || 'Not set'
};

console.log('Logging settings updated:');
console.log('-------------------------');
console.log(`LOG_LEVEL: ${displayVars.LOG_LEVEL}`);
console.log(`LOG_AI_DETAILS: ${displayVars.LOG_AI_DETAILS}`);
console.log(`LOG_API_REQUESTS: ${displayVars.LOG_API_REQUESTS}`);
console.log(`LOG_PROFILE_UPDATES: ${displayVars.LOG_PROFILE_UPDATES}`);
console.log('-------------------------');
console.log('Settings saved to .env.local');
console.log('Restart your application for changes to take effect.'); 
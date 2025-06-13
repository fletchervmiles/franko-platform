import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  profilesTable,
  chatInstancesTable,
  chatResponsesTable,
  internalChatSessionsTable,
  responseFieldsTable,
  responseArrayItemsTable,
  userPersonasTable,
  userOnboardingStatusTable,
  modalsTable,
} from "./schema";

config({ path: ".env.local" });

const schema = {
  profiles: profilesTable,
  chatInstances: chatInstancesTable,
  chatResponses: chatResponsesTable,
  internalChatSessions: internalChatSessionsTable,
  responseFields: responseFieldsTable,
  responseArrayItems: responseArrayItemsTable,
  userPersonas: userPersonasTable,
  userOnboardingStatus: userOnboardingStatusTable,
  modals: modalsTable,
};

// Configure connection pooling options
const connectionOptions = {
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Increased pool size for production
  idle_timeout: 30,                                     // Idle connection timeout in seconds
  max_lifetime: 60 * 60,                                // Connection lifetime in seconds (1 hour)
  connect_timeout: 30,                                  // Connection timeout in seconds
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }                     // Allow self-signed certs in production
    : false,                                            // Disable SSL in development
};

// Create connection with pooling options
// Add debug logging for connection initialization
console.log(`Initializing database connection (Environment: ${process.env.NODE_ENV || 'development'})`);

// Initialize client in a way that's compatible with ES Modules
let pgClient;

try {
  pgClient = postgres(process.env.DATABASE_URL!, connectionOptions);
  console.log("Database connection initialized successfully");
  
  // Test the connection when the module loads (doesn't block execution)
  pgClient`SELECT 1`.then(() => {
    console.log("Database connection test successful");
  }).catch(err => {
    console.error("Database connection test failed:", err);
  });
} catch (error) {
  console.error("Failed to initialize database client:", error);
  throw error;
}

const client = pgClient;

export const db = drizzle(client, { schema });

// This initializes the database connection with connection pooling
// it creates the schema in Supabase
// it allows drizzle to communicate with the database efficiently
// Connection pooling avoids expensive connection setups for each query


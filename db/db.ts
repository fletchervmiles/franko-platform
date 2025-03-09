import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable, chatInstancesTable, chatResponsesTable, internalChatSessionsTable } from "./schema";

config({ path: ".env.local" });

const schema = {
  profiles: profilesTable,
  chatInstances: chatInstancesTable,
  chatResponses: chatResponsesTable,
  internalChatSessions: internalChatSessionsTable,
};

// Configure connection pooling options
const connectionOptions = {
  max: 10,                                     // Maximum 10 connections in pool
  idle_timeout: 30,                            // Idle connection timeout in seconds
  max_lifetime: 60 * 60,                       // Connection lifetime in seconds (1 hour)
  connect_timeout: 30,                         // Connection timeout in seconds
  ssl: process.env.NODE_ENV === 'production',  // Enable SSL in production
};

// Create connection with pooling options
const client = postgres(process.env.DATABASE_URL!, connectionOptions);

export const db = drizzle(client, { schema });

// This initializes the database connection with connection pooling
// it creates the schema in Supabase
// it allows drizzle to communicate with the database efficiently
// Connection pooling avoids expensive connection setups for each query


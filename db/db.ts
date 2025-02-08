import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable, chatInstancesTable, chatResponsesTable } from "./schema";

config({ path: ".env.local" });

const schema = {
  profiles: profilesTable,
  chatInstances: chatInstancesTable,
  chatResponses: chatResponsesTable,
};

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

// This initializes the database connection
// it creates the schema in Supabase
// it allows drizzle to communicate with the database 


import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable, todosTable } from "./schema";

config({ path: ".env.local" });

const schema = {
  profiles: profilesTable,
  todos: todosTable,
};

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

// This initalises the database connection
// it creates the schema in Supabase
// it allows drizzle to communicate with the database


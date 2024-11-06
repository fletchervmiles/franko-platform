import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});


// this pulls in the schema files
// it uses the migrations folder to create the schema in Supabase
// it uses the dbCredentials to connect to the Supabase - that's my database URL

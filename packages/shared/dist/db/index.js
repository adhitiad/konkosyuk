import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schemaModule from "./schema";
export * as schema from "./schema";
export function createDb(connectionString, poolConfig) {
    return drizzle(new Pool({ connectionString, ...poolConfig }), { schema: schemaModule });
}

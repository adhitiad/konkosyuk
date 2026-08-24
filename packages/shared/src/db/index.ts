import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolConfig } from "pg";
import * as schemaModule from "./schema";

export * as schema from "./schema";
export type Db = ReturnType<typeof drizzle<typeof schemaModule>>;
export function createDb(connectionString: string, poolConfig?: PoolConfig): Db {
  return drizzle(new Pool({ connectionString, ...poolConfig }), { schema: schemaModule }) as Db;
}

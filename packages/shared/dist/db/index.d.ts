import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolConfig } from "pg";
import * as schemaModule from "./schema";
export * as schema from "./schema";
export type Db = ReturnType<typeof drizzle<typeof schemaModule>>;
export declare function createDb(connectionString: string, poolConfig?: PoolConfig): import("drizzle-orm/node-postgres").NodePgDatabase<typeof schemaModule> & {
    $client: Pool;
};
//# sourceMappingURL=index.d.ts.map
declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  interface Database {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryResults[];
    export(): Uint8Array;
    close(): void;
  }

  interface QueryResults {
    columns: string[];
    values: (string | number | null | Uint8Array)[][];
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
  export { Database, QueryResults };
}

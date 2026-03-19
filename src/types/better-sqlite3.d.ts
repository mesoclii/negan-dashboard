declare module "better-sqlite3" {
  export default class Database {
    constructor(filename: string, options?: Record<string, unknown>);
    pragma(command: string): unknown;
    exec(sql: string): this;
    close(): void;
  }
}

import { assertEquals, assertThrows } from "./deps.ts";
import { configFile, Database, parseConfig } from "./config.ts";

Deno.test("config is empty", () => {
  assertThrows(
    () => {
      parseConfig("");
    },
    Error,
    `invalid config: ${configFile}, config is empty`,
  );
});

Deno.test("invalid format config", () => {
  assertThrows(
    () => {
      parseConfig(`test`);
    },
    Error,
    `invalid config: ${configFile}, config: test`,
  );
});

Deno.test("valid format config", () => {
  const contents = `
databases:
  - alias: A
    username: root
    password: a
    dbname: a
    host: localhost
    port: 3308
  `;
  const config = parseConfig(contents);
  const want: Database = {
    alias: "A",
    username: "root",
    password: "a",
    dbname: "a",
    host: "localhost",
    port: 3308,
  };
  assertEquals(config.databases[0], want);
});

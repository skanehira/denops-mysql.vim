import { path, yaml } from "./deps.ts";
import xdg from "https://deno.land/x/xdg@v9.4.0/src/mod.deno.ts";

export const configFile = path.join(
  xdg.config(),
  "denops_mysql",
  "config.yaml",
);

export type Database = {
  alias: string;
  username: string;
  password: string;
  dbname: string;
  host: string;
  port: number;
};

export type Config = {
  databases: Database[];
};

export function parseConfig(contents: string): Config {
  if (contents.length === 0) {
    throw new Error(`invalid config: ${configFile}, config is empty`);
  }
  const config = yaml.parse(contents) as Config;
  if (!config.databases || config.databases.length === 0) {
    throw new Error(`invalid config: ${configFile}, config: ${contents}`);
  }
  return config;
}

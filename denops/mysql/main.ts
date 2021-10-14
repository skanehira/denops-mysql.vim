import {
  autocmd,
  Denops,
  ensureNumber,
  ensureString,
  mapping,
  Mode,
  mysql,
  path,
  yaml,
} from "./deps.ts";
import xdg from "https://deno.land/x/xdg@v9.4.0/src/mod.deno.ts";
import { Table } from "https://deno.land/x/cliffy@v0.19.0/table/mod.ts";

const configFile = path.join(xdg.config(), "denops_mysql", "config.yaml");

type Database = {
  alias: string;
  username: string;
  password: string;
  dbname: string;
  host: string;
  port: number;
};

type Config = {
  databases: Database[];
};

export async function main(denops: Denops): Promise<void> {
  // disable sql logger
  await mysql.configLogger({ enable: false });

  // read config
  const contents = await Deno.readTextFile(configFile);

  const readConfig = (contents: string): Config => {
    const config = yaml.parse(contents) as Config;
    if (!config.databases || config.databases.length === 0) {
      throw new Error(`invalid config: ${configFile}, contents: ${contents}`);
    }
    return config;
  };

  let config: Config;
  let databaseNames: string[];
  try {
    config = readConfig(contents);

    // database names for choising
    databaseNames = config.databases.map((db) => {
      return db.alias;
    });
  } catch (e) {
    console.error(e.toString());
  }
  let client: mysql.Client; // current client

  const clients: Map<string, mysql.Client> = new Map();

  // module for formatting result
  const table = new Table();

  const commands: string[] = [
    `command! -nargs=1 MySQLConnect call denops#notify("${denops.name}", "connect", [<f-args>])`,
    `command! -range MySQLQuery call denops#notify("${denops.name}", "query", [<line1>, <line2>])`,
    `command! MySQLConfig call denops#notify("${denops.name}", "openConfig", [])`,
  ];

  for (const cmd of commands) {
    await denops.cmd(cmd);
  }

  const maps = [
    {
      lhs: "gq",
      rhs: ":MySQLQuery<CR>",
      mode: ["n", "v"],
    },
  ];

  for (const map of maps) {
    mapping.map(
      denops,
      map.lhs,
      map.rhs,
      {
        mode: map.mode as Mode[],
        silent: true,
      },
    );
  }

  // deno-lint-ignore no-explicit-any
  const formatResult = function (result: any): string[] {
    const header = Object.keys(result[0]);
    table.header(header);

    // deno-lint-ignore no-explicit-any
    const body: Array<Array<any>> = new Array<Array<any>>();
    for (const row of result) {
      const cols = Object.values(row);
      for (let i = 0; i < cols.length; i++) {
        cols[i] = cols[i] ?? "null";
      }
      body.push(cols);
    }
    table.body(body);
    table.padding(3);
    return table.toString().split("\n");
  };

  const openOutputBuffer = async (denops: Denops): Promise<number> => {
    const exists = await denops.call("bufexists", "[output]") as boolean;
    if (exists) {
      const bufnr = await denops.call("bufnr", "\\[output\\]");
      ensureNumber(bufnr);
      await denops.cmd(`silent call deletebufline(${bufnr}, 1, "$")`);
      return bufnr;
    }
    await denops.cmd(`new [output]`);
    await denops.cmd(
      `setlocal buftype=nofile noswapfile nonumber bufhidden=wipe nowrap`,
    );
    await denops.cmd(`set ft=mysql-result`);

    const bufnr = await denops.call("bufnr", "\\[output\\]");
    ensureNumber(bufnr);

    const maps = [
      {
        lhs: "q",
        rhs: ":bw<CR>",
        mode: ["n"],
      },
    ];

    for (const map of maps) {
      mapping.map(
        denops,
        map.lhs,
        map.rhs,
        {
          mode: map.mode as Mode[],
          buffer: true,
          silent: true,
        },
      );
    }

    return bufnr;
  };

  denops.dispatcher = {
    async connect(alias: unknown): Promise<void> {
      ensureString(alias);

      const c = clients.get(alias);
      if (c) {
        client = c;
        return;
      }
      const db = config.databases.find((db) => {
        return db.alias === alias;
      });
      if (db) {
        client = await new mysql.Client().connect({
          hostname: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          db: db.dbname,
        });
      } else {
        console.error(`not found config. alias: ${alias}`);
      }
    },

    async updateConfig(): Promise<void> {
      const buffer = await denops.eval(`getline(1, "$")`) as string[];
      const contents = buffer.join("\n");
      if (!contents) {
        console.error(`config doesn't updated because buffer is empty`);
        return;
      }

      try {
        config = readConfig(contents);
        // database names for choising
        databaseNames = config.databases.map((db) => {
          return db.alias;
        });
      } catch (e) {
        console.error(e.toString());
      }
    },

    async openConfig(): Promise<void> {
      await denops.cmd(`tabnew ${configFile}`);
      await autocmd.group(denops, "mysql-update-config", (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          "BufWrite",
          "*",
          `call denops#notify("${denops.name}", "updateConfig", [])`,
        );
      });
    },

    async query(start: unknown, end: unknown): Promise<void> {
      if (!client) {
        const prompt = databaseNames.map((n, i) => {
          return `${i}: ${n}`;
        });
        prompt.push("choise: ");

        const chosen = await denops.call(
          "input",
          prompt.join("\n"),
        ) as string;
        if (chosen === "") {
          console.log("canceled");
          return;
        }
        const idx = Number(chosen);
        ensureNumber(idx);
        if (idx > databaseNames.length) {
          return;
        }

        const name = databaseNames[idx];
        await denops.dispatch(denops.name, "connect", name);
      }

      const text = await denops.eval(`getline(${start}, ${end})`) as string[];
      if (!text || (text.length === 1 && text[0] === "")) {
        console.error("query is empty");
        return;
      }

      try {
        const result = await client.query(text.join("\n"));
        if (result.affectedRows !== undefined) {
          console.log(`Query OK, ${result.affectedRows} rows affected`);
          return;
        } else if (result.length === 0) {
          console.log("0 rows in set");
          return;
        }
        const output = formatResult(result);
        const bufnr = await openOutputBuffer(denops);
        await denops.call("setbufline", bufnr, 1, output);
      } catch (e) {
        console.error(e.toString());
      }
    },
  };
}

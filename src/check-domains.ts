import readline from "readline";
import axios from "axios";

const ALL_TOP_LEVELS = ["io", "com"];
const PREFIXES = ["get"];

function* getDomainVariations(base: string): Generator<string> {
  const [name, passedTopLevel] = base.split(".");
  if (!name) throw new Error(`No name`);
  const topLevels = passedTopLevel ? [passedTopLevel] : [...ALL_TOP_LEVELS];
  const prefixes = /^get/.test(name) ? [] : [...PREFIXES];
  for (const topLevel of topLevels) {
    yield `${name}.${topLevel}`;
    for (const prefix of prefixes) {
      yield `${prefix}${name}.${topLevel}`;
    }
  }
}

enum Ip2WhoisErrorCodes {
  NoDataFound = "106",
}

type Ip2WhoisResponseData = {
  error_code?: Ip2WhoisErrorCodes | string;
  error_message?: string;
  domain?: string;
  status?: string;
  registrar?: { name?: string; url?: string };
  registrant?: { name?: string; organization?: string; email?: string };
};

async function checkDomain(domain: string): Promise<boolean | string> {
  const apiKey = process.env.API_KEY;
  if (typeof apiKey !== "string") {
    throw new Error("Please set API_KEY env variable");
  }
  const response = await axios.get(
    `https://api.ip2whois.com/v1?key=${apiKey}&domain=${domain}`
  );
  const data = response.data as Ip2WhoisResponseData;
  if (typeof data !== "object") {
    return `unexpected response from ip2whois: ${data}`;
  }
  return data.error_code
    ? data.error_code !== Ip2WhoisErrorCodes.NoDataFound
      ? `error ${data.error_code}: ${data.error_message}`
      : true
    : data.registrar
    ? `status: ${data.status}, registrant: ${
        data.registrant?.organization ||
        data.registrant?.name ||
        data.registrant?.email ||
        "<unknown>"
      }, registrar: ${data.registrar.url || data.registrar.name || "<unknown>"}`
    : true;
}

async function start(opts: { lines: string[] }) {
  const domains = opts.lines
    .flatMap((line) => line.split(/\s+/))
    .filter((s) => /\S/.test(s))
    .map((s) => s.toLocaleLowerCase())
    .flatMap((domain) => Array.from(getDomainVariations(domain)));
  const results = await Promise.all(
    domains.map(async (domain) => [domain, await checkDomain(domain)])
  );
  console.log(Object.fromEntries(results));
}

(() => {
  const lines: string[] = [];
  readline
    .createInterface({ input: process.stdin })
    .on("line", (input) => lines.push(input))
    .on("close", () => {
      start({ lines })
        .then(() => process.exit(0))
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    });
})();

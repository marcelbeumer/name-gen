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

type Result = {
  domain: string;
  available: boolean;
  registrar?: string;
  registrant?: string;
};

type Ip2WhoasResponseData = {
  error_code?: string;
  domain?: string;
  registrar?: { name: string };
  registrant?: { name: string };
};

async function checkDomain(domain: string): Promise<Result> {
  const apiKey = process.env.API_KEY;
  if (typeof apiKey !== "string") {
    throw new Error("Please set API_KEY env variable");
  }
  const response = await axios.get(
    `https://api.ip2whois.com/v1?key=${apiKey}&domain=${domain}`
  );
  const data = response.data as Ip2WhoasResponseData;
  if (typeof data !== "object") {
    throw new Error(`Unexpected response from ip2whois: ${data}`);
  }
  const result: Result = {
    domain,
    available: !data.registrant,
  };
  if (!result.available) {
    result.registrant = data.registrant?.name;
    result.registrar = data.registrar?.name;
  }
  return result;
}

async function start(opts: { lines: string[] }) {
  const domains = opts.lines
    .flatMap((line) => line.split(/\s+/))
    .filter((s) => /\S/.test(s))
    .map((s) => s.toLocaleLowerCase())
    .flatMap((domain) => Array.from(getDomainVariations(domain)));
  const results = await Promise.all(domains.map(checkDomain));
  const report = results.reduce<Record<string, boolean | string>>((p, c) => {
    p[c.domain] = c.available ? true : `${c.registrant} (${c.registrar})`;
    return p;
  }, {});
  console.log(report);
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

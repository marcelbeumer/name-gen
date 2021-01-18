import readline from "readline";

function chunkWord(word: string): string[] {
  const a = "[euioa]";
  const r = "[^euioa]";
  const xr = "([qwtpdfgkcb]r|chr?|str?)";
  const rx = "r[tpsdfgklzbnm]";
  return [
    // ar, aar
    ...(word.match(new RegExp(`${a}${r}`, "g")) ?? []),
    ...(word.match(new RegExp(`${a}{2,}${r}`, "g")) ?? []),
    // ra, raa
    ...(word.match(new RegExp(`${r}${a}`, "g")) ?? []),
    ...(word.match(new RegExp(`${r}${a}{2,}`, "g")) ?? []),
    // rar, raar
    ...(word.match(new RegExp(`${r}${a}${r}`, "g")) ?? []),
    ...(word.match(new RegExp(`${r}${a}{2,}${r}`, "g")) ?? []),
    // case ark, aark, arp, ...
    ...(word.match(new RegExp(`${a}${rx}`, "g")) ?? []),
    ...(word.match(new RegExp(`${a}{2,}${rx}`, "g")) ?? []),
    // case kra, kraa, pra, ...
    ...(word.match(new RegExp(`${xr}${a}`, "g")) ?? []),
    ...(word.match(new RegExp(`${xr}${a}{2,}`, "g")) ?? []),
  ];
}

function* allCombinations(
  chunks: Iterable<string>,
  min: number,
  max: number,
  _last: string = "",
  _depth: number = 0
): Generator<string> {
  for (const chunk of chunks) {
    const str = `${_last}${chunk}`;
    yield str;
    if (_depth < max - 1) {
      yield* allCombinations(chunks, min, max, str, _depth + 1);
    }
  }
}

function* getVariations(names: string[]): Generator<string> {
  for (const name of names) {
    if (/r$/.test(name)) {
      yield `${name}t`;
      yield `${name}s`;
    }
  }
}

async function start(opts: {
  lines: string[];
  minCombi: number;
  maxCombi: number;
  minLen: number;
  maxLen: number;
}) {
  const chunks = opts.lines
    .flatMap((line) => line.split(/\s+/))
    .flatMap(chunkWord);
  const combinations = Array.from(
    allCombinations(chunks, opts.minCombi, opts.maxCombi)
  );
  const withVariations = [...combinations, ...getVariations(combinations)];
  const names = Array.from(
    new Set(
      withVariations.filter(
        (name) => name.length >= opts.minLen && name.length <= opts.maxLen
      )
    )
  ).sort();
  console.log(names.join("\n"));
}

(() => {
  const lines: string[] = [];
  readline
    .createInterface({ input: process.stdin })
    .on("line", (input) => lines.push(input))
    .on("close", () => {
      start({ lines, minCombi: 1, maxCombi: 2, minLen: 3, maxLen: 8 })
        .then(() => process.exit(0))
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    });
})();

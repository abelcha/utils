#!/bin/env bun
import { args } from "/me/dev/abel/args";
import { camelCase, last, toLower } from "/me/dev/abel/utils";
import { charmColors, fgray, fgreen, forange, fpink, fred, fyellow } from "./clog";
import { lineGenerator, lines } from "./line-generator";
const cmd = ['7zz', 'l', '-slt', Bun.argv.pop()]
// console.log(cmd)
const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'ignore', 
  onExit(subprocess, exitCode, signalCode, error) {
      if (!exitCode) {
        console.error(error)
        process.exit(exitCode)
      }    
  },
      })
type Line = {
  path: string;
  size: number;
  packedSize: number;
  accessed: string;
  modified: string;
  mode: string;
  folder: string;
  name: string;
};

const xparse = (key, value) => {
  if (key.endsWith("ize")) {
    return parseInt(value) || 0;
  }
  if (key.endsWith("ed")) {
    const dt = new Date(value);
    return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
  }
  return value;
};

let rtn: Line[] = [];
// let proc = 0
let index = 0;


const maxDepth = args["max-depth"] || 2;
for await (let line of lineGenerator(proc.readable)) {
  // console.log({ line })
  let splited = line.split(" = ");
  if (splited.length !== 2) continue;
  const [key, value] = splited;
  // console.log({ key, value })
  if (key === "Path") {
    index += 1;
    rtn[index] = {};
  }
  const kkey = camelCase(toLower(key));
  rtn[index][kkey] = xparse(kkey, value);
  // console.log({ rtn })
  // console.
  // rtn[index] = {
  //   key,
  //   value,
  // }
}
const formatSize = (size: number) => {
  // also handle pad left and round,  etc, stop decimals after 1000
  const units = ["", "K", "M", "G"];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  const fnsize = i == 2 ? fyellow : i > 2 ? fred : fgreen;
  return fnsize(`${size.toFixed(i == 3 ? 1 : 0)}${units[i]}`.padStart(7));
};
const sizesMap = {};

// const commonDir = rtn[0].path.split('/')[0]
const toDus = rtn
  .filter((e) => {
    const { path, size, mode } = e;
    // console.log({ path, size })
    const depth = path.split("/");
    return mode && mode.match(/\w/)&& last(path)[0] !== '.'  && maxDepth === depth.length;
    // if (e.Path.split('/').length <= maxDepth)
  })
  .map((e) => {
    const [chilCount, tsize, tpackedSize] = rtn
      .filter((x) => x.path.startsWith(e.path) && x.path !== e.path)
      .reduce(
        (acc, x) => {
          acc[0] += 1;
          acc[1] += x.size;
         acc[2] += x.packedSize;
          return acc;
        },
        [0, 0, 0]
      );
    return { ...e, size: e.size + tsize, packedSize: e.packedSize + tpackedSize, childCount: chilCount };
  });
// console.log(JSON.stringify(toDus, null, 2))
// console.log()
// console.table(toDus)
if (!process.stdout.isTTY) {
  console.log(JSON.stringify(toDus, null, 2));
  process.exit();
}
console.table(
  toDus.map((e) => {
    return Object.values({
      path: e.path.split("/").slice(1).join("/"),
      date: e.modified.slice(0, 10),
      size: formatSize(e.size),
      packedSize: formatSize(e.packedSize),
      childCount: e.childCount,
    });
  }),
  // { defaultAlign: "left", borderStyle: "solid" }
);

// console.log(rtn)

// console.log('ok', lines())
// Bun.write('/dev/stdout', )

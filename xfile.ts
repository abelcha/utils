import { readableStreamToJSON, readableStreamToText, spawn, type BunFile, type FileSink } from 'bun';
// Writable(
// stream.

// import * as J from './node_modules/@cdauth/json-stream-es/src/index'
// J.
// const slr = new J.JsonSerializer()

// J
import { ZSTDCompress, ZSTDDecompress } from 'simple-zstd';

import { createWriteStream } from 'fs';
import { Readable } from 'node:stream';
// import * as J from "@std/json";
// console.log({ J })






import fs from 'node:fs';
// cimport {R }from 'remeda'
import path from 'node:path';
// import { compress, init } from '@bokuweb/zstd-wasm';

import { range } from 'lodash';
import * as J2C from '@json2csv/node';
// import type { Simplify } from 'remeda/dist/types/type-fest/simplify';
// import * as J from './node_modules/@cdauth/json-stream-es/src';
import { args } from './args';
import { lineGenerator, lines } from './line-generator';
import { jsonLines, pipedJson } from './piped-json';
import { pipedText } from './piped';
import type { SerializableJsonValue } from '@cdauth/json-stream-es/src';
// import { args } from './args';
// console.log(Bun.peek(promise))



// import { ReturnTypedNode } from 'ts-morph'
// import {a } from 'type-fest'

// class BunFileWrapper extends ReturnTypedNode<Bun.file> {
//     // constructor(private bunFile: File) {
//     //     super(...params); // call the constructor of the File class
//     // }

//     write(data: string | Buffer): Promise<number> {
//         return this.write(data);
//     }

//     existsSync(): boolean {
//         return this.existsSync();
//     }
// }


// R.
// import.meta.
// Bun.

enum CCodec {
  Plain = undefined,
  None = undefined,
  Gzip = 'gzip',
  Zlib = 'zlib',
  Zstd = 'zstd',
  Xz = 'xz',
  Lzfse = 'lzfse'
};
// console.log({ CCodec })
// type dd = Simplify<typeof CCodec>

enum CFormat {
  Json = 'json',
  JsonLines = 'jsonl',
  Tsv = 'tsv',
  Csv = 'csv',
  Parquet = 'parquet',
};
const CompExtMap = {
  zst: CCodec.Zstd,
  zstd: CCodec.Zstd,
  gz: CCodec.Gzip,
  lz4: CCodec.Gzip,
  z: CCodec.Zlib,
  xz: CCodec.Gzip,
  lzf: CCodec.Lzfse,
};

const FormatExtMap = {
  json: CFormat.Json,
  jsonl: CFormat.JsonLines,
  tsv: CFormat.Tsv,
  csv: CFormat.Csv,
  parquet: CFormat.Parquet,
  pq: CFormat.Parquet,
};
export type SerializeOpts = { format: CFormat, encoding: CCodec }

export const parseEncoder = (filename: string): SerializeOpts => {
  const [tokA, tokB] = filename.split(/\.+/).slice(1).slice(-2).toReversed()

  if (tokA in CompExtMap && tokB in FormatExtMap) {
    return { format: FormatExtMap[tokB], encoding: CompExtMap[tokA] }
  }
  if (tokA in FormatExtMap) {
    return { format: FormatExtMap[tokA], encoding: CCodec.Plain }
  }
  return { format: CFormat.Json, encoding: CCodec.Plain }
  throw new Error(`unknown format: ${filename}`)
}


// console.log({ Codec })
// enum ExtCodecs { 


type WriteJsonOptions = {
  pretty?: boolean;
  compression?: CCodec;
  createPath?: boolean
}



export class Xfile {
  // parsed: ParsedPath
  // abspath: string
  filepath: string
  base: string
  dir: string
  ext: string
  file: BunFile

  constructor(filepath: string, baseSize = 1) {
    // this.abspath = path.resolve(filepath)
    // this.parsed = path.parse(filepath);
    this.filepath = filepath
    const parsed = path.parse(filepath)
    this.base = parsed.base.split('.').slice(0, baseSize).join('.')
    this.ext = parsed.base.split('.').slice(baseSize).join('.')
    this.dir = parsed.dir
    this.file = Bun.file(filepath)
  }
  private nameWithExt = (ext: string) => this.base + (ext.startsWith('.') ? ext : `.${ext}`)
  private pathWithExt = (ext: string) => path.join(this.dir, this.nameWithExt(ext))
  private fileWithExt = (ext: string) => new Xfile(this.pathWithExt(ext))
  getNthPath = (template: string, n: number) => this.fileWithExt(template.replace('{}', n.toString()))
  getNextSibling = (template = `${this.ext}.{}`, limit = 1000) => {
    let nextfile: Xfile | undefined;
    for (let i of range(1, limit)) {
      const nextpath = template.replace('{}', i.toString())
      nextfile = this.fileWithExt(nextpath)
      if (nextfile.existsSync() === false) {
        return nextfile
      }
    }
    throw new Error(`No more files found after ${limit} iterations`)
  }
  induceSerialization = (content: any) => {


    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2)
    }
    return content
  }

  getSibling = (ext: string) => this.fileWithExt(ext)
  // file = () => this.fileWithExt(this.ext)
  hasSibling = (ext: string) => this.fileWithExt(ext).existsSync();
  // formatContent = (content: any) => {
  //     if (typeof content === 'object') {
  //         return JSON.stringify(content, null, 2)
  //     }
  // }

  writeTabular = async (content: any) => {
    return new Promise((resolve, reject) => {
      const { format, encoding } = parseEncoder(this.filepath)
      // console.log({ format, encoding, fp: this.filepath })
      if (format === CFormat.Csv || format === CFormat.Tsv) {
        const output = createWriteStream(this.filepath, { encoding: 'utf8' });
        console.log('writing csv')
        const parser = new J2C.Transform({
          delimiter: format === CFormat.Csv ? ',' : '\t',
        })
        const input = Readable.from(JSON.stringify(content))
        let processing = input.pipe(parser);
        if (encoding === CCodec.Zstd) {
          processing.pipe(ZSTDCompress(6)).pipe(output)
        } else if (encoding === CCodec.Plain) {
          console.log('writing plain')
          processing.pipe(output)
        } else {
          throw new Error(`Unsupported encoding: ${encoding}`)
        }
        return processing.on('finish', resolve).on('error', reject)
      }
      throw new Error(`Unsupported format: ${format}`)
    })
  }

  writeEncoded = (content: any) => {
    const { format, encoding } = parseEncoder(this.filepath)
    console.log({ format, encoding })
    const output = createWriteStream(this.filepath, { encoding: 'utf8' })
    const parser = new J2C.Transform()
    const input = Readable.from(JSON.stringify(content, null, 2))
    const processor = input.pipe(parser)
      .pipe(ZSTDCompress(3))
      .pipe(output)
    return processor

  }

  writeEncode = async (content: J.SerializableJsonValue, opts: WriteJsonOptions = { pretty: true }) => {
    return new Promise((resolve, reject) => {
      const re = parseEncoder(this.filepath)
      const encoding = opts?.compression || re?.encoding
      const output = createWriteStream(this.filepath, { encoding: 'utf8' });
      console.log({ encoding, p: this.filepath })
      // let processing = Readable.from(J.stringifyJsonStream(content) as any)
      let processing = Readable.from(
        re.format == CFormat.JsonLines ? content.map(JSON.stringify).join(',\n') :
          JSON.stringify(content))
      // if (args.stringify) {
      // processing = Readable.from(JSON.stringify(content))
      //     console.log('writing stringify')
      // }
      if (args.spawn) {
        console.log('writing spawn')
        const sp = Bun.spawn(["zstd", "-", "-6", "--stdout"], {
          stdin: processing,
          stdout: this.file,
          onExit(proc, exitCode, signalCode, error) {
            console.error({ exitCode, signalCode, error })
            return exitCode === 0 ? resolve(exitCode) : reject(error)
          },
        })
        // sp.stdin?.write(JSON.stringify(content))
        return sp.exited
        // await sp.exited 
        // console.log(sp.stderr)
        // console.log(sp.stdout)
        // sp.stdout.pipeTo()
      }
      // return
      if (encoding) {
        if (encoding === CCodec.Zstd) {
          processing.pipe(ZSTDCompress(6)).pipe(output)
        } else {
          return reject(`Unsupported encoding: ${encoding}`)
        }

      } else {
        processing.pipe(output)
      }
      return processing
        .on('close', resolve).on('error', reject)
        .on('finish', resolve).on('error', reject)
    })
  }

  writeJson = async (content: any, opts: WriteJsonOptions = { pretty: true, compression: CCodec.None }) => {
    let formatted = opts.pretty ? JSON.stringify(content, null, 2) : JSON.stringify(content)

    return this.writeFile(formatted, { compression: opts.compression })
  }
  static from = (filepath: string) => new Xfile(filepath)

  writeFile = async (content: string | ArrayBufferLike | Uint8Array, opts: { compression?: CCodec }) => {
    const { compression } = opts
    // if (compression === 'zstd') {
    //      if (!this.zstdInit) {
    //          await init()
    //          this.zstdInit = true
    //      }
    // return Bun.write(this.file, compress(Buffer.from(content)), { createPath: true })
    // }
    if (compression === CCodec.Gzip) {
      content = Bun.gzipSync(content as any)
    } else if (compression === CCodec.Zlib) {
      content = Bun.deflateSync(content as any)
    } else if (compression) {
      throw new Error(`Unsupported compression: ${compression} ${this.filepath}`)
    }
    // console.log("WRITEFILE", { content })
    return Bun.write(this.filepath, content, { createPath: true })
  }
  // export async function* lineGenerator(stream: ReadableStream, decoder = new TextDecoder()) {

  jsonLines = function() {
    const { encoding, format } = parseEncoder(this.filepath)
    if (encoding === CCodec.Zstd) {
      const proc = Bun.spawn(["zstdcat", "--memory", "512MB", this.filepath]);
      return pipedJson(pipedText(proc.readable))
    }
    throw new Error(`unsupported format ${encoding} ${format} ${this.filepath} `)
  }

  lines = function() {
    const { encoding, format } = parseEncoder(this.filepath)
    if (encoding === CCodec.Zstd) {
      const proc = Bun.spawn(["zstd", "-d", this.filepath, '--stdout']);
      return lineGenerator(proc.readable)
    }
    if (!encoding) {
      return lines(this.file)
    }
    throw new Error(`unsupported forma ${encoding} ${format} ${this.filepath}`)
  }


  JsonLineWritter = function() {
    const { encoding } = parseEncoder(this.filepath)
    let sink: FileSink;
    if (encoding === CCodec.Zstd) {
      const proc = Bun.spawn(['zstd', '-',
        '-B256MB',
        '--single-thread',
        '-o', this.filepath, '-f'], {
        stdin: 'pipe',
        stdout: 'ignore',
        stderr: 'ignore'
      })
      sink = proc.stdin
    } else {
      sink = Bun.file(this.filepath).writer()
    }
    const encoder = new TextEncoder()
    return {
      sink,
      end:() => sink.end(),
      flush: () => sink.flush(),
      write: async (obj: SerializableJsonValue) => {
        const content = encoder.encode(JSON.stringify(obj) + '\n')
        const rtn = sink.write(content)
        if (typeof rtn !== 'number')
          await rtn
        return rtn
      }

    }
  }


  updateJson = async (fn: (content: any) => any, opts: WriteJsonOptions = { pretty: true, compression: CCodec.None }) => {
    const base = !this.existsSync() ? {} : await this.file.json()
    let content = await fn(base)
    return this.writeJson(content, opts)
  }

  readJsonSync = () => {
    return JSON.parse(fs.readFileSync(this.filepath, 'utf-8'))
  }
  readJson = async () => {
    return this.file.json()
  }

  existsSync = () => fs.existsSync(this.filepath)
}


// export const xfile = (...params) => Bun.file(...params)

if (import.meta.main) {



  // console.log()
  const path = args._[0]
  const file = new Xfile(path)
  // const resp = file.lines()
  // console.log({ resp })
  // const rdr = file.lines()
  for await (let li of file.jsonLines()) {
    console.log({ li })
  }

  // console.log({ file })
  // const cont = await Bun.file(args.input)
  // console.time('write')
  // await file.writeEncode(cont, { pretty: true })
  // console.timeEnd('write')
  process.exit(0)
  // process.exit(0)
  // if (path.includes('json')) {
  // } else
  // await file.writeTabular(require('/me/datasets/entreprise/finalx.json'))
  // console.log('here', file.filepath, file.existsSync())
  // const nextfiel = file.getNextSibling("{}.json.gz")
  // console.log({ nextfiel })
  // await nextfiel.writeJson({ hello: 'world', date: new Date() }, { compression: 'gzip' })
  // sib.writeJson({ hello: 'world' })
  // console.log(await sib.file.json())
  // console.log('has', await sib.file().exists())
  // sib.file().writer().write(JSON.stringify({ hello: 'world' }, null, 2))
  // sib.getNextSibling().then(e => console.log('next', e))
  // console.log(sib.nameWithExt('.jsonx'))

}

export default Xfile

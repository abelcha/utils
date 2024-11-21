import { padEnd } from "lodash";
import c from "./colors"



export const getTS = () => {
  const now = new Date();
  return `[${now.getHours().toLocaleString(undefined, { minimumIntegerDigits: 2 })
    }:${now.getMinutes().toLocaleString(undefined, { minimumIntegerDigits: 2 })
    }:${now.getSeconds().toLocaleString(undefined, { minimumIntegerDigits: 2 })
    }.${now.getMilliseconds()
    }]`
}

const padded = (str: string, length: number) => padEnd(str.slice(0, length), length, " ")

const hd = new Set([]);

const s = Bun.serve({
  port: process.env.PORT || 80,
  async fetch(req: Request) {
    // Response
    const body = await Promise.resolve(req.clone().text())
      .then(async body => JSON.parse(body))
      .catch(() => req.text())

    const url = new URL(req.url)
    const ua = req.headers.get("user-agent")
    console.log(
      c.blue(`${getTS()}`),
      c.yellow(ua?.split('/')[0]),
      c.green(url.pathname),
      ...Array.from(url.searchParams.entries())
        .map(([k, v]) => `${c.dim(k + ':')}${c.magenta(v)}`),
    )
    if (!hd.has(req.headers.toString())) {
      hd.add(req.headers.toString())
      console.log(req.headers.toJSON())
    }
    if (body) {
      console.log(body)

    }
    return new Response("OK")
  }
})
console.log('Listening on port ', s.port)
// console.log("fetch('http://console.log/toto', { query: { a: 1, b: 2 } })")

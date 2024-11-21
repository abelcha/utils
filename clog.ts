import * as ansis from "ansis";
import { mapValues, pick } from "lodash";

export const charmColors = {
    green: "#A8CC8C",
    teal: "#8be9fd",
    yellow: "#DBAB79",
    blue: "#71BEF2",
    magenta: "#D290E4",
    cyan: "#66C2CD",
    gray: "#B9BFCA",
    orange: "#FFA500",
    purple: "#bd93f9",
    sandstorm: "#F0E68C",
    dime: "#6272a4",
    pink: "#ff79c6",
    dd: "#ffc777",
    red: "#E6194B",
    // #282a36
    // #44475a
    // #f8f8f2
    // #6272a4

    // #50fa7b
    // #ffb86c
    // #ff79c6
    // #f1fa8c
}


const clogger = (color = ansis.bgBlue) => (...args) => console.log(...args.map(z => typeof z === 'object' ? z : color(z)))


export const fgreen = ansis.hex(charmColors.green)
export const cgreen = clogger(fgreen)

export const fyellow = ansis.hex(charmColors.yellow)
export const cyellow = clogger(fyellow)

export const fblue = ansis.hex(charmColors.blue)
export const cblue = clogger(fblue)

export const fmagenta = ansis.hex(charmColors.magenta)
export const cmagenta = clogger(fmagenta)

export const fcyan = ansis.hex(charmColors.cyan)
export const ccyan = clogger(fcyan)

export const fgray = ansis.hex(charmColors.gray)
export const cgray = clogger(fgray)

export const fred = ansis.hex(charmColors.red)
export const cred = clogger(fred)

export const forange = ansis.hex(charmColors.orange)
export const corange = clogger(forange)

export const fpurple = ansis.hex(charmColors.purple)
export const cpurple = clogger(fpurple)


export const fpink = ansis.hex(charmColors.pink)
export const cpink = clogger(fpink)

export const fdime = ansis.hex(charmColors.dime)
export const cdime = clogger(fdime)

const createx = (hex: ansis.Ansis) => ({
    log: clogger(hex),
    fmt: hex
})
const xmap = {
    "FBK": createx(fdime),
    "LNK": createx(fgreen),
    "JBS": createx(fpink),
    "BDV": createx(forange),
    "DZR": createx(fyellow),
    "REK": createx(fred),
}

export const colog = (s: string) => {
    if (!xmap[s]) {

        const num = Bun.hash.adler32(Buffer.from(s))
        const colornames = Object.keys(charmColors)
        const colorIndex = colornames[num % colornames.length]
        const cl = ansis.hex(charmColors[colorIndex]);
        xmap[s] = {
            log: clogger(cl),
            fmt: cl
        }
    }
    return xmap[s]
}

const RainbowColor = ['#E6194B', '#3CB44B', '#FFE119', '#0082C8', '#FABEBE', '#46F0F0', '#F032E6', '#008080', '#F58231', '#FFFFFF',]

export const rainbowify = (arr: any[]) => {
    return arr.map((e, i) => {
        // [e, RainbowColor[i % RainbowColor.length]]).join(',')
        const colorize = ansis.hex(RainbowColor[i % RainbowColor.length])
        return colorize(e)
    }).join(',')
}


if (import.meta.main) {
    const dsids = ["VAL", "MEY", "PTM", "FLX", "JED", "ROS", "WVY", "EDX", "ILO", "MST", "52K", "INS", "FDA", "PUB", "TAK", "PST", "FFR", "SEL", "CAB", "COV", "SED", "ZEV", "LUM", "REK", "BDV", "SFR", "SLP", "NRG", "JBS", "DZR", "LNK", "FBK"]
        .map(e => colog(e).fmt(e))
    console.table(dsids)
}
const OSC = "\u001B]";
const SEP = ";";
const BEL = "\u0007";
export const link = (text = "", url = "") => [OSC, "8", SEP, SEP, url, BEL, text, OSC, "8", SEP, SEP, BEL].join("");

export default link

import { pipedText } from "./piped";

export function parse(string: string) {
    try {
        return JSON.parse(string);
    } catch (e) {
        throw new Error(
            `Expected ndjson but received "${string}"`
        );
    }
}


export async function* jsonLines(
    readable: ReadableStream<Uint8Array> | NodeJS.ReadableStream | null
) {
    for await (const json of pipedJson(pipedText(readable))) {
        yield json;
    }
}

export function parseLines(string: string) {
    const lines = [];
    for (const line of string.split(NEW_LINE)) {
        if (line !== '') lines.push(parse(line));
    }
    return lines;
}


export const NEW_LINE = '\n';

export async function* pipedJson(iterator: AsyncGenerator<string>) {
    let leftover = '';

    for await (const value of iterator) {
        let start = 0;
        let end = 0;
        const chunk = (leftover += value);

        while ((end = chunk.indexOf(NEW_LINE, start)) !== -1) {
            const line = chunk.substring(start, end);
            yield parse(line);
            start = end + NEW_LINE.length;
        }
        leftover = chunk.substring(start);
    }

    if (leftover) yield parse(leftover);
}



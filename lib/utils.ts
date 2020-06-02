import { lookup } from "../deps.ts";

import { Params } from "./@types/snowlight.ts";

export type Match = (pattern: string) => (path: string) => Params;

export const parser_params: Match = (pt: string) => {
  const pattern = pt.split("/");

  return (p) => {
    const path = p.split("/");

    if (pattern.length !== path.length) {
      return null;
    }

    const params: any = {};

    for (let i = 1; i < pattern.length; i++) {
      const p = pattern[i];

      if (p[0] === ":") {
        const name = p.slice(1).trim();

        params[name] = path[i];
      } else if (p !== path[i]) {
        return null;
      }
    }

    return params;
  };
};

export function is_html(value: string): boolean {
  return /^\s*<(?:!DOCTYPE|html|body)/i.test(value);
}

export function mimeType(contentType: string): { type: string, subtype: string, suffix?: string } {
  const regexp = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;

  if (contentType.includes(";")) {
    contentType = contentType.split(";")[0];
  }

  if (contentType[0] === "+") {
    contentType = `*/*${contentType}`;
  }

  const finalType = contentType.includes("/") ? contentType : lookup(contentType);

  const match = regexp.exec(finalType!.toLowerCase());

  if (!match) {
    throw new TypeError("Invalid media type.");
  }

  let [, type, subtype] = match;

  let suffix: string | undefined;

  const idx = subtype.lastIndexOf("+");

  if (idx !== -1) {
    suffix = subtype.substr(idx + 1);
    subtype = subtype.substr(0, idx);
  }

  return { type, subtype, suffix };
}
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

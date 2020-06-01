import { join } from "../deps.ts";

import { Next, defaultOptions } from "./@types/snowlight.ts";

import Request from "./request.ts";
import Response from "./response.ts";

export const static_content = (dir: string, options = defaultOptions) => {
  return async (req: Request, res: Response, next: Next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (options?.fallthrough) {
        return next();
      }

      res.headers.append("Allow", "GET, HEAD");
      res.headers.append("Content-Length", "0");

      return res.sendStatus(405);
    }

    let file = req.url.slice(req.offsetGet("original_path").length);
    if (file === "" && options?.index) {
      file = options.index;
    }

    const filePath = join(dir, file);

    try {
      const stats: Deno.FileInfo | null = await Deno.stat(filePath);

      res.headers.set("Content-Length", String(stats.size));

      if (options?.lastModified) {
        res.headers.set("Last-Modified", stats!.mtime!.toUTCString());
      }
    } catch (err) {
      return next(err);
    }

    if (options?.maxAge) {
      const cache = [`max-age=${(options.maxAge / 1000) | 0}`];
      if (options.immutable) {
        cache.push("immutable");
      }

      res.headers.set("Cache-Control", cache.join(","));
    }

    try {
      return res.file(filePath);
    } catch (err) {
      return next(err);
    }
  };
};

export const json = () => {
  return async (req: Request, res: Response, next: Next): Promise<any> => {
    if (req.isJson()) {
      try {
        const rawBody = await Deno.readAll(req.body);

        const bodyText = new TextDecoder().decode(rawBody);

        req.body = JSON.parse(bodyText);
      } catch (err) {
        return next(err);
      }
    }

    return next();
  };
};

export const urlencoded = () => {
  return async (req: Request, res: Response, next: Next): Promise<any> => {
    if (req.isForm()) {
      try {
        const form = new URLSearchParams(new TextDecoder().decode(req.body));

        const data: any = {};
        for (const [name, value] of form.entries()) {
          data[name] = value;
        }

        req.body = data;
      } catch (err) {
        return next(err);
      }
    }

    return next();
  };
};

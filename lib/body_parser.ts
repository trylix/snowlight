import { join } from "https://deno.land/std/path/mod.ts";

import Request from "./request.ts";
import Response from "./response.ts";

import { Next } from "./pipeline.ts";

export const static_content = (dir: string) => {
  return async (req: Request, res: Response, next: Next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.headers.append("Allow", "GET, HEAD");
      res.headers.append("Content-Length", "0");
      res.sendStatus(405);
      return;
    }

    const filePath = join(dir, req.url.slice(req.extra?.originalPath.length));

    try {
      await res.file(filePath);
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
        return next(err)
      }
    }

    return next();
  };
};

export const urlencoded = () => {
  return async (req: Request, res: Response, next: Next): Promise<any> => {
    if (req.isForm()) {
      try {
        const form = new URLSearchParams(
          new TextDecoder().decode(req.body)
        );

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

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
    if (req.headers.get("Content-Type") === "application/json") {
      try {
        const rawBody = await Deno.readAll(req.body);

        const bodyText = new TextDecoder().decode(rawBody);

        req.body = JSON.parse(bodyText);
      } catch (e) {
        return res.status(400).json({
          message: e,
        });
      }
    }

    return next();
  };
};

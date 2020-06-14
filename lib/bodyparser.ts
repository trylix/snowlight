import { join } from "../deps.ts";

import { IRequest, IResponse, Next, defaultOptions } from "./types.ts";

export const static_content = (dir: string, options = defaultOptions) => {
  return async (req: IRequest, res: IResponse, next: Next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (options?.fallthrough) {
        return next();
      }

      res.headers.append("Allow", "GET, HEAD");
      res.headers.append("Content-Length", "0");

      return res.sendStatus(405);
    }

    let fileName = req.url.slice(req.offsetGet("original_path").length);
    if (fileName === "" && options?.index) {
      fileName = options.index;
    }

    const filePath = join(dir, fileName);

    try {
      const fileInfo: Deno.FileInfo | null = await Deno.stat(filePath);

      if (fileInfo.isDirectory && options?.redirect) {
        return res.redirect(req.offsetGet("original_path"));
      } else {
        return res.sendStatus(403);
      }

      res.headers.set("Content-Length", String(fileInfo?.size));

      if (options?.lastModified) {
        res.headers.set("Last-Modified", fileInfo!.mtime!.toUTCString());
      }
    } catch (err) {
      return next(err);
    }

    if (options?.maxAge) {
      const cache = [`max-age=${(options.maxAge! / 1000) | 0}`];
      if (options.immutable) {
        cache.push("immutable");
      }

      res.headers.set("Cache-Control", cache.join(","));
    }

    try {
      return res.sendFile(filePath);
    } catch (err) {
      return next(err);
    }
  };
};

export const json = () => {
  return async (req: IRequest, res: IResponse, next: Next): Promise<any> => {
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
  return async (req: IRequest, res: IResponse, next: Next): Promise<any> => {
    if (req.isForm()) {
      try {
        const rawBody = await Deno.readAll(req.body);

        const bodyText = new TextDecoder().decode(rawBody);

        const form = new URLSearchParams(bodyText.replace(/\+/g, " "));

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

export const text = () => {
  return async (req: IRequest, res: IResponse, next: Next): Promise<any> => {
    if (req.isText()) {
      try {
        const rawBody = await Deno.readAll(req.body);

        const bodyText = new TextDecoder().decode(rawBody);

        req.body = bodyText;
      } catch (err) {
        return next(err);
      }
    }

    return next();
  };
};

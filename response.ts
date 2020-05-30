const { stat, open, readFile } = Deno;

import {
  Response as HttpResponse,
  ServerRequest,
} from "https://deno.land/std/http/server.ts";
import { extname as pathExtname } from "https://deno.land/std/path/mod.ts";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

export class Response {
  private statusCode = 200;

  headers = new Headers();
  body?: string | Uint8Array | Deno.Reader;
  resources: Deno.Closer[] = [];

  constructor(private request?: ServerRequest) {}

  status(statusCode: number): this {
    this.statusCode = statusCode;
    return this;
  }

  sendStatus(statusCode: number): this {
    this.statusCode = statusCode;

    return this;
  }

  send(body: any): this {
    this.body = body;

    return this;
  }

  html(content: any): this {
    this.headers.append("Content-Type", "text/html; charset=utf-8");
    this.body = content;

    return this;
  }

  json(json: any): this {
    this.headers.append("Content-Type", "application/json");
    this.body = JSON.stringify(json);

    return this;
  }

  async file(
    filePath: string,
    transform?: (src: string) => string,
  ): Promise<void> {
    const notModified = false;
    if (notModified) {
      this.statusCode = 304;
      return;
    }

    const extname: string = pathExtname(filePath);
    const contentType: any = lookup(extname.slice(1)) || "";
    const fileInfo = await stat(filePath);

    if (!fileInfo.isFile) {
      return;
    }

    this.headers.append("Content-Type", contentType);

    if (transform) {
      const bytes = await readFile(filePath);

      let str = new TextDecoder().decode(bytes);
      str = transform(str);

      this.body = new TextEncoder().encode(str);
    } else {
      const file = await open(filePath);

      this.resources.push(file);
      this.body = file;
    }
  }

  async close() {
    for (const resource of this.resources) {
      resource.close();
    }

    this.request = undefined;
    this.body = undefined;
    this.resources = [];
  }

  makeResponse(): HttpResponse {
    let { statusCode = 200, headers, body = new Uint8Array(0) } = this;
    if (typeof body === "string") {
      body = new TextEncoder().encode(body);
      if (!headers.has("Content-Type")) {
        headers.append("Content-Type", "text/plain; charset=utf-8");
      }
    }

    return { status: statusCode, headers, body };
  }
}

export { Response as default };

import {
  ServerRequest,
  Response as HttpResponse,
  extname,
  lookup,
} from "../deps.ts";

const { stat, open, readFile } = Deno;

import { is_html } from "./utils.ts";

export class Response {
  private statusCode = 200;

  headers = new Headers();
  body?: string | Uint8Array | Deno.Reader;
  resources: Deno.Closer[] = [];

  constructor(private request?: ServerRequest) {}

  header(key: string, value: string, replace: boolean = true): this {
    const header = this.headers.get(key);
    if (!header || (header && replace)) {
      this.headers.set(key, value);
    }

    return this;
  }

  getHeaders(): Headers {
    return this.headers;
  }

  status(statusCode: number): this {
    this.statusCode = statusCode;
    return this;
  }

  send(body?: any, statusCode?: number): this {
    this.statusCode = statusCode ?? this.statusCode;

    if (body) {
      switch (typeof body) {
        case "string": {
          this.body = new TextEncoder().encode(body);
          if (is_html(body)) {
            this.headers.append("Content-Type", "text/html; charset=utf-8");
          } else {
            this.headers.append("Content-Type", "text/plain; charset=utf-8");
          }
          break;
        }
        default: {
          this.body = new TextEncoder().encode(JSON.stringify(body));
          this.headers.append("Content-Type", "application/json");
          break;
        }
      }
    }

    return this;
  }

  sendStatus(statusCode: number): this {
    return this.send(undefined, statusCode);
  }

  json(body: any): this {
    return this.send(body);
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

    const ext: string = extname(filePath);
    const contentType: any = lookup(ext.slice(1)) || "";
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

    return { status: statusCode, headers, body };
  }
}

export { Response as default };

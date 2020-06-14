import { Response as HttpResponse, extname, lookup } from "../deps.ts";

import Request from "./request.ts";

import { IResponse } from "./types.ts";
import { is_html } from "./utils.ts";

export class Response implements IResponse {
  private statusCode = 200;

  body?: string | Uint8Array | Deno.Reader;
  headers = new Headers();
  resources: Deno.Closer[] = [];

  constructor(private request: Request) {}

  header(key: string, value: string, replace: boolean = true): this {
    const header = this.headers.get(key);
    if (!header || (header && replace)) {
      this.headers.set(key, value);
    }

    return this;
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

  json(body: any): this {
    return this.send(body);
  }

  redirect(url: string | "back"): this {
    if (url === "back") {
      url = this.request.headers.get("Referrer") || "/";
    }

    this.headers.set("Location", encodeURI(url));

    if (this.request.acceptsHtml()) {
      this.headers.set("Content-Type", "text/html; charset=utf-8");
      this.body = `Redirecting to <a href="${url}">${url}</a>.`;
    } else {
      this.headers.set("Content-Type", "text/plain; charset=utf-8");
      this.body = `Redirecting to ${url}.`;
    }

    this.statusCode = 301;

    return this.send();
  }

  sendStatus(statusCode: number): this {
    this.statusCode = statusCode;
    return this.send();
  }

  async sendFile(filePath: string): Promise<this> {
    const ext: string = extname(filePath);
    const contentType: any = lookup(ext.slice(1)) || "";

    this.headers.append("Content-Type", contentType);

    const file = await Deno.open(filePath);

    this.resources.push(file);
    this.body = file;

    return this.send();
  }

  async close() {
    for (const resource of this.resources) {
      resource.close();
    }

    this.body = undefined;
    this.resources = [];
  }

  makeResponse(): HttpResponse {
    let { statusCode = 200, headers, body = new Uint8Array(0) } = this;

    return { status: statusCode, headers, body };
  }
}

export { Response as default };

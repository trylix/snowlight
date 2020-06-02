import { ServerRequest } from "../deps.ts";

import { Query, Params, Method } from "./types.ts";

import { mimeType } from "./utils.ts";

export class Request {
  path: string;
  search: string;
  query: Query;
  params!: Params;

  private data: any;
  private offset: { [key: string]: any } = {};

  constructor(public raw: ServerRequest) {
    const url = new URL("http://a.b" + raw.url);

    this.path = url.pathname;
    this.search = url.search;

    const hasBody = raw.headers.has("Content-Length") &&
      raw.headers.get("Content-Length") !== "0";

    this.data = hasBody ? raw.body : new Uint8Array();

    const query: Query = {};

    for (let [k, v] of new URLSearchParams(url.search) as any) {
      if (Array.isArray(query[k])) {
        query[k] = [...query[k], v];
      } else if (typeof query[k] === "string") {
        query[k] = [query[k], v];
      } else {
        query[k] = v;
      }
    }

    this.query = query;
  }

  get method(): Method {
    return this.raw.method as Method;
  }

  get url(): string {
    return this.raw.url;
  }

  get headers(): Headers {
    return this.raw.headers;
  }

  get body(): any {
    return this.data;
  }

  set body(value: any) {
    this.data = value;
  }

  offsetExists(key: string): boolean {
    return Boolean(this.offset[key]);
  }

  offsetGet(key: string): any {
    return this.offset[key];
  }

  offsetSet(key: string, value: any) {
    this.offset[key] = value;
  }

  header(key?: string, def?: string[]): string[] {
    if (!key) {
      const result: string[] = [];
      for (const [h] of this.headers) {
        result.push(h);
      }

      return result;
    }

    const header = this.headers.get(key);
    if (!header) {
      return def ? def : [""];
    }

    return [header];
  }

  hasHeader(key: string): boolean {
    return this.headers.has(key);
  }

  acceptsHtml(): boolean {
    return this.accept("text/html");
  }

  acceptsJson(): boolean {
    return (
      this.accept("application/json") || this.accept("application/ld+json")
    );
  }

  acceptsAnyContentType(): boolean {
    return this.accept("*/*", true) || this.accept("*", true);
  }

  accept(type: string, strict: boolean = false): boolean {
    const [header] = this.header("Accept");
    if (strict) {
      return header.includes(type);
    }
    return (
      header.includes(type) || header.includes("*/*") || header.includes("*")
    );
  }

  isForm(): boolean {
    const [header] = this.header("Content-Type");

    const { type, subtype, suffix } = mimeType(header);

    return type === "application" && (subtype === "x-www-form-urlencoded");
  }

  isJson(): boolean {
    const [header] = this.header("Content-Type");

    const { type, subtype, suffix } = mimeType(header);

    return type === "application" && (subtype === "json" || suffix === "json");
  }

  isText(): boolean {
    const [header] = this.header("Content-Type");

    const { type } = mimeType(header);

    return type === "text";
  }
}

export { Request as default };

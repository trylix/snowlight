import { ServerRequest } from "https://deno.land/std/http/server.ts";

export type Params = { [key: string]: string };

export type Query = { [key: string]: string | string[] };

export class Request {
  path: string;
  search: string;
  query: Query;
  params!: Params;
  extra: any = {};

  private data: any;

  constructor(public raw: ServerRequest) {
    const url = new URL("http://a.b" + raw.url);

    this.path = url.pathname;
    this.search = url.search;

    const hasBody =
      raw.headers.has("Content-Length") &&
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

  get method(): string {
    return this.raw.method;
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
    return header.includes("application/x-www-form-urlencoded");
  }

  isJson(): boolean {
    const [header] = this.header("Content-Type");

    return (
      header.includes("application/json") ||
      header.includes("application/ld+json")
    );
  }
}

export { Request as default };

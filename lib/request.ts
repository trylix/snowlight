import { ServerRequest, Accepts, typeofrequest } from "../deps.ts";

import { IRequest, Query, Params, Method } from "./types.ts";

export class Request implements IRequest {
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
    return Boolean(this.accepts("text/html"));
  }

  acceptsJson(): boolean {
    return Boolean(this.accepts("application/json"));
  }

  accepts(type: string): string[];
  accepts(type: string[]): string[];
  accepts(...type: string[]): string[];
  accepts(): string[] {
    const accept = new Accepts(this.headers);

    return accept.types.apply(accept, arguments as any);
  }

  acceptsCharsets(charset: string): string[];
  acceptsCharsets(charset: string[]): string[];
  acceptsCharsets(...charset: string[]): string[];
  acceptsCharsets(): string[] {
    const accept = new Accepts(this.headers);

    return accept.charsets.apply(accept, arguments as any);
  }

  acceptsEncodings(encoding: string): string[];
  acceptsEncodings(encoding: string[]): string[];
  acceptsEncodings(...encoding: string[]): string[];
  acceptsEncodings(): string[] {
    const accept = new Accepts(this.headers);

    return accept.encodings.apply(accept, arguments as any);
  }

  acceptsLanguages(lang: string): string[];
  acceptsLanguages(lang: string[]): string[];
  acceptsLanguages(...lang: string[]): string[];
  acceptsLanguages(): string[] {
    const accept = new Accepts(this.headers);

    return accept.languages.apply(accept, arguments as any);
  }

  isForm(): boolean {
    return Boolean(typeofrequest(this.headers, ["application/x-www-form-urlencoded"]));
  }

  isJson(): boolean {
    return Boolean(typeofrequest(this.headers, ["json"]));
  }

  isText(): boolean {
    return Boolean(typeofrequest(this.headers, ["text/*"]));
  }
}

export { Request as default };

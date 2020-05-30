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

    this.data = raw.body;

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

  get hasBody(): boolean {
    return (
      this.raw.headers.get("transfer-encoding") !== null ||
      !!parseInt(this.raw.headers.get("content-length") ?? "")
    );
  }
}

export {
  Request as default,
};

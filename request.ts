export type Params = { [key: string]: string };

export type Query = { [key: string]: string | string[] };

export class Request {
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
    return this.data ? this.data : this.raw.r.buf;
  }

  get hasBody(): boolean {
    return (
      this.raw.headers.get("transfer-encoding") !== null ||
      !!parseInt(this.raw.headers.get("content-length") ?? "")
    );
  }

  data: any;
  path: string;
  search: string;
  query: Query;
  params!: Params;

  constructor(public raw: any) {
    const url = new URL("http://a.b" + raw.url);

    this.path = url.pathname;
    this.search = url.search;

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
}

export {
  Request as default,
};

export type Next = (err?: any) => Promise<void>;

export type Params = { [key: string]: string };

export type Query = { [key: string]: string | string[] };

export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export interface Middleware {
  path: string;
  params: (path: string) => any;
  handle: Function;
}

export interface Route {
  path: string;
  methods: Method[];
  params: (path: string) => any;
  handle: Function;
}

export interface StaticOptions {
  index?: string;
  fallthrough?: boolean;
  redirect?: boolean;
  lastModified?: boolean;
  immutable?: boolean;
  maxAge?: number;
}

export const defaultOptions: StaticOptions = {
  index: "index.html",
  fallthrough: true,
  redirect: true,
  lastModified: true,
  immutable: false,
  maxAge: 0,
};

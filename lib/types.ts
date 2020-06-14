import { HTTPOptions } from "../deps.ts";

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

export interface RequestHandler {
  (req: IRequest, res: IResponse, next: Next): Promise<any>;
}

export interface IRouterHandler<T> {
  (...handlers: (string | IRouter | RequestHandler)[]): T;
}

export interface ErrorHandler {
  (err: any, req: IRequest, res: IResponse, next: Next): any;
}

export interface IErrorHandler<T> {
  (...handlers: (string | ErrorHandler)[]): T;
}

export interface IRouterCallback {
  (route: IRouter): void;
}

export interface IRouter {
  group(
    path: string,
    middlewares: RequestHandler | RequestHandler[],
    callback: IRouterCallback
  ): void;
  get: IRouterHandler<IRouter>;
  post: IRouterHandler<IRouter>;
  put: IRouterHandler<IRouter>;
  patch: IRouterHandler<IRouter>;
  delete: IRouterHandler<IRouter>;
  use: IRouterHandler<IRouter>;
  error: IErrorHandler<IRouter>;
}

export interface IApp extends IRouter {
  listen(addr: number | string | HTTPOptions, callback?: Function): void;
  close(): void;
}

export interface IResponse {
  body?: string | Uint8Array | Deno.Reader;
  headers: Headers;

  header(key: string, value: string, replace?: boolean): this;
  status(statusCode: number): this;
  send(body?: any, statusCode?: number): this;
  json(body: any): this;
  redirect(url: string | "back"): this;
  sendStatus(statusCode: number): this;
  sendFile(filePath: string): Promise<this>;
}

export interface IRequest {
  path: string;
  search: string;
  query: Query;
  params: Params;
  method: Method;
  headers: Headers;
  body: any;
  url: string;

  offsetExists(key: string): boolean;
  offsetGet(key: string): any;
  offsetSet(key: string, value: any): void;

  header(key?: string, def?: string[]): string[];
  hasHeader(key: string): boolean;

  acceptsHtml(): boolean;

  acceptsJson(): boolean;

  accepts(type: string): string[];
  accepts(type: string[]): string[];
  accepts(...type: string[]): string[];
  accepts(): string[];

  acceptsCharsets(charset: string): string[];
  acceptsCharsets(charset: string[]): string[];
  acceptsCharsets(...charset: string[]): string[];
  acceptsCharsets(): string[];

  acceptsEncodings(encoding: string): string[];
  acceptsEncodings(encoding: string[]): string[];
  acceptsEncodings(...encoding: string[]): string[];
  acceptsEncodings(): string[];

  acceptsEncodings(encoding: string): string[];
  acceptsEncodings(encoding: string[]): string[];
  acceptsEncodings(...encoding: string[]): string[];
  acceptsEncodings(): string[];

  isForm(): boolean;
  isJson(): boolean;
  isText(): boolean;
}

export const defaultOptions: StaticOptions = {
  index: "index.html",
  fallthrough: true,
  redirect: true,
  lastModified: true,
  immutable: false,
  maxAge: 0,
};

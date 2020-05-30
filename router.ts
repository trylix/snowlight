import { flatten } from "./modules/array_flatten.ts";

import Pipeline, { Next } from "./pipeline.ts";

import Request, { Params } from "./request.ts";
import Response from "./response.ts";

import { parser_params } from "./utils.ts";

export interface Route {
  path: string;
  method: string | undefined;
  params: (path: string) => any;
  handle: Function;
}

export class Router {
  private stack: Route[] = [];

  private route(method: string, path: string, ...params: Function[]) {
    const handles = flatten(Array.prototype.slice.call(arguments, 2));

    handles.forEach(function (this: Router, handle) {
      if (typeof handle !== "function") {
        throw new Error("Router.use() requires a middleware function");
      }

      this.stack.push({
        path,
        method,
        params: parser_params(path),
        handle,
      });
    }, this);

    return this;
  }

  async dispatch(req: Request, res: Response, next: Next) {
    let method = req.method;

    if (method === "HEAD") {
      method = "GET";
    }

    const path = req.path;
    const url = req.url;

    if (
      !(this.stack.filter((element) =>
        element.method !== undefined && element.method === method &&
          element.params(url) ||
        element.method === undefined && path.startsWith(element.path) &&
          element.path !== "/"
      ).length > 0)
    ) {
      res.sendStatus(404);
      return;
    }

    const pipeline = new Pipeline(this.stack, req, res);

    await pipeline.dispatch();
  }

  get(path: string, ...params: Function[]): this {
    return this.route("GET", path, ...params);
  }

  post(path: string, ...params: Function[]): this {
    return this.route("POST", path, ...params);
  }

  put(path: string, ...params: Function[]): this {
    return this.route("PUT", path, ...params);
  }

  patch(path: string, ...params: Function[]): this {
    return this.route("PATCH", path, ...params);
  }

  delete(path: string, ...params: Function[]): this {
    return this.route("DELETE", path, ...params);
  }

  use(...params: (string | Function)[]): this {
    let path = "/";
    let offset = 0;

    if (
      typeof params !== "function" &&
      Array.isArray(params) &&
      params.length !== 0
    ) {
      if (typeof params[0] === "string") {
        path = params[0];
        offset = 1;
      }
    }

    const middlewares = flatten(Array.prototype.slice.call(arguments, offset));

    if (middlewares.length === 0) {
      throw new Error("app.use() requires a middleware function");
    }

    middlewares.forEach(function (this: Router, middleware) {
      if (typeof middleware !== "function") {
        throw new Error("Router.use() requires a middleware function");
      }

      this.stack.push({
        path,
        method: undefined,
        params: parser_params(path),
        handle: middleware,
      });
    }, this);

    return this;
  }
}

export {
  Router as default,
};

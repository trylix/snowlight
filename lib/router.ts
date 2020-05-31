import { Middleware, Route, Next, Method } from "./@types/snowlight.ts";

import { flatten } from "./@modules/array_flatten.ts";

import Request from "./request.ts";
import Response from "./response.ts";
import Pipeline from "./pipeline.ts";

import { parser_params } from "./utils.ts";

export class Router {
  private stack: (Middleware | Route)[] = [];

  constructor(private extra?: { [name: string]: any }) {}

  private route(method: string, ...params: (string | Function)[]) {
    let path = this.extra?.path ? this.extra.path : "/";
    let offset = 0;

    if (!Array.isArray(params)) {
      throw new Error(
        `Router.${method.toLowerCase}() requires a route path and a middleware function`,
      );
    }

    if (typeof params[0] !== "string" && !this.extra?.path) {
      throw new Error(
        `Router.${method.toLowerCase}() requires a route path`,
      );
    }

    if (typeof params[0] === "string") {
      path = params[0];
      offset = 2;
    } else {
      path = this.extra?.path;
      offset = 1;
    }

    const handles = flatten(Array.prototype.slice.call(arguments, offset));

    handles.forEach(function (this: Router, handle) {
      if (typeof handle !== "function") {
        throw new Error(
          `Router.${method.toLowerCase()}() requires a middleware function`,
        );
      }

      this.stack.push({
        path,
        methods: [method as Method],
        params: parser_params(path),
        handle,
      });
    }, this);

    return this;
  }

  async dispatch(req: Request, res: Response, next: Next) {
    const pipeline = new Pipeline(this.stack, req, res);

    return pipeline.dispatch();
  }

  middlewares() {
    return this.stack;
  }

  group(path: string, middlewares: (Function | Function[]), callback: Function) {
    const router = new Router({
      path,
    });
    
    router.use(path, middlewares);

    this.stack.push({
      path,
      params: parser_params(path),
      handle: async (
        req: Request,
        res: Response,
        next: Next,
      ): Promise<any> => {
        return router.dispatch(req, res, next);
      },
    });

    callback(router);
  }

  get(...params: (string | Function)[]): this {
    return this.route("GET", ...params);
  }

  post(...params: (string | Function)[]): this {
    return this.route("POST", ...params);
  }

  put(...params: (string | Function)[]): this {
    return this.route("PUT", ...params);
  }

  patch(...params: (string | Function)[]): this {
    return this.route("PATCH", ...params);
  }

  delete(...params: (string | Function)[]): this {
    return this.route("DELETE", ...params);
  }

  use(...params: any[]): this {
    let path = this.extra?.path ? this.extra.path : "/";
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
        methods: [],
        params: parser_params(path),
        handle: middleware,
      });
    }, this);

    return this;
  }
}

export { Router as default };

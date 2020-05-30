import { flatten } from "./modules/array_flatten.ts";

import Pipeline, { Next } from "./pipeline.ts";

import Request from "./request.ts";
import Response from "./response.ts";

export interface Route {
  path: string,
  method: string,
  params: string,
  handle: Function,
}

export class Router {
  private stack: Route[] = [];

  async dispatch(req: Request, res: Response, next: Next) {
    const pipeline = new Pipeline(this.stack, req, res);
      
    await pipeline.dispatch();
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
        method: '',
        params: '',
        handle: middleware
      });
    }, this);

    return this;
  }
}

export {
  Router as default,
}
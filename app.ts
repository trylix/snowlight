import { serve, HTTPOptions } from "https://deno.land/std/http/server.ts";

import { flatten } from "./modules/array_flatten.ts";

import Pipeline, { Next } from "./pipeline.ts";

import Request from "./request.ts";
import Response from "./response.ts";

export interface Middleware {
  path: string;
  handle: Function;
}

export class App {
  private stack: Middleware[];

  constructor() {
    this.stack = [];
  }

  listen(config: string | HTTPOptions, callback?: Function) {
    const s = serve(config);

    let self = this;

    async function handle() {
      for await (const httpRequest of s) {
        const request = new Request(httpRequest);
        const response = new Response(httpRequest);

        const pipeline = new Pipeline(self.stack, request, response);

        try {
          await pipeline.dispatch();
        } catch (err) {}
      }
    }

    handle();

    callback?.();
  }

  use(...params: (string | Function | Object)[]) {
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

    middlewares.forEach(function (this: App, middleware) {
      if (!middleware?.dispatch) {
        return this.stack.push({
          path,
          handle: middleware,
        });
      }

      this.stack.push({
        path,
        handle: async (req: Request, res: Response, next: Next) => {
          middleware.dispatch(req, res, next);
        },
      });
    }, this);

    return this;
  }
}

export { App as default };

import {
  serve,
  HTTPOptions,
} from "https://deno.land/std/http/server.ts";

import { flatten } from "./modules/array_flatten.ts";

import Pipeline from "./pipeline.ts";

export interface Middleware {
  path: string,
  handle: Function,
}

class App {
  private stack: Middleware[];

  constructor() {
    this.stack = [];
  }

  listen(config: (string | HTTPOptions), callback?: Function) {
    const s = serve(config);
    
    const pipeline = new Pipeline(this.stack);

    async function handle() {
      for await (const request of s) {
        await pipeline.dispatch();

        request.respond({
          body: "Hello world",
        });
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
        handle: async () => {
          await middleware.dispatch();
        },
      });
    }, this);

    return this;
  }
}

export default new App();
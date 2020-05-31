import { serve, HTTPOptions } from "../deps.ts";

import { Next } from "./@types/snowlight.ts";

import { flatten } from "./@modules/array_flatten.ts";

import Router from "./router.ts";
import Request from "./request.ts";
import Response from "./response.ts";
import Pipeline from "./pipeline.ts";

export class App {
  private router?: Router;

  getRouter() {
    if (!this.router) {
      this.router = new Router();
    }

    return this.router;
  }

  listen(config: string | HTTPOptions, callback?: Function) {
    const s = serve(config);

    let self = this;

    async function handle() {
      for await (const httpRequest of s) {
        const request = new Request(httpRequest);
        const response = new Response(httpRequest);

        const pipeline = new Pipeline(
          self.getRouter().middlewares(),
          request,
          response,
        );

        try {
          await pipeline.dispatch();
        } catch (err) {
          await pipeline.dispatch(err);
        }

        try {
          await httpRequest.respond(response.makeResponse());
        } finally {
          response.close();
        }
      }
    }

    handle();

    callback?.();
  }

  group(path: string, middlewares: Function | Function[], callback: Function) {
    this.getRouter().group(path, middlewares, callback);
  }

  get(...params: (string | Function)[]): Router {
    return this.getRouter().get(...params);
  }

  post(...params: (string | Function)[]): Router {
    return this.getRouter().post(...params);
  }

  put(path: string, ...params: Function[]): Router {
    return this.getRouter().put(...params);
  }

  patch(path: string, ...params: Function[]): Router {
    return this.getRouter().patch(...params);
  }

  delete(path: string, ...params: Function[]): Router {
    return this.getRouter().post(...params);
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

    middlewares.forEach(function (this: App, middleware: any) {
      if (!middleware?.dispatch) {
        return this.getRouter().middlewares().push({
          path,
          handle: middleware,
        });
      }

      this.getRouter()
        .middlewares()
        .push({
          path,
          handle: async (
            req: Request,
            res: Response,
            next: Next,
          ): Promise<any> => {
            return middleware.dispatch(req, res, next);
          },
        });
    }, this);

    return this;
  }
}

export { App as default };

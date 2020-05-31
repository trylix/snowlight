import { serve, HTTPOptions } from "../deps.ts";

import { Next } from "./@types/snowlight.ts";

import { flatten } from "./@modules/array_flatten.ts";

import Router from "./router.ts";
import Request from "./request.ts";
import Response from "./response.ts";
import Pipeline from "./pipeline.ts";

import { parser_params } from "./utils.ts";

export class App {
  private route?: Router;

  private router() {
    if (!this.route) {
      this.route = new Router();
    }

    return this.route;
  }

  listen(addr: string | HTTPOptions, callback?: Function) {
    const s = serve(addr);

    let self = this;

    async function handle() {
      for await (const httpRequest of s) {
        const request = new Request(httpRequest);
        const response = new Response(httpRequest);

        const pipeline = new Pipeline(
          self.router().middlewares(),
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
    this.router().group(path, middlewares, callback);
  }

  get(...params: any[]): Router {
    return this.router().get(...params);
  }

  post(...params: any[]): Router {
    return this.router().post(...params);
  }

  put(...params: any[]): Router {
    return this.router().put(...params);
  }

  patch(...params: any[]): Router {
    return this.router().patch(...params);
  }

  delete(...params: any[]): Router {
    return this.router().delete(...params);
  }

  use(...params: any[]) {
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
        return this.router().middlewares().push({
          path,
          params: parser_params(path),
          handle: middleware,
        });
      }

      this.router()
        .middlewares()
        .push({
          path,
          params: parser_params(path),
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

import { Middleware } from "./app.ts";
import { Route } from "./router.ts";

import Request from "./request.ts";
import Response from "./response.ts";

export type Next = (err?: any) => Promise<void>;

export class Pipeline {
  private finished: boolean;

  constructor(
    private stack: (Middleware | Route)[],
    private request: Request,
    private response: Response,
  ) {
    this.finished = false;
  }

  private is_route(object: Middleware | Route): object is Route {
    return (object as Route).method !== undefined;
  }

  async dispatch() {
    let iterator = 0;

    if (iterator < this.stack?.length) {
      const next = async (err?: any): Promise<any> => {
        iterator++;

        if (!this.finished && iterator < this.stack.length) {
          return this.handle_request(iterator, next);
        } else {
          this.finished = true;
          this.response.sendStatus(404);
        }
      };

      return this.handle_request(iterator, next);
    }
  }

  private async handle_request(iterator: number, next: Next): Promise<any> {
    const middleware = this.stack[iterator];

    if (
      this.is_route(middleware) && middleware.method !== undefined &&
      middleware.method === this.request.method
    ) {
      const params = middleware.params(this.request.url);

      if (params) {
        this.request.params = params;
        this.request.extra.originalPath = middleware.path;

        try {
          return middleware.handle(this.request, this.response, next);
        } catch (e) {
          return next(e);
        }
      }
    } else if (
      !this.is_route(middleware) &&
      (middleware.path === "/" || this.request.url.startsWith(middleware.path))
    ) {
      this.request.extra.originalPath = middleware.path;

      try {
        return middleware.handle(this.request, this.response, next);
      } catch (e) {
        return next(e);
      }
    }

    return next();
  }
}

export {
  Pipeline as default,
};

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
    private response: Response
  ) {
    this.finished = false;
  }

  private is_route(object: Middleware | Route): object is Route {
    return (object as Route).method !== undefined;
  }

  async dispatch(err?: Error) {
    let iterator = 0;

    if (iterator < this.stack?.length) {
      const next = async (): Promise<any> => {
        iterator++;

        if (!this.finished && iterator < this.stack.length) {
          return err ? this.handle_error(iterator, err, next) : this.handle_request(iterator, next);
        } else {
          this.finished = true;

          if (err) {
            return this.response.status(500).json({
              name: err.name,
              message: err.message,
              stack: err.stack,
            })
          } else {
            return this.response.sendStatus(404);
          }
        }
      };

      return err ? this.handle_error(iterator, err, next) : this.handle_request(iterator, next);
    }
  }

  private async handle_request(iterator: number, next: Next): Promise<any> {
    const middleware = this.stack[iterator];

    if (!(middleware.handle.length < 4)) {
      return next();
    }

    if (
      this.is_route(middleware) &&
      middleware.method !== undefined &&
      middleware.method === this.request.method
    ) {
      const params = middleware.params(this.request.url);

      if (params) {
        this.request.params = params;
        this.request.extra.originalPath = middleware.path;

        return middleware.handle(this.request, this.response, next);
      }
    } else if (
      !this.is_route(middleware) &&
      (middleware.path === "/" || this.request.url.startsWith(middleware.path))
    ) {
      this.request.extra.originalPath = middleware.path;

      return middleware.handle(this.request, this.response, next);
    }

    return next();
  }

  private async handle_error(
    iterator: number,
    err: any,
    next: Next
  ): Promise<any> {
    const middleware = this.stack[iterator];

    if (middleware.handle.length < 4 && !this.is_route(middleware)) {
      return next();
    }

    this.request.extra.originalPath = middleware.path;

    return middleware.handle(err, this.request, this.response, next);
  }
}

export { Pipeline as default };

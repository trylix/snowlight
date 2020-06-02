import { Middleware, Route, Next } from "./@types/snowlight.ts";

import Request from "./request.ts";
import Response from "./response.ts";

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
    return (object as Route).methods !== undefined;
  }

  async dispatch(err?: any) {
    let iterator = 0;

    if (iterator < this.stack?.length) {
      const next = async (): Promise<any> => {
        iterator++;

        if (!this.finished && iterator < this.stack.length) {
          return err
            ? this.handle_error(iterator, err, next)
            : this.handle_request(iterator, next);
        } else {
          this.finished = true;

          if (err) {
            return this.response.sendStatus(500);
          } else {
            return this.response.sendStatus(404);
          }
        }
      };

      return err
        ? this.handle_error(iterator, err, next)
        : this.handle_request(iterator, next);
    } else {
      return this.response.sendStatus(404);
    }
  }

  private async handle_request(iterator: number, next: Next): Promise<any> {
    const middleware = this.stack[iterator];

    if (!(middleware.handle.length < 4)) {
      return next();
    }

    if (
      this.is_route(middleware) &&
      middleware.methods.includes(this.request.method)
    ) {
      const params = middleware.params(this.request.path);

      if (params) {
        this.request.params = params;

        this.request.offsetSet("original_path", middleware.path);

        return middleware.handle(this.request, this.response, next);
      }
    } else if (!this.is_route(middleware)) {
      const params = middleware.params(this.request.path);

      if (
        (middleware.path === "/" ||
          this.request.path.startsWith(middleware.path) || params)
      ) {
        this.request.offsetSet("original_path", middleware.path);

        return middleware.handle(this.request, this.response, next);
      }
    }

    return next();
  }

  private async handle_error(
    iterator: number,
    err: any,
    next: Next,
  ): Promise<any> {
    const middleware = this.stack[iterator];

    if (middleware.handle.length < 4) {
      return next(err);
    }

    this.request.offsetSet("original_path", middleware.path);

    return middleware.handle(err, this.request, this.response, next);
  }
}

export { Pipeline as default };

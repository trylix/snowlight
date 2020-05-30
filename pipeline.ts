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

  private isRoute(object: Middleware | Route): object is Route {
    return (object as Route).method !== undefined;
  }

  async dispatch() {
    let iterator = 0;
    
    if (iterator < this.stack?.length) {
      const next = async (err?: any) => {
        iterator++;

        if (!this.finished && iterator < this.stack.length) {
          await this.handle(iterator, next);
        } else {
          this.finished = true;
        }
      };

      await this.handle(iterator, next);
    }
  }

  private async handle(iterator: number, next: Next, err?: any): Promise<void> {
    const middleware = this.stack[iterator];

    middleware.handle(this.request, this.response, next);
  }
}

export {
  Pipeline as default,
}
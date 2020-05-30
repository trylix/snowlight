import { Middleware } from "./app.ts";
import { Route } from "./router.ts";

export default class Pipeline {
  private finished: boolean;

  constructor(
    private stack: (Middleware | Route)[],
  ) {
    this.finished = false;
  }

  async dispatch() {
    let iterator = 0;
    
    if (iterator < this.stack?.length) {
      const middleware = this.stack[iterator];

      const next = () => {
        iterator++;
        if (!this.finished && iterator < this.stack.length) {
          const nextMiddleware = this.stack[iterator];
          nextMiddleware.handle(next);
        } else {
          this.finished = true;
        }
      };

      middleware.handle(next);
    }
  }
}
import { serve, HTTPOptions } from "../deps.ts";

import App from "./app.ts";
import Pipeline from "./pipeline.ts";
import Request from "./request.ts";
import Response from "./response.ts";

export default class Snowlight extends App {
  constructor() {
    super();
  }

  listen(addr: number | string | HTTPOptions, callback?: Function): void {
    const s = serve(typeof addr === "number" ? `:${addr}` : addr);
    const { signal } = this.controller;

    signal.addEventListener("abort", () => {
      s.close();
    });

    const handle = async (app: this) => {
      for await (const httpRequest of s) {
        const request = new Request(httpRequest);
        const response = new Response(request);

        const pipeline = new Pipeline(
          app.router().middlewares(),
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
    };

    handle(this);

    callback?.();
  }
}

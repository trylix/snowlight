import {
  serve,
  HTTPOptions,
} from "https://deno.land/std@0.53.0/http/server.ts";

export default class App {
  private stack: any[] = [];

  constructor() {}

  listen(config: (string | HTTPOptions), callback?: Function) {
    const s = serve(config);

    async function handle() {
      for await (const request of s) {
        request.respond({
          body: "Hello world",
        });
      }
    }

    handle();

    callback?.();
  }
}

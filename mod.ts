import App from "./lib/app.ts";
import Route from "./lib/router.ts";
import * as bodyparser from "./lib/bodyparser.ts";

let app: App;

export default function createApplication() {
  app = new App();

  return Object.assign(app, bodyparser);
}

export function Router() {
  return app.getRouter();
}

export * from "./lib/pipeline.ts";
export * from "./lib/request.ts";
export * from "./lib/response.ts";

export * from "./lib/@types/snowlight.ts";

export {
  Route,
};

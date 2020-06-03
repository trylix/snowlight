import App from "./lib/app.ts";
import Route from "./lib/router.ts";
import Mock from "./lib/mock.ts";

import * as bodyparser from "./lib/bodyparser.ts";

export default function createApplication() {
  const app = new App();

  return Object.assign(app, bodyparser);
}

export function Router() {
  return new Route();
}

export function MockAgent(app: App) {
  return new Mock(app);
}

export * from "./lib/pipeline.ts";
export * from "./lib/request.ts";
export * from "./lib/response.ts";

export * from "./lib/types.ts";

export {
  Route,
};

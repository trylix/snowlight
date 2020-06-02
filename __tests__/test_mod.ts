import faker from "../lib/faker.ts";
import Route from "../lib/router.ts";

import * as bodyparser from "../lib/bodyparser.ts";

export default function createApplication() {
  const app = new faker();

  return Object.assign(app, bodyparser);
}

export function Router() {
  return new Route();
}

export * from "../lib/pipeline.ts";
export * from "../lib/request.ts";
export * from "../lib/response.ts";

export * from "../lib/types.ts";

export {
  Route,
};

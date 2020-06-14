import app from "./lib/app.ts";
import router from "./lib/router.ts";
import mock from "./lib/mock.ts";

import { IApp, IRouter } from "./lib/types.ts"

import * as bodyparser from "./lib/bodyparser.ts";

export default function createApplication() {
  const application: IApp = new app();

  return Object.assign(application, bodyparser);
}

export function Router(): IRouter {
  return new router();
}

export function MockAgent(application: any) {
  return new mock(application);
}

export * from "./lib/types.ts";

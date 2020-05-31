import app from "./lib/app.ts";
import router from "./lib/router.ts";

function App() {
  return new app();
}

function Router() {
  return new router();
}

export * from "./lib/pipeline.ts";
export * from "./lib/request.ts";
export * from "./lib/response.ts";
export * from "./lib/body_parser.ts";

export {
  App as default,
  Router,
};

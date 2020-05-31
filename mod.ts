import app from "./lib/app.ts";

function App() {
  return new app();
}

export * from "./lib/pipeline.ts";
export * from "./lib/request.ts";
export * from "./lib/response.ts";
export * from "./lib/body_parser.ts";
export * from "./lib/router.ts";

export {
  App as default,
};

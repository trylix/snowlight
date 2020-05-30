import app from "./app.ts";
import router from "./router.ts";

function App() {
  return new app();
}

function Router() {
  return new router();
}

export * from "./pipeline.ts";
export * from "./request.ts";
export * from "./response.ts";

export {
  App as default,
  Router,
};

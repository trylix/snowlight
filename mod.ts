import app from "./app.ts";
import router from "./router.ts";

function App() {
  return app;
}

function Router() {
  return router;
}

export {
  App as default,
  Router,
}
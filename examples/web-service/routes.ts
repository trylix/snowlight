import { Router, Route } from "https://deno.land/x/snowlight/mod.ts";

import ProjectController from "./app/controllers/ProjectController.ts";
import countRequestsMiddleware from "./app/middlewares/countRequests.ts";
import projectExistsMiddleware from "./app/middlewares/countRequests.ts";

const routes = Router();

routes.use(countRequestsMiddleware);

routes.get("/projects", ProjectController.index);
routes.post("/projects", ProjectController.store);

routes.group("/projects/:id", projectExistsMiddleware, (route: Route) => {
  route.put(ProjectController.update);
  route.delete(ProjectController.delete);
});

export default routes;

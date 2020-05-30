import snowlight, {
  Router,
  Request,
  Response,
  Next,
  static_content,
  json,
} from "https://raw.githubusercontent.com/trylix/snowlight/master/mod.ts";

const app = snowlight();
const routes = Router();

app.use(json());
app.use("/static", static_content(`${Deno.cwd()}/examples`));

app.use(routes);

const projects: ({ id: string; title: string })[] = [];

async function countRequests(req: Request, res: Response, next: Next) {
  console.count("Requests placed so far");
  return next();
}

async function projectExists(req: Request, res: Response, next: Next) {
  const { id } = req.params;

  const project = projects.find((x) => x.id == id);

  if (project) {
    return next();
  }

  return res.status(404).json({
    "message": "Sorry man, this project doesn't exist.",
  });
}

routes.use(countRequests);

routes.post("/projects", async (req: Request, res: Response) => {
  const { id, title } = req.body;

  const project = {
    id,
    title,
  };

  projects.push(project);

  return res.status(201).json(project);
});

routes.get("/projects", async (req: Request, res: Response) => {
  return res.json(projects);
});

routes.put(
  "/projects/:id",
  projectExists,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const { title } = req.body;

    const project = projects.find((element) => element.id == id);

    if (project) {
      project.title = title;

      return res.status(201).json(project);
    }

    return res.sendStatus(404);
  },
);

routes.delete(
  "/projects/:id",
  projectExists,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const index = projects.findIndex((x) => x.id == id);

    projects.splice(index, 1);

    return res.sendStatus(204);
  },
);

app.listen({
  port: 3333,
}, () => console.log("Server started 🔥"));

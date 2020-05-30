<p align="center"><img src=".github/snowlight.svg" width="400"></p>

<p align="center">
<a href="/LICENSE"><img src="https://img.shields.io/github/license/trylix/snowlight" alt="License"></a>
</p>

## Overview

Snowlight is a middleware web server framework for [Deno](https://deno.land/) 🦕. 

This project is currently under development and may be unstable, use in production applications is not recommended.

This middleware framework is inspired by [Express](http://expressjs.com/).

## Example

Example of implementation in a project.

```
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

```

## Contributing

Thank you for being interested on making this package better. Contributions are what make an open source community an incredible place to learn and create. Any contribution you make will be greatly appreciated.

Any change to resources in this repository must be through pull requests. This applies to all changes to documentation, code, binary files, etc.

Log an issue for any question or problem you might have. When in doubt, log an issue, and any additional policies about what to include will be provided in the responses. The only exception is security disclosures which should be sent privately.

Please be courteous and respectful.

## License

[MIT](LICENSE)
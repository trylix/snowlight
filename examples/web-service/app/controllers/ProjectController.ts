import { v4, IRequest, IResponse } from "../../deps.ts";

import projects from "../projects.ts";

class ProjectController {
  index = async (req: IRequest, res: IResponse) => {
    return res.json(projects);
  };

  store = async (req: IRequest, res: IResponse) => {
    const { title } = req.body;

    const project = {
      id: v4.generate(),
      title,
    };

    projects.push(project);

    return res.status(201).json(project);
  };

  update = async (req: IRequest, res: IResponse) => {
    const { id } = req.params;

    const { title } = req.body;

    const project = projects.find((element) => element.id == id);

    if (project) {
      project.title = title;

      return res.status(201).json(project);
    }

    return res.sendStatus(404);
  };

  delete = async (req: IRequest, res: IResponse) => {
    const { id } = req.params;

    const index = projects.findIndex((x) => x.id == id);

    projects.splice(index, 1);

    return res.sendStatus(204);
  };
}

export default new ProjectController();

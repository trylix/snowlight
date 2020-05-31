import { Request, Response, Next } from "../../../../mod.ts";

import projects from "../projects.ts";

export default async (req: Request, res: Response, next: Next) => {
  const { id } = req.params;

  const project = projects.find(element => element.id == id);

  if (project) {
    return next();
  }

  return res.status(404).json({
    "message": "Sorry man, this project doesn't exist.",
  });
}
import { Request, Response, Next } from "../../../../mod.ts";

export default async (req: Request, res: Response, next: Next) => {
  console.count("Requests placed so far");
  return next();
};

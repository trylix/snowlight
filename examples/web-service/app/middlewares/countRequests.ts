import { IRequest, IResponse, Next } from "../../../../mod.ts";

export default async (req: IRequest, res: IResponse, next: Next) => {
  console.count("Requests placed so far");
  return next();
};

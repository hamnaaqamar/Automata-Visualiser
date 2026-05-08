import { type Request, type Response } from "express";
import { type ConvertRequest, type TestRequest } from "../models/automata.types";
import { AutomataService } from "../services/automata.service";

export class AutomataController {
  constructor(private readonly automataService = new AutomataService()) {}

  convert = (request: Request<unknown, unknown, ConvertRequest>, response: Response): void => {
    const result = this.automataService.convert(request.body.regex);
    response.json(result);
  };

  test = (request: Request<unknown, unknown, TestRequest>, response: Response): void => {
    const result = this.automataService.test(request.body.regex, String(request.body.input || ""));
    response.json(result);
  };
}

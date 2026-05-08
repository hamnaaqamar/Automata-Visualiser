import { type ErrorRequestHandler } from "express";
import { RegexSyntaxError } from "../models/automata.types";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof RegexSyntaxError || error instanceof SyntaxError) {
    response.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Unexpected server error." });
};

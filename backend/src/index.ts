import cors from "cors";
import express from "express";
import automataRoutes from "./routes/automata.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/automata", automataRoutes);
app.use(errorMiddleware);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Automata backend running at http://localhost:${port}`);
  });
}

export default app;

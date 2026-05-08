import { Router } from "express";
import { AutomataController } from "../controllers/automata.controller";

const router = Router();
const controller = new AutomataController();

router.post("/convert", controller.convert);
router.post("/test", controller.test);

export default router;

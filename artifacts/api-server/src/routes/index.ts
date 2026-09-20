import { Router, type IRouter } from "express";
import healthRouter from "./health";
import photoHelpRouter from "./photo-help";
import conceptHelpRouter from "./concept-help";

const router: IRouter = Router();

router.use(healthRouter);
router.use(photoHelpRouter);
router.use(conceptHelpRouter);

export default router;

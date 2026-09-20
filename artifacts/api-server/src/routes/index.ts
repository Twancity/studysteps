import { Router, type IRouter } from "express";
import healthRouter from "./health";
import photoHelpRouter from "./photo-help";

const router: IRouter = Router();

router.use(healthRouter);
router.use(photoHelpRouter);

export default router;

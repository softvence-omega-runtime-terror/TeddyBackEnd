import { Router } from "express";
import { getHistory, postHistory } from "./history.controller";
import auth from "../../middleware/auth";
import { userRole } from "../../constants";

const historyRoutes = Router();

historyRoutes.get("/get-history", auth([userRole.admin, userRole.user]), getHistory);
historyRoutes.post("/create-history", auth([userRole.admin, userRole.user]), postHistory);

export default historyRoutes;

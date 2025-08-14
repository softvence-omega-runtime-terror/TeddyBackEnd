import { Router } from "express";
import { getHistory, postHistory } from "./history.controller";

const historyRoutes = Router();

historyRoutes.get("/get-history", getHistory);
historyRoutes.post("/create-history", postHistory);

export default historyRoutes;

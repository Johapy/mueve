import express from "express";
import { ratePrice } from "../controllers/rateController.js";

const router = express.Router();

router.get("/rate", ratePrice);

export default router;

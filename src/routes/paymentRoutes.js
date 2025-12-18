import express from "express";
import { allPaymentMethods, createPaymentMethod } from "../controllers/paymentsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, allPaymentMethods);
router.post("/add", verifyToken, createPaymentMethod);

export default router;
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
} from "../controllers/transactionController.js";

const router = express.Router();

// Crear transacción (comprar o vender)
router.post("/", verifyToken, createTransaction);

// Obtener todas las transacciones del usuario autenticado
router.get("/", verifyToken, getUserTransactions);

// Obtener una transacción específica del usuario
router.get("/:id", verifyToken, getTransactionById);

export default router;

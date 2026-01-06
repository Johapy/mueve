import pool from "../db/db.js";
import { getBTC } from "../services/dolar-service.js";

// Crear una transacción nueva
export const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado
    const {
      transaction_type, // "Comprar" o "Vender"
      amount_usd,
      rate_bs,
      payment_reference,
      type_pay,
      recipient_account,
    } = req.body;

    if (!transaction_type || !amount_usd || !rate_bs || !payment_reference) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const rateInRedis = await getBTC();
    const rateSentByUser = parseFloat(rate_bs);

    const tolerance = 0.15; 
    const diff = Math.abs(rateInRedis - rateSentByUser);

    if (diff > tolerance) {
        return res.status(400).json({ 
            message: "La tasa ha cambiado. Por favor actualiza la página para continuar." 
        });
    }

    const commission_usd = 1.0;
    const total_usd = parseFloat(amount_usd) + commission_usd;
    const total_bs = total_usd * parseFloat(rate_bs);

    const [result] = await pool.query(
      `INSERT INTO transactions 
      (user_id, transaction_type, amount_usd, commission_usd, total_usd, rate_bs, total_bs, payment_reference, status, type_pay, recipient_account)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?)`,
      [userId, transaction_type, amount_usd, commission_usd, total_usd, rate_bs, total_bs, payment_reference, type_pay, recipient_account]
    );

    res.status(201).json({
      message: "Transacción creada exitosamente",
      transaction: {
        id: result.insertId,
        user_id: userId,
        transaction_type,
        amount_usd,
        commission_usd,
        total_usd,
        rate_bs,
        total_bs,
        payment_reference,
        status: "Pendiente",
        type_pay,
        recipient_account,
      },
    });

    console.log("Transacción creada:", {
      id: result.insertId,
      user_id: userId,
      transaction_type,
      amount_usd,
      commission_usd,
      total_usd,
      rate_bs,
      total_bs,
      payment_reference,
      status: "Pendiente",
      type_pay,
      recipient_account,
    });

  } catch (error) {
    console.error("Error al crear transacción:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Obtener todas las transacciones del usuario autenticado
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const [transactions] = await pool.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Obtener una transacción específica por ID (solo si pertenece al usuario)
export const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    const [rows] = await pool.query(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
      [transactionId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Transacción no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener transacción:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

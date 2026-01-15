import pool from "../db/db.js";
import { getBTC } from "../services/dolar-service.js";

// Helpers
const round2 = (v) => {
  return Math.round((parseFloat(v) || 0) * 100) / 100;
};

const getCommissionUsd = (amount) => {
  const A = parseFloat(amount) || 0;
  if (A >= 1 && A < 10) return 0.8;
  if (A >= 10 && A < 15) return 1.0;
  if (A >= 15 && A <= 25) return 1.4;
  if (A > 25) return round2(1.4 + (A - 25) * 0.08);
  return 0;
};

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

    const tolerance = 0.35; 
    const diff = Math.abs(rateInRedis - rateSentByUser);

    if (diff > tolerance) {
        return res.status(400).json({ 
            message: "La tasa ha cambiado. Por favor actualiza la página para continuar." 
        });
    }

    // Calcular comisión de forma consistente con el frontend
    const commission_usd = round2( getCommissionUsd(amount_usd) );

    // Asegurar tipos numéricos
    const A = parseFloat(amount_usd);
    const r = parseFloat(rate_bs);

    let total_usd; // para guardar en DB (monto efectivo considerado)
    let total_bs;

    if (transaction_type === 'Comprar' || transaction_type === 'COMPRA') {
      // El usuario paga la comisión: total_usd = amount + commission
      total_usd = round2( A + commission_usd );
      total_bs = round2( total_usd * r );
    } else if (transaction_type === 'Vender' || transaction_type === 'VENTA') {
      // Al usuario se le descuenta la comisión: net_usd = amount - commission
      const net_usd = round2( A - commission_usd );
      if (net_usd <= 0) {
        return res.status(400).json({ message: "La comisión excede o iguala el monto proporcionado" });
      }
      total_usd = net_usd; // lo que efectivamente se toma como base
      total_bs = round2( total_usd * r );
    } else {
      // Si viene otro valor, usar la lógica por defecto (tratar como Compra)
      total_usd = round2( A + commission_usd );
      total_bs = round2( total_usd * r );
    }

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

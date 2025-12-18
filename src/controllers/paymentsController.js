import pool from "../db/db.js";

export const allPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM payment_methods wHERE user_id = ?", [userId]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los métodos de pago:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const createPaymentMethod = async (req, res) => {
  try {
    const { type, ci, bank, phone, owner_name, mail_pay } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO payment_methods (user_id, type, ci, bank, phone, owner_name, mail_pay) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, type, ci, bank, phone, owner_name, mail_pay]
    );

    res.status(201).json({ id: result.insertId, type, ci, bank, phone, owner_name, mail_pay });
  } catch (error) {
    console.error("Error al crear el método de pago:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
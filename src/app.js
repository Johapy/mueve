import express from "express";
import pool from "./db/db.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

app.use(express.json());
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de solicitudes por IP
});

app.use(limiter);

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS currentTime");
    res.json({ success: true, time: rows[0].currentTime });
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    res.status(500).json({ success: false, message: "Error al conectar a la base de datos" });
  }
});

app.use("/api", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments-methods", paymentRoutes);

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));


import { getBTC } from "../services/dolar-service.js";

export const ratePrice = async (req, res) => {
  try {

    const rate = await getBTC();
    res.json({ rate });
  } catch (error) {
    console.error("Error al obtener la tasa:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const comissionPrice = async (req, res) => {
  try {
    const rate = await getBTC();
    res.json({ rate });
  } catch (error) {
    console .error("Error al obtener la comisión:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } 
};
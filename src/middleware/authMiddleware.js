import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Middleware de autenticación JWT
 * Verifica si el usuario envía un token válido antes de acceder a rutas protegidas.
 */
export const verifyToken = async (req, res, next) => {
  try {
    // 1️⃣ Obtener encabezado Authorization
    const authHeader = req.headers["authorization"];

    // 2️⃣ Validar existencia del token
    if (!authHeader) {
      return res.status(401).json({ message: "No se proporcionó token" });
    }

    // 3️⃣ Extraer el token (formato esperado: "Bearer <token>")
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    // 4️⃣ Verificar token con la clave secreta
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Guardar los datos del usuario decodificados en req.user
    req.user = decoded;

    // 6️⃣ Pasar al siguiente middleware o controlador
    next();
  } catch (error) {
    console.error("Error en verificación de token:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

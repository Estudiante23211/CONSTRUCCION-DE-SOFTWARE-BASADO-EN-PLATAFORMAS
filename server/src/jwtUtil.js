import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'dev-only-secret';

/** Devuelve `IdUsuario` si el Bearer es un JWT de sesión válido; si no, `null`. */
export function getSessionUserId(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const p = jwt.verify(m[1], jwtSecret);
    if (p && p.typ === 'session' && p.sub != null) return Number(p.sub);
  } catch {
    return null;
  }
  return null;
}

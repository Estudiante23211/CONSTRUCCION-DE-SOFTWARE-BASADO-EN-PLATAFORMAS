import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  validatePasswordShape,
  buildForbiddenFragments,
  passwordContainsForbidden,
} from '../passwordPolicy.js';

export function authRouter(pool) {
  const r = Router();
  const jwtSecret = process.env.JWT_SECRET || 'dev-only-secret';

  r.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Credenciales requeridas' });
    }
    const login = String(email).trim();

    try {
      const [rows] = await pool.query(
        `SELECT IdUsuario, Correo, Usuario, NumeroIdentificacion, Clave, Estado
         FROM seg__usuario
         WHERE (Correo = ? OR Usuario = ? OR NumeroIdentificacion = ?)
         LIMIT 1`,
        [login, login, login]
      );

      if (!rows.length) {
        return res.status(401).json({
          message:
            'El usuario o correo ingresado no es correcto. Por favor, verifica e intenta nuevamente.',
        });
      }

      const row = rows[0];
      if (!row.Estado) {
        return res.status(403).json({
          message: 'La cuenta está inactiva. Contacte al administrador.',
        });
      }

      let ok = await bcrypt.compare(password, row.Clave);
      const claveStored = String(row.Clave ?? '');
      const looksLikeBcrypt = claveStored.startsWith('$2');
      if (!ok && !looksLikeBcrypt && claveStored === password) {
        ok = true;
        const hash = await bcrypt.hash(password, 10);
        await pool.query(`UPDATE seg__usuario SET Clave = ? WHERE IdUsuario = ?`, [
          hash,
          row.IdUsuario,
        ]);
      }
      if (!ok) {
        return res.status(401).json({
          message: 'La contraseña es incorrecta. Por favor, verifica e intenta nuevamente.',
        });
      }

      const token = jwt.sign(
        { sub: row.IdUsuario, typ: 'session' },
        jwtSecret,
        { expiresIn: '8h' }
      );

      return res.json({ token });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/recover/verify', async (req, res) => {
    const { login } = req.body || {};
    if (!login || !String(login).trim()) {
      return res.status(400).json({ message: 'Ingrese correo o usuario' });
    }
    const q = String(login).trim();

    try {
      const [rows] = await pool.query(
        `SELECT IdUsuario, Nombre, Apellido, Correo, Usuario, Estado
         FROM seg__usuario
         WHERE Correo = ? OR Usuario = ? OR NumeroIdentificacion = ?
         LIMIT 1`,
        [q, q, q]
      );

      if (!rows.length) {
        return res.status(404).json({ message: 'No se encontró la cuenta' });
      }

      const row = rows[0];
      if (!row.Estado) {
        return res.status(403).json({
          message: 'La cuenta está inactiva. Contacte al administrador.',
        });
      }

      const resetToken = jwt.sign(
        { sub: row.IdUsuario, typ: 'pwd-reset' },
        jwtSecret,
        { expiresIn: '15m' }
      );

      return res.json({ resetToken });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/recover/reset', async (req, res) => {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, jwtSecret);
    } catch {
      return res.status(401).json({ message: 'Enlace de recuperación inválido o vencido' });
    }

    if (payload.typ !== 'pwd-reset' || !payload.sub) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const userId = payload.sub;

    try {
      const [users] = await pool.query(
        `SELECT IdUsuario, Nombre, Apellido, Correo, Usuario, Estado
         FROM seg__usuario WHERE IdUsuario = ? LIMIT 1`,
        [userId]
      );
      if (!users.length || !users[0].Estado) {
        return res.status(403).json({ message: 'Cuenta no disponible' });
      }

      const u = users[0];

      // `est__cliente` en tu esquema no incluye columna de documento; la PII se toma del propio usuario.
      const docCliente = '';

      const forbidden = buildForbiddenFragments(u, docCliente);

      if (!validatePasswordShape(newPassword)) {
        return res.status(400).json({
          message:
            'La contraseña debe tener entre 8 y 12 caracteres e incluir mayúscula, minúscula, número y símbolo',
        });
      }

      if (passwordContainsForbidden(newPassword, forbidden)) {
        return res.status(400).json({
          message:
            'La contraseña no debe incluir su cédula, nombre, usuario ni datos personales reconocibles',
        });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query(`UPDATE seg__usuario SET Clave = ? WHERE IdUsuario = ?`, [
        hash,
        userId,
      ]);

      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';
import { isDbConnectionError, sendDbUnavailable } from '../dbErrors.js';

const listSql = `SELECT i.IdInventario, i.IdProducto, i.IdUnidadMedida, i.CantidadInicial, i.CantidadActual, i.Alerta,
  i.UsuarioCreador, i.FechaCreacion,
  p.Nombre AS ProductoNombre, p.Estado AS ProductoEstado,
  COALESCE(um.Nombre, '') AS UnidadMedidaNombre,
  TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
  u.Correo AS CreadorCorreo
FROM com__inventario i
LEFT JOIN com__producto p ON p.IdProducto = i.IdProducto
LEFT JOIN bas__unidad_medida um ON um.IdUnidadMedida = i.IdUnidadMedida
LEFT JOIN seg__usuario u ON u.IdUsuario = i.UsuarioCreador`;

function boolEstado(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function fechaIso(row) {
  if (row.FechaCreacion instanceof Date) return row.FechaCreacion.toISOString().slice(0, 10);
  if (row.FechaCreacion) return String(row.FechaCreacion).slice(0, 10);
  return '';
}

function creadorDisplay(row) {
  let creador = String(row.CreadorNombre || '').trim();
  if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
  if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
  if (!creador) creador = '—';
  return creador;
}

function mapInventario(row) {
  const prodActivo = row.ProductoNombre == null ? true : boolEstado(row.ProductoEstado);
  return {
    id: Number(row.IdInventario),
    idProducto: row.IdProducto != null ? Number(row.IdProducto) : 0,
    idUnidadMedida: row.IdUnidadMedida != null ? Number(row.IdUnidadMedida) : 0,
    productoNombre: String(row.ProductoNombre || '').trim() || '—',
    unidadMedida: String(row.UnidadMedidaNombre || '').trim() || '—',
    cantidadInicial: Number(row.CantidadInicial) || 0,
    cantidadActual: Number(row.CantidadActual) || 0,
    alertaMinima: row.Alerta != null ? Number(row.Alerta) : 0,
    estado: prodActivo ? 'Activo' : 'Inactivo',
    usuarioCreacion: creadorDisplay(row),
    fechaCreacion: fechaIso(row),
  };
}

/** @param {import('mysql2/promise').Pool} pool */
export function inventarioRouter(pool) {
  const r = Router();

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const [rows] = await pool.query(`${listSql} ORDER BY i.IdInventario ASC`);
      res.json(rows.map(mapInventario));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });

    const idProducto = Number(req.body?.idProducto);
    const idUnidadMedida = Number(req.body?.idUnidadMedida);
    const cantidadInicial = Number(req.body?.cantidadInicial);
    const cantidadActual = Number(req.body?.cantidadActual);
    const alertaMinima = Number(req.body?.alertaMinima);

    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return res.status(400).json({ message: 'Seleccione un producto válido' });
    }
    if (!Number.isFinite(idUnidadMedida) || idUnidadMedida <= 0) {
      return res.status(400).json({ message: 'Seleccione una unidad de medida válida' });
    }
    if (!Number.isFinite(cantidadInicial) || cantidadInicial < 0) {
      return res.status(400).json({ message: 'Cantidad inicial inválida' });
    }
    if (!Number.isFinite(cantidadActual) || cantidadActual < 0) {
      return res.status(400).json({ message: 'Cantidad actual inválida' });
    }
    if (!Number.isFinite(alertaMinima) || alertaMinima < 0) {
      return res.status(400).json({ message: 'Alerta mínima inválida' });
    }

    try {
      const [creadorRows] = await pool.query(
        `SELECT IdUsuario FROM seg__usuario WHERE IdUsuario = ? LIMIT 1`,
        [uid]
      );
      if (!creadorRows.length) {
        return res.status(401).json({
          message:
            'Su sesión no coincide con ningún usuario en la base de datos. Cierre sesión e inicie sesión nuevamente.',
        });
      }

      const [fkP] = await pool.query(`SELECT IdProducto FROM com__producto WHERE IdProducto = ? LIMIT 1`, [
        idProducto,
      ]);
      if (!fkP.length) return res.status(400).json({ message: 'Producto inválido' });

      const [fkU] = await pool.query(
        `SELECT IdUnidadMedida FROM bas__unidad_medida WHERE IdUnidadMedida = ? LIMIT 1`,
        [idUnidadMedida]
      );
      if (!fkU.length) return res.status(400).json({ message: 'Unidad de medida inválida' });

      const [ins] = await pool.query(
        `INSERT INTO com__inventario (IdProducto, IdUnidadMedida, CantidadInicial, CantidadActual, Alerta, UsuarioCreador, FechaCreacion)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [idProducto, idUnidadMedida, cantidadInicial, cantidadActual, alertaMinima, uid]
      );
      const newId = ins.insertId;
      const [createdRows] = await pool.query(`${listSql} WHERE i.IdInventario = ?`, [newId]);
      if (!createdRows.length) {
        return res.status(500).json({ message: 'Registro creado pero no se pudo recuperar' });
      }
      res.status(201).json(mapInventario(createdRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });

    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: 'Identificador inválido' });

    const idProducto = Number(req.body?.idProducto);
    const idUnidadMedida = Number(req.body?.idUnidadMedida);
    const cantidadInicial = Number(req.body?.cantidadInicial);
    const cantidadActual = Number(req.body?.cantidadActual);
    const alertaMinima = Number(req.body?.alertaMinima);

    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return res.status(400).json({ message: 'Seleccione un producto válido' });
    }
    if (!Number.isFinite(idUnidadMedida) || idUnidadMedida <= 0) {
      return res.status(400).json({ message: 'Seleccione una unidad de medida válida' });
    }
    if (!Number.isFinite(cantidadInicial) || cantidadInicial < 0) {
      return res.status(400).json({ message: 'Cantidad inicial inválida' });
    }
    if (!Number.isFinite(cantidadActual) || cantidadActual < 0) {
      return res.status(400).json({ message: 'Cantidad actual inválida' });
    }
    if (!Number.isFinite(alertaMinima) || alertaMinima < 0) {
      return res.status(400).json({ message: 'Alerta mínima inválida' });
    }

    try {
      const [fkP] = await pool.query(`SELECT IdProducto FROM com__producto WHERE IdProducto = ? LIMIT 1`, [
        idProducto,
      ]);
      if (!fkP.length) return res.status(400).json({ message: 'Producto inválido' });

      const [fkU] = await pool.query(
        `SELECT IdUnidadMedida FROM bas__unidad_medida WHERE IdUnidadMedida = ? LIMIT 1`,
        [idUnidadMedida]
      );
      if (!fkU.length) return res.status(400).json({ message: 'Unidad de medida inválida' });

      const [result] = await pool.query(
        `UPDATE com__inventario SET IdProducto = ?, IdUnidadMedida = ?, CantidadInicial = ?, CantidadActual = ?, Alerta = ? WHERE IdInventario = ?`,
        [idProducto, idUnidadMedida, cantidadInicial, cantidadActual, alertaMinima, id]
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Inventario no encontrado' });

      const [updatedRows] = await pool.query(`${listSql} WHERE i.IdInventario = ?`, [id]);
      if (!updatedRows.length) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapInventario(updatedRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.delete('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: 'Identificador inválido' });

    try {
      const [result] = await pool.query(`DELETE FROM com__inventario WHERE IdInventario = ?`, [id]);
      if (!result.affectedRows) return res.status(404).json({ message: 'Inventario no encontrado' });
      res.status(204).end();
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

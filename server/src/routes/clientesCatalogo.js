import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';

/** @param {import('mysql2/promise').Pool} pool */
/** @param {string} tableName - tabla fija (no entrada de usuario) */
/** @param {string} idColumn - columna PK (no entrada de usuario) */
export function buildClienteCatalogRouter(pool, tableName, idColumn) {
  const r = Router();

  const listSql = `SELECT t.${idColumn} AS Id, t.Nombre, t.Descripcion, t.Estado, t.FechaCreacion, t.UsuarioCreador,
      TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
      u.Correo AS CreadorCorreo
    FROM ${tableName} t
    LEFT JOIN seg__usuario u ON u.IdUsuario = t.UsuarioCreador`;

  function mapRow(row) {
    const estadoRaw = row.Estado;
    const estadoActivo =
      estadoRaw === true || estadoRaw === 1 || estadoRaw === '1' || estadoRaw === 'true';
    let creador = String(row.CreadorNombre || '').trim();
    if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
    if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
    if (!creador) creador = '—';
    let fc = '';
    if (row.FechaCreacion instanceof Date) fc = row.FechaCreacion.toISOString().slice(0, 10);
    else if (row.FechaCreacion) fc = String(row.FechaCreacion).slice(0, 10);
    return {
      id: Number(row.Id),
      nombre: row.Nombre,
      descripcion: row.Descripcion ?? '',
      estadoActivo,
      estado: estadoActivo ? 'Activo' : 'Inactivo',
      usuarioCreador: creador,
      fechaCreacion: fc,
    };
  }

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const [rows] = await pool.query(`${listSql} ORDER BY t.${idColumn} ASC`);
      res.json(rows.map(mapRow));
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });
    const nombre = String(req.body?.nombre ?? '').trim();
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion).trim() : '';
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

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

      const [ins] = await pool.query(
        `INSERT INTO ${tableName} (Nombre, Descripcion, Estado, UsuarioCreador, FechaCreacion) VALUES (?, ?, 1, ?, NOW())`,
        [nombre, descripcion || null, uid]
      );
      const newId = ins.insertId;
      const [createdRows] = await pool.query(`${listSql} WHERE t.${idColumn} = ?`, [newId]);
      if (!createdRows.length) {
        return res.status(500).json({ message: 'Registro creado pero no se pudo recuperar' });
      }
      res.status(201).json(mapRow(createdRows[0]));
    } catch (e) {
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un registro con ese nombre' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: 'Identificador inválido' });

    const body = req.body ?? {};
    const hasNombre = Object.prototype.hasOwnProperty.call(body, 'nombre');
    const hasDescripcion = Object.prototype.hasOwnProperty.call(body, 'descripcion');
    const hasEstado = Object.prototype.hasOwnProperty.call(body, 'estadoActivo');

    const sets = [];
    const params = [];
    if (hasNombre) {
      const nombre = String(body.nombre ?? '').trim();
      if (!nombre) return res.status(400).json({ message: 'El nombre no puede quedar vacío' });
      sets.push('Nombre = ?');
      params.push(nombre);
    }
    if (hasDescripcion) {
      sets.push('Descripcion = ?');
      params.push(
        body.descripcion != null && String(body.descripcion).trim() !== ''
          ? String(body.descripcion).trim()
          : null
      );
    }
    if (hasEstado) {
      const v = body.estadoActivo;
      const on = v === true || v === 1 || v === '1' || v === 'true';
      sets.push('Estado = ?');
      params.push(on ? 1 : 0);
    }
    if (!sets.length) return res.status(400).json({ message: 'No se recibieron campos para actualizar' });
    params.push(id);

    try {
      const [result] = await pool.query(
        `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${idColumn} = ?`,
        params
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Registro no encontrado' });
      const [updatedRows] = await pool.query(`${listSql} WHERE t.${idColumn} = ?`, [id]);
      if (!updatedRows.length) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapRow(updatedRows[0]));
    } catch (e) {
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un registro con ese nombre' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

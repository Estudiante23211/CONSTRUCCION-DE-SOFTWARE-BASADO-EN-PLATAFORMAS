import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';

function mapRow(row) {
  const estadoRaw = row.Estado;
  const estado =
    estadoRaw === true || estadoRaw === 1 || estadoRaw === '1' || estadoRaw === 'true';
  let creador = String(row.CreadorNombre || '').trim();
  if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
  if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
  if (!creador) creador = '—';

  let fc = '';
  if (row.FechaCreacion instanceof Date) {
    const d = row.FechaCreacion;
    fc = Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  } else if (row.FechaCreacion != null && String(row.FechaCreacion).trim() !== '') {
    const s = String(row.FechaCreacion).trim();
    fc = s.length >= 10 ? s.slice(0, 10) : s;
  }

  return {
    id: row.IdRoles,
    nombre: row.Nombre,
    descripcion: row.Descripcion ?? '',
    estadoActivo: estado,
    estado: estado ? 'Activo' : 'Inactivo',
    usuarioCreador: creador,
    fechaCreacion: fc,
  };
}

export function rolesRouter(pool) {
  const r = Router();

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const [rows] = await pool.query(
        `SELECT r.IdRoles, r.Nombre, r.Descripcion, r.Estado, r.FechaCreacion, r.UsuarioCreador,
            TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
            u.Correo AS CreadorCorreo
         FROM seg__roles r
         LEFT JOIN seg__usuario u ON u.IdUsuario = r.UsuarioCreador
         ORDER BY r.IdRoles ASC`
      );
      res.json(rows.map(mapRow));
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) {
      return res.status(401).json({ message: 'Debe iniciar sesión' });
    }

    const nombre = String(req.body?.nombre ?? '').trim();
    const descripcion =
      req.body?.descripcion != null ? String(req.body.descripcion).trim() : '';

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    try {
      const [usuarios] = await pool.query(
        `SELECT IdUsuario FROM seg__usuario WHERE IdUsuario = ? LIMIT 1`,
        [uid]
      );
      if (!usuarios.length) {
        return res.status(401).json({
          message:
            'Su sesión no coincide con ningún usuario en la base de datos. Cierre sesión e inicie sesión nuevamente.',
        });
      }

      /** Fecha explícita (parámetro) para que no dependa de NOW() en SQL ni de DEFAULT en BD. */
      const fechaCreacion = new Date();
      const [ins] = await pool.query(
        `INSERT INTO seg__roles (Nombre, Descripcion, Estado, UsuarioCreador, FechaCreacion)
         VALUES (?, ?, 1, ?, ?)`,
        [nombre, descripcion || null, uid, fechaCreacion]
      );
      const id = ins.insertId;
      const [createdRows] = await pool.query(
        `SELECT r.IdRoles, r.Nombre, r.Descripcion, r.Estado, r.FechaCreacion, r.UsuarioCreador,
            TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
            u.Correo AS CreadorCorreo
         FROM seg__roles r
         LEFT JOIN seg__usuario u ON u.IdUsuario = r.UsuarioCreador
         WHERE r.IdRoles = ?`,
        [id]
      );
      const row = createdRows[0];
      if (!row) {
        return res.status(500).json({ message: 'Rol creado pero no se pudo recuperar el registro' });
      }
      res.status(201).json(mapRow(row));
    } catch (e) {
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un rol con ese nombre' });
      }
      if (e.code === 'ER_NO_REFERENCED_ROW_2' || e.errno === 1452) {
        return res.status(400).json({
          message:
            'No se pudo crear el rol: el usuario de la sesión no existe en la base de datos. Cierre sesión e inicie sesión de nuevo.',
        });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Identificador de rol inválido' });
    }

    const body = req.body ?? {};
    const hasNombre = Object.prototype.hasOwnProperty.call(body, 'nombre');
    const hasDescripcion = Object.prototype.hasOwnProperty.call(body, 'descripcion');
    const hasEstado = Object.prototype.hasOwnProperty.call(body, 'estadoActivo');

    const nombre = hasNombre ? String(body.nombre ?? '').trim() : undefined;
    const descripcion = hasDescripcion
      ? body.descripcion != null
        ? String(body.descripcion).trim()
        : ''
      : undefined;
    let estadoActivo = undefined;
    if (hasEstado) {
      const v = body.estadoActivo;
      estadoActivo = v === true || v === 1 || v === '1' || v === 'true';
    }

    const sets = [];
    const params = [];
    if (hasNombre) {
      if (!nombre) {
        return res.status(400).json({ message: 'El nombre no puede quedar vacío' });
      }
      sets.push('Nombre = ?');
      params.push(nombre);
    }
    if (hasDescripcion) {
      sets.push('Descripcion = ?');
      params.push(descripcion || null);
    }
    if (hasEstado) {
      sets.push('Estado = ?');
      params.push(estadoActivo ? 1 : 0);
    }
    if (!sets.length) {
      return res.status(400).json({ message: 'No se recibieron campos para actualizar' });
    }

    params.push(id);
    try {
      const [result] = await pool.query(
        `UPDATE seg__roles SET ${sets.join(', ')} WHERE IdRoles = ?`,
        params
      );
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'Rol no encontrado' });
      }
      const [updatedRows] = await pool.query(
        `SELECT r.IdRoles, r.Nombre, r.Descripcion, r.Estado, r.FechaCreacion, r.UsuarioCreador,
            TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
            u.Correo AS CreadorCorreo
         FROM seg__roles r
         LEFT JOIN seg__usuario u ON u.IdUsuario = r.UsuarioCreador
         WHERE r.IdRoles = ?`,
        [id]
      );
      const row = updatedRows[0];
      if (!row) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapRow(row));
    } catch (e) {
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un rol con ese nombre' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

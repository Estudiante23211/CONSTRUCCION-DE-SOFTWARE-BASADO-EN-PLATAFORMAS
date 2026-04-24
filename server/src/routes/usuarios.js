import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getSessionUserId } from '../jwtUtil.js';
import {
  validatePasswordShape,
  buildForbiddenFragments,
  passwordContainsForbidden,
} from '../passwordPolicy.js';
import { isDbConnectionError, sendDbUnavailable } from '../dbErrors.js';

function boolEstado(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function fechaCreacionIso(row) {
  if (row.FechaCreacion instanceof Date) {
    return row.FechaCreacion.toISOString().slice(0, 10);
  }
  if (row.FechaCreacion) return String(row.FechaCreacion).slice(0, 10);
  return '';
}

function mapUsuario(row) {
  const estadoActivo = boolEstado(row.Estado);
  let creador = String(row.CreadorNombre || '').trim();
  if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
  if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
  if (!creador) creador = '—';

  return {
    id: row.IdUsuario,
    numeroIdentificacion:
      row.NumeroIdentificacion != null ? String(row.NumeroIdentificacion).trim() : '',
    idRoles: row.IdRoles != null ? Number(row.IdRoles) : null,
    rolNombre: String(row.RolNombre || '').trim() || '—',
    idTipoIdentificacion:
      row.IdTipoIdentificacion != null ? Number(row.IdTipoIdentificacion) : null,
    tipoIdentificacionNombre: String(row.TipoIdentificacionNombre || '').trim() || '—',
    nombre: row.Nombre,
    apellido: row.Apellido != null ? String(row.Apellido) : '',
    correo: row.Correo,
    celular: row.Celular != null ? String(row.Celular) : '',
    usuario: row.Usuario,
    estadoActivo,
    estado: estadoActivo ? 'Activo' : 'Inactivo',
    usuarioCreador: creador,
    fechaCreacion: fechaCreacionIso(row),
  };
}

const listSql = `SELECT u.IdUsuario, u.NumeroIdentificacion, u.IdRoles, u.IdTipoIdentificacion, u.Nombre, u.Apellido, u.Correo,
    u.Celular, u.Usuario, u.Estado, u.FechaCreacion, u.UsuarioCreador,
    r.Nombre AS RolNombre,
    ti.Nombre AS TipoIdentificacionNombre,
    TRIM(CONCAT(COALESCE(uc.Nombre, ''), ' ', COALESCE(uc.Apellido, ''))) AS CreadorNombre,
    uc.Correo AS CreadorCorreo
  FROM seg__usuario u
  LEFT JOIN seg__roles r ON r.IdRoles = u.IdRoles
  LEFT JOIN seg__tipo_identificacion ti ON ti.IdTipoIdentificacion = u.IdTipoIdentificacion
  LEFT JOIN seg__usuario uc ON uc.IdUsuario = u.UsuarioCreador`;

export function usuariosRouter(pool) {
  const r = Router();

  r.get('/form-options', async (req, res) => {
    if (getSessionUserId(req) == null) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const [roles] = await pool.query(
        `SELECT IdRoles AS id, Nombre AS nombre FROM seg__roles ORDER BY Nombre ASC`
      );
      const [tipos] = await pool.query(
        `SELECT IdTipoIdentificacion AS id, Nombre AS nombre
         FROM seg__tipo_identificacion
         WHERE COALESCE(Estado, 1) = 1
         ORDER BY Nombre ASC`
      );
      res.json({ roles, tiposIdentificacion: tipos });
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    try {
      const [rows] = await pool.query(`${listSql} ORDER BY u.IdUsuario ASC`);
      res.json(rows.map(mapUsuario));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });

    const idRoles = req.body?.idRoles != null ? Number(req.body.idRoles) : NaN;
    const idTipoIdentificacion =
      req.body?.idTipoIdentificacion != null ? Number(req.body.idTipoIdentificacion) : NaN;
    const numeroIdentificacion = String(req.body?.numeroIdentificacion ?? '').trim();
    const nombre = String(req.body?.nombre ?? '').trim();
    const apellido = String(req.body?.apellido ?? '').trim();
    const correo = String(req.body?.correo ?? '').trim();
    const celularRaw = req.body?.celular != null ? String(req.body.celular).trim() : '';
    const usuario = String(req.body?.usuario ?? '').trim();
    const clave = req.body?.clave != null ? String(req.body.clave) : '';

    if (!Number.isFinite(idRoles) || idRoles <= 0) {
      return res.status(400).json({ message: 'Seleccione un rol válido' });
    }
    if (!Number.isFinite(idTipoIdentificacion) || idTipoIdentificacion <= 0) {
      return res.status(400).json({ message: 'Seleccione un tipo de identificación válido' });
    }
    if (!numeroIdentificacion) {
      return res.status(400).json({ message: 'El número de identificación es obligatorio' });
    }
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });
    if (!apellido) return res.status(400).json({ message: 'El apellido es obligatorio' });
    if (!correo) return res.status(400).json({ message: 'El correo es obligatorio' });
    if (!usuario) return res.status(400).json({ message: 'El usuario de acceso es obligatorio' });
    if (!clave) return res.status(400).json({ message: 'La contraseña es obligatoria' });

    if (!validatePasswordShape(clave)) {
      return res.status(400).json({
        message:
          'La contraseña debe tener 8–12 caracteres e incluir mayúscula, minúscula, número y símbolo.',
      });
    }

    const piiRow = { Nombre: nombre, Apellido: apellido, Usuario: usuario, Correo: correo };
    const forbidden = buildForbiddenFragments(piiRow, numeroIdentificacion);
    if (passwordContainsForbidden(clave, forbidden)) {
      return res.status(400).json({
        message: 'La contraseña no puede contener datos personales (nombre, usuario, correo, etc.).',
      });
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

      const [rolRows] = await pool.query(`SELECT IdRoles FROM seg__roles WHERE IdRoles = ? LIMIT 1`, [
        idRoles,
      ]);
      if (!rolRows.length) return res.status(400).json({ message: 'El rol indicado no existe' });

      const [tipoRows] = await pool.query(
        `SELECT IdTipoIdentificacion FROM seg__tipo_identificacion WHERE IdTipoIdentificacion = ? LIMIT 1`,
        [idTipoIdentificacion]
      );
      if (!tipoRows.length) return res.status(400).json({ message: 'El tipo de identificación no existe' });

      const [dup] = await pool.query(
        `SELECT IdUsuario FROM seg__usuario
         WHERE Correo = ? OR Usuario = ? OR NumeroIdentificacion = ? LIMIT 1`,
        [correo, usuario, numeroIdentificacion]
      );
      if (dup.length) {
        return res.status(409).json({
          message:
            'Ya existe un usuario con ese correo, nombre de usuario o número de identificación',
        });
      }

      const hash = await bcrypt.hash(clave, 10);
      const celular = celularRaw || null;

      const [ins] = await pool.query(
        `INSERT INTO seg__usuario
          (NumeroIdentificacion, IdRoles, IdTipoIdentificacion, Nombre, Apellido, Correo, Celular, Usuario, Clave, Estado, UsuarioCreador)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          numeroIdentificacion,
          idRoles,
          idTipoIdentificacion,
          nombre,
          apellido,
          correo,
          celular,
          usuario,
          hash,
          uid,
        ]
      );
      const newId = ins.insertId;
      const [createdRows] = await pool.query(`${listSql} WHERE u.IdUsuario = ?`, [newId]);
      if (!createdRows.length) {
        return res.status(500).json({ message: 'Usuario creado pero no se pudo recuperar el registro' });
      }
      res.status(201).json(mapUsuario(createdRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          message:
            'Ya existe un usuario con ese correo, nombre de usuario o número de identificación',
        });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    const sessionUid = getSessionUserId(req);
    if (sessionUid == null) return res.status(401).json({ message: 'No autorizado' });

    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Identificador inválido' });
    }

    const body = req.body ?? {};
    const hasNombre = Object.prototype.hasOwnProperty.call(body, 'nombre');
    const hasApellido = Object.prototype.hasOwnProperty.call(body, 'apellido');
    const hasNumeroIdentificacion = Object.prototype.hasOwnProperty.call(body, 'numeroIdentificacion');
    const hasCorreo = Object.prototype.hasOwnProperty.call(body, 'correo');
    const hasCelular = Object.prototype.hasOwnProperty.call(body, 'celular');
    const hasIdRoles = Object.prototype.hasOwnProperty.call(body, 'idRoles');
    const hasIdTipo = Object.prototype.hasOwnProperty.call(body, 'idTipoIdentificacion');
    const hasEstado = Object.prototype.hasOwnProperty.call(body, 'estadoActivo');
    const nuevaClave = Object.prototype.hasOwnProperty.call(body, 'nuevaClave')
      ? String(body.nuevaClave ?? '')
      : null;

    const sets = [];
    const params = [];

    if (hasNombre) {
      const nombre = String(body.nombre ?? '').trim();
      if (!nombre) return res.status(400).json({ message: 'El nombre no puede quedar vacío' });
      sets.push('Nombre = ?');
      params.push(nombre);
    }
    if (hasApellido) {
      const apellido = String(body.apellido ?? '').trim();
      if (!apellido) return res.status(400).json({ message: 'El apellido no puede quedar vacío' });
      sets.push('Apellido = ?');
      params.push(apellido);
    }
    if (hasNumeroIdentificacion) {
      const nid = String(body.numeroIdentificacion ?? '').trim();
      if (!nid) return res.status(400).json({ message: 'El número de identificación no puede quedar vacío' });
      sets.push('NumeroIdentificacion = ?');
      params.push(nid);
    }
    if (hasCorreo) {
      const correo = String(body.correo ?? '').trim();
      if (!correo) return res.status(400).json({ message: 'El correo no puede quedar vacío' });
      sets.push('Correo = ?');
      params.push(correo);
    }
    if (hasCelular) {
      const cel = String(body.celular ?? '').trim();
      sets.push('Celular = ?');
      params.push(cel || null);
    }
    if (hasIdRoles) {
      const idRoles = Number(body.idRoles);
      if (!Number.isFinite(idRoles) || idRoles <= 0) {
        return res.status(400).json({ message: 'Rol inválido' });
      }
      const [rolRows2] = await pool.query(`SELECT IdRoles FROM seg__roles WHERE IdRoles = ? LIMIT 1`, [
        idRoles,
      ]);
      if (!rolRows2.length) return res.status(400).json({ message: 'El rol indicado no existe' });
      sets.push('IdRoles = ?');
      params.push(idRoles);
    }
    if (hasIdTipo) {
      const idTipo = Number(body.idTipoIdentificacion);
      if (!Number.isFinite(idTipo) || idTipo <= 0) {
        return res.status(400).json({ message: 'Tipo de identificación inválido' });
      }
      const [tipoRows2] = await pool.query(
        `SELECT IdTipoIdentificacion FROM seg__tipo_identificacion WHERE IdTipoIdentificacion = ? LIMIT 1`,
        [idTipo]
      );
      if (!tipoRows2.length) return res.status(400).json({ message: 'El tipo de identificación no existe' });
      sets.push('IdTipoIdentificacion = ?');
      params.push(idTipo);
    }
    if (hasEstado) {
      const on = boolEstado(body.estadoActivo);
      sets.push('Estado = ?');
      params.push(on ? 1 : 0);
    }

    if (nuevaClave !== null && nuevaClave !== '') {
      if (!validatePasswordShape(nuevaClave)) {
        return res.status(400).json({
          message:
            'La nueva contraseña debe tener 8–12 caracteres e incluir mayúscula, minúscula, número y símbolo.',
        });
      }
      const [curRows] = await pool.query(
        `SELECT Nombre, Apellido, Usuario, Correo, NumeroIdentificacion FROM seg__usuario WHERE IdUsuario = ?`,
        [id]
      );
      if (!curRows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
      const current = curRows[0];
      const forbidden = buildForbiddenFragments(
        current,
        current.NumeroIdentificacion != null ? String(current.NumeroIdentificacion) : ''
      );
      if (passwordContainsForbidden(nuevaClave, forbidden)) {
        return res.status(400).json({
          message: 'La contraseña no puede contener datos personales (nombre, usuario, correo, etc.).',
        });
      }
      const hash = await bcrypt.hash(nuevaClave, 10);
      sets.push('Clave = ?');
      params.push(hash);
    }

    if (!sets.length) {
      return res.status(400).json({ message: 'No se recibieron cambios' });
    }

    params.push(id);

    try {
      if (hasCorreo) {
        const correo = String(body.correo ?? '').trim();
        const [d] = await pool.query(
          `SELECT IdUsuario FROM seg__usuario WHERE Correo = ? AND IdUsuario <> ? LIMIT 1`,
          [correo, id]
        );
        if (d.length) return res.status(409).json({ message: 'Ya existe otro usuario con ese correo' });
      }
      if (hasNumeroIdentificacion) {
        const nid = String(body.numeroIdentificacion ?? '').trim();
        const [d2] = await pool.query(
          `SELECT IdUsuario FROM seg__usuario WHERE NumeroIdentificacion = ? AND IdUsuario <> ? LIMIT 1`,
          [nid, id]
        );
        if (d2.length) {
          return res.status(409).json({ message: 'Ya existe otro usuario con ese número de identificación' });
        }
      }

      const [result] = await pool.query(
        `UPDATE seg__usuario SET ${sets.join(', ')} WHERE IdUsuario = ?`,
        params
      );
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const [updatedRows] = await pool.query(`${listSql} WHERE u.IdUsuario = ?`, [id]);
      if (!updatedRows.length) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapUsuario(updatedRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          message:
            'Ya existe otro usuario con ese correo, nombre de usuario o número de identificación',
        });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

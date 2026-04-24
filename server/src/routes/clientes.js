import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';
import { isDbConnectionError, sendDbUnavailable } from '../dbErrors.js';

const listSql = `SELECT c.IdCliente, c.IdTipoCliente, c.IdCategoriaCliente, c.IdTipoIdentificacion,
    c.NumeroIdentificacion, c.DigitoVerificacion, c.Nombre, c.Apellidos, c.NombreComercial, c.RazonSocial,
    c.Direccion, c.Celular, c.Correo, c.Estado, c.FechaCreacion, c.UsuarioCreador,
    tc.Nombre AS TipoClienteNombre, cc.Nombre AS CategoriaClienteNombre, ti.Nombre AS TipoIdentificacionNombre,
    TRIM(CONCAT(COALESCE(uc.Nombre, ''), ' ', COALESCE(uc.Apellido, ''))) AS CreadorNombre,
    uc.Correo AS CreadorCorreo
  FROM est__cliente c
  LEFT JOIN seg__tipo_cliente tc ON tc.IdTipoCliente = c.IdTipoCliente
  LEFT JOIN seg__categoria_cliente cc ON cc.IdCategoriaCliente = c.IdCategoriaCliente
  LEFT JOIN seg__tipo_identificacion ti ON ti.IdTipoIdentificacion = c.IdTipoIdentificacion
  LEFT JOIN seg__usuario uc ON uc.IdUsuario = c.UsuarioCreador`;

function boolEstado(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function fechaIso(row) {
  if (row.FechaCreacion instanceof Date) return row.FechaCreacion.toISOString().slice(0, 10);
  if (row.FechaCreacion) return String(row.FechaCreacion).slice(0, 10);
  return '';
}

function mapCliente(row) {
  const estadoRaw = row.Estado;
  const activo = boolEstado(estadoRaw);
  let creador = String(row.CreadorNombre || '').trim();
  if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
  if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
  if (!creador) creador = '—';

  return {
    id: row.IdCliente,
    idTipoCliente: row.IdTipoCliente != null ? Number(row.IdTipoCliente) : null,
    tipoClienteNombre: String(row.TipoClienteNombre || '').trim() || '—',
    idCategoriaCliente: row.IdCategoriaCliente != null ? Number(row.IdCategoriaCliente) : null,
    categoriaClienteNombre: String(row.CategoriaClienteNombre || '').trim() || '—',
    idTipoIdentificacion: row.IdTipoIdentificacion != null ? Number(row.IdTipoIdentificacion) : null,
    tipoIdentificacionNombre: String(row.TipoIdentificacionNombre || '').trim() || '—',
    identificacion: row.NumeroIdentificacion != null ? String(row.NumeroIdentificacion) : '',
    digitoVerificacion:
      row.DigitoVerificacion != null && row.DigitoVerificacion !== ''
        ? String(row.DigitoVerificacion)
        : undefined,
    nombre: row.Nombre != null ? String(row.Nombre) : '',
    apellidos: row.Apellidos != null ? String(row.Apellidos) : '',
    nombreComercial: row.NombreComercial != null ? String(row.NombreComercial) : '',
    razonSocial: row.RazonSocial != null ? String(row.RazonSocial) : '',
    direccion: row.Direccion != null ? String(row.Direccion) : '',
    celular: row.Celular != null ? String(row.Celular) : '',
    correo: row.Correo != null ? String(row.Correo) : '',
    estado: activo ? 'Activo' : 'Eliminado',
    estadoActivo: activo,
    usuarioCreacion: creador,
    fechaCreacion: fechaIso(row),
  };
}

export function clientesRouter(pool) {
  const r = Router();

  r.get('/catalogos', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const [tiposCliente] = await pool.query(
        `SELECT IdTipoCliente AS id, Nombre AS nombre FROM seg__tipo_cliente
         WHERE COALESCE(Estado, 1) = 1 ORDER BY Nombre ASC`
      );
      const [categoriasCliente] = await pool.query(
        `SELECT IdCategoriaCliente AS id, Nombre AS nombre FROM seg__categoria_cliente
         WHERE COALESCE(Estado, 1) = 1 ORDER BY Nombre ASC`
      );
      const [tiRows] = await pool.query(
        `SELECT IdTipoIdentificacion AS id, Nombre AS nombre FROM seg__tipo_identificacion
         WHERE COALESCE(Estado, 1) = 1 ORDER BY Nombre ASC`
      );
      const tiposIdentificacion = tiRows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        esNit: String(row.nombre || '')
          .toUpperCase()
          .includes('NIT'),
      }));
      res.json({ tiposCliente, categoriasCliente, tiposIdentificacion });
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const [rows] = await pool.query(
        `${listSql} WHERE COALESCE(c.Estado, 1) = 1 ORDER BY c.IdCliente ASC`
      );
      res.json(rows.map(mapCliente));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });

    const idTipoCliente = Number(req.body?.idTipoCliente);
    const idCategoriaCliente = Number(req.body?.idCategoriaCliente);
    const idTipoIdentificacion = Number(req.body?.idTipoIdentificacion);
    const numeroIdentificacion = String(req.body?.identificacion ?? '').trim();
    const digitoVerificacion =
      req.body?.digitoVerificacion != null && String(req.body.digitoVerificacion).trim() !== ''
        ? Number(req.body.digitoVerificacion)
        : null;
    const nombre = req.body?.nombre != null ? String(req.body.nombre).trim() : '';
    const apellidos = req.body?.apellidos != null ? String(req.body.apellidos).trim() : '';
    const nombreComercial = req.body?.nombreComercial != null ? String(req.body.nombreComercial).trim() : '';
    const razonSocial = req.body?.razonSocial != null ? String(req.body.razonSocial).trim() : '';
    const direccion = String(req.body?.direccion ?? '').trim();
    const celular = String(req.body?.celular ?? '').trim();
    const correo = String(req.body?.correo ?? '').trim();

    if (!Number.isFinite(idTipoCliente) || idTipoCliente <= 0) {
      return res.status(400).json({ message: 'Seleccione un tipo de cliente' });
    }
    if (!Number.isFinite(idCategoriaCliente) || idCategoriaCliente <= 0) {
      return res.status(400).json({ message: 'Seleccione una categoría' });
    }
    if (!Number.isFinite(idTipoIdentificacion) || idTipoIdentificacion <= 0) {
      return res.status(400).json({ message: 'Seleccione un tipo de identificación' });
    }
    if (!numeroIdentificacion) {
      return res.status(400).json({ message: 'El número de identificación es obligatorio' });
    }
    if (!direccion) return res.status(400).json({ message: 'La dirección es obligatoria' });
    if (!celular) return res.status(400).json({ message: 'El celular es obligatorio' });
    if (!correo) return res.status(400).json({ message: 'El correo es obligatorio' });

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

      const [fkTc] = await pool.query(
        `SELECT IdTipoCliente FROM seg__tipo_cliente WHERE IdTipoCliente = ? LIMIT 1`,
        [idTipoCliente]
      );
      if (!fkTc.length) return res.status(400).json({ message: 'Tipo de cliente inválido' });
      const [fkCc] = await pool.query(
        `SELECT IdCategoriaCliente FROM seg__categoria_cliente WHERE IdCategoriaCliente = ? LIMIT 1`,
        [idCategoriaCliente]
      );
      if (!fkCc.length) return res.status(400).json({ message: 'Categoría inválida' });
      const [fkTi] = await pool.query(
        `SELECT IdTipoIdentificacion FROM seg__tipo_identificacion WHERE IdTipoIdentificacion = ? LIMIT 1`,
        [idTipoIdentificacion]
      );
      if (!fkTi.length) return res.status(400).json({ message: 'Tipo de identificación inválido' });

      const [ins] = await pool.query(
        `INSERT INTO est__cliente (
          IdTipoCliente, IdCategoriaCliente, IdTipoIdentificacion, NumeroIdentificacion, DigitoVerificacion,
          Nombre, Apellidos, NombreComercial, RazonSocial, Direccion, Celular, Correo, Estado, UsuarioCreador,
          FechaCreacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
        [
          idTipoCliente,
          idCategoriaCliente,
          idTipoIdentificacion,
          numeroIdentificacion,
          Number.isFinite(digitoVerificacion) ? digitoVerificacion : null,
          nombre || null,
          apellidos || null,
          nombreComercial || null,
          razonSocial || null,
          direccion,
          celular,
          correo,
          uid,
        ]
      );
      const newId = ins.insertId;
      const [createdRows] = await pool.query(`${listSql} WHERE c.IdCliente = ?`, [newId]);
      if (!createdRows.length) {
        return res.status(500).json({ message: 'Cliente creado pero no se pudo recuperar el registro' });
      }
      res.status(201).json(mapCliente(createdRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un cliente con esa identificación' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: 'Identificador inválido' });

    const body = req.body ?? {};

    if (body.eliminar === true) {
      try {
        const [result] = await pool.query(`UPDATE est__cliente SET Estado = 0 WHERE IdCliente = ?`, [id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Cliente no encontrado' });
        const [updatedRows] = await pool.query(`${listSql} WHERE c.IdCliente = ?`, [id]);
        if (!updatedRows.length) {
          return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
        }
        return res.json(mapCliente(updatedRows[0]));
      } catch (e) {
        if (isDbConnectionError(e)) return sendDbUnavailable(res);
        console.error(e);
        return res.status(500).json({ message: 'Error del servidor' });
      }
    }

    const hasTipoCliente = Object.prototype.hasOwnProperty.call(body, 'idTipoCliente');
    const hasCategoria = Object.prototype.hasOwnProperty.call(body, 'idCategoriaCliente');
    const hasNombre = Object.prototype.hasOwnProperty.call(body, 'nombre');
    const hasApellidos = Object.prototype.hasOwnProperty.call(body, 'apellidos');
    const hasNombreComercial = Object.prototype.hasOwnProperty.call(body, 'nombreComercial');
    const hasRazonSocial = Object.prototype.hasOwnProperty.call(body, 'razonSocial');
    const hasDireccion = Object.prototype.hasOwnProperty.call(body, 'direccion');
    const hasCelular = Object.prototype.hasOwnProperty.call(body, 'celular');
    const hasCorreo = Object.prototype.hasOwnProperty.call(body, 'correo');
    const hasDigito = Object.prototype.hasOwnProperty.call(body, 'digitoVerificacion');

    const sets = [];
    const params = [];

    if (hasTipoCliente) {
      const v = Number(body.idTipoCliente);
      if (!Number.isFinite(v) || v <= 0) return res.status(400).json({ message: 'Tipo de cliente inválido' });
      const [fk] = await pool.query(
        `SELECT IdTipoCliente FROM seg__tipo_cliente WHERE IdTipoCliente = ? LIMIT 1`,
        [v]
      );
      if (!fk.length) return res.status(400).json({ message: 'Tipo de cliente inválido' });
      sets.push('IdTipoCliente = ?');
      params.push(v);
    }
    if (hasCategoria) {
      const v = Number(body.idCategoriaCliente);
      if (!Number.isFinite(v) || v <= 0) return res.status(400).json({ message: 'Categoría inválida' });
      const [fk] = await pool.query(
        `SELECT IdCategoriaCliente FROM seg__categoria_cliente WHERE IdCategoriaCliente = ? LIMIT 1`,
        [v]
      );
      if (!fk.length) return res.status(400).json({ message: 'Categoría inválida' });
      sets.push('IdCategoriaCliente = ?');
      params.push(v);
    }
    if (hasNombre) {
      sets.push('Nombre = ?');
      params.push(String(body.nombre ?? '').trim() || null);
    }
    if (hasApellidos) {
      sets.push('Apellidos = ?');
      params.push(String(body.apellidos ?? '').trim() || null);
    }
    if (hasNombreComercial) {
      sets.push('NombreComercial = ?');
      params.push(String(body.nombreComercial ?? '').trim() || null);
    }
    if (hasRazonSocial) {
      sets.push('RazonSocial = ?');
      params.push(String(body.razonSocial ?? '').trim() || null);
    }
    if (hasDireccion) {
      const d = String(body.direccion ?? '').trim();
      if (!d) return res.status(400).json({ message: 'La dirección no puede quedar vacía' });
      sets.push('Direccion = ?');
      params.push(d);
    }
    if (hasCelular) {
      const c = String(body.celular ?? '').trim();
      if (!c) return res.status(400).json({ message: 'El celular no puede quedar vacío' });
      sets.push('Celular = ?');
      params.push(c);
    }
    if (hasCorreo) {
      const c = String(body.correo ?? '').trim();
      if (!c) return res.status(400).json({ message: 'El correo no puede quedar vacío' });
      sets.push('Correo = ?');
      params.push(c);
    }
    if (hasDigito) {
      const raw = body.digitoVerificacion;
      const d =
        raw != null && String(raw).trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) : null;
      sets.push('DigitoVerificacion = ?');
      params.push(d);
    }

    if (!sets.length) return res.status(400).json({ message: 'No se recibieron campos para actualizar' });
    params.push(id);

    try {
      const [result] = await pool.query(
        `UPDATE est__cliente SET ${sets.join(', ')} WHERE IdCliente = ?`,
        params
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Cliente no encontrado' });
      const [updatedRows] = await pool.query(`${listSql} WHERE c.IdCliente = ?`, [id]);
      if (!updatedRows.length) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapCliente(updatedRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

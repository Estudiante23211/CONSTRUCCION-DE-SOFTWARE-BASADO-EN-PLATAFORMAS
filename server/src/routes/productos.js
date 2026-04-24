import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';
import { isDbConnectionError, sendDbUnavailable } from '../dbErrors.js';

const invUnidadJoin = `
  LEFT JOIN (
    SELECT i1.IdProducto, i1.IdUnidadMedida
    FROM com__inventario i1
    INNER JOIN (
      SELECT IdProducto, MIN(IdInventario) AS MinInv FROM com__inventario GROUP BY IdProducto
    ) pick ON pick.IdProducto = i1.IdProducto AND pick.MinInv = i1.IdInventario
  ) inv_um ON inv_um.IdProducto = p.IdProducto
  LEFT JOIN bas__unidad_medida um ON um.IdUnidadMedida = inv_um.IdUnidadMedida`;

const listSqlWithCodigo = `SELECT p.IdProducto, p.Codigo, p.IdCategoria, p.Nombre, p.Descripcion, p.Estado, p.FechaCreacion, p.UsuarioCreador,
    c.Nombre AS CategoriaNombre,
    TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
    u.Correo AS CreadorCorreo,
    um.Nombre AS UnidadMedidaNombre
  FROM com__producto p
  LEFT JOIN com__categoria_producto c ON c.IdCategoria = p.IdCategoria
  LEFT JOIN seg__usuario u ON u.IdUsuario = p.UsuarioCreador
  ${invUnidadJoin}`;

const listSqlNoCodigo = `SELECT p.IdProducto, p.IdCategoria, p.Nombre, p.Descripcion, p.Estado, p.FechaCreacion, p.UsuarioCreador,
    c.Nombre AS CategoriaNombre,
    TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
    u.Correo AS CreadorCorreo,
    um.Nombre AS UnidadMedidaNombre
  FROM com__producto p
  LEFT JOIN com__categoria_producto c ON c.IdCategoria = p.IdCategoria
  LEFT JOIN seg__usuario u ON u.IdUsuario = p.UsuarioCreador
  ${invUnidadJoin}`;

function boolEstado(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function fechaIso(row) {
  if (row.FechaCreacion instanceof Date) return row.FechaCreacion.toISOString().slice(0, 10);
  if (row.FechaCreacion) return String(row.FechaCreacion).slice(0, 10);
  return '';
}

function codigoDisplay(row) {
  const raw = row.Codigo != null ? String(row.Codigo).trim() : '';
  if (raw) return raw;
  const id = Number(row.IdProducto);
  return Number.isFinite(id) && id > 0 ? `PRD-${id}` : '';
}

function mapProducto(row) {
  const activo = boolEstado(row.Estado);
  let creador = String(row.CreadorNombre || '').trim();
  if (!creador && row.CreadorCorreo) creador = String(row.CreadorCorreo).trim();
  if (!creador && row.UsuarioCreador != null) creador = `Usuario #${row.UsuarioCreador}`;
  if (!creador) creador = '—';
  return {
    id: Number(row.IdProducto),
    codigo: codigoDisplay(row),
    idCategoria: row.IdCategoria != null ? Number(row.IdCategoria) : null,
    categoriaNombre: String(row.CategoriaNombre || '').trim() || '—',
    unidadMedidaNombre: String(row.UnidadMedidaNombre || '').trim() || '—',
    nombre: row.Nombre != null ? String(row.Nombre) : '',
    descripcion: row.Descripcion != null ? String(row.Descripcion) : '',
    estado: activo ? 'Activo' : 'Inactivo',
    estadoActivo: activo,
    usuarioCreador: creador,
    fechaCreacion: fechaIso(row),
  };
}

export function productosRouter(pool) {
  const r = Router();

  /** @type {boolean | null} */
  let codigoColumnExists = null;

  async function hasCodigoColumn() {
    if (codigoColumnExists !== null) return codigoColumnExists;
    try {
      await pool.query('SELECT Codigo FROM com__producto LIMIT 0');
      codigoColumnExists = true;
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR' && String(e.sqlMessage || '').includes('Codigo')) {
        codigoColumnExists = false;
      } else {
        throw e;
      }
    }
    return codigoColumnExists;
  }

  async function listSql() {
    return (await hasCodigoColumn()) ? listSqlWithCodigo : listSqlNoCodigo;
  }

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const sql = await listSql();
      const [rows] = await pool.query(
        `${sql} WHERE COALESCE(p.Estado, 1) = 1 ORDER BY p.IdProducto ASC`
      );
      res.json(rows.map(mapProducto));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });

    const codigo = String(req.body?.codigo ?? '').trim();
    const idCategoria = Number(req.body?.idCategoria);
    const nombre = String(req.body?.nombre ?? '').trim();
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion).trim() : '';

    if (!Number.isFinite(idCategoria) || idCategoria <= 0) {
      return res.status(400).json({ message: 'Seleccione una categoría válida' });
    }
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' });

    try {
      const dbHasCodigo = await hasCodigoColumn();
      if (dbHasCodigo && !codigo) {
        return res.status(400).json({ message: 'El código es obligatorio' });
      }

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

      const [fkCat] = await pool.query(
        `SELECT IdCategoria FROM com__categoria_producto WHERE IdCategoria = ? LIMIT 1`,
        [idCategoria]
      );
      if (!fkCat.length) return res.status(400).json({ message: 'Categoría inválida' });

      let ins;
      if (dbHasCodigo) {
        [ins] = await pool.query(
          `INSERT INTO com__producto (Codigo, IdCategoria, Nombre, Descripcion, Estado, UsuarioCreador, FechaCreacion)
           VALUES (?, ?, ?, ?, 1, ?, NOW())`,
          [codigo, idCategoria, nombre, descripcion || null, uid]
        );
      } else {
        [ins] = await pool.query(
          `INSERT INTO com__producto (IdCategoria, Nombre, Descripcion, Estado, UsuarioCreador, FechaCreacion)
           VALUES (?, ?, ?, 1, ?, NOW())`,
          [idCategoria, nombre, descripcion || null, uid]
        );
      }
      const newId = ins.insertId;
      const sql = await listSql();
      const [createdRows] = await pool.query(`${sql} WHERE p.IdProducto = ?`, [newId]);
      if (!createdRows.length) {
        return res.status(500).json({ message: 'Producto creado pero no se pudo recuperar el registro' });
      }
      res.status(201).json(mapProducto(createdRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un producto con ese código' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:id', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: 'Identificador inválido' });

    const body = req.body ?? {};
    const hasCodigo = Object.prototype.hasOwnProperty.call(body, 'codigo');
    const hasIdCategoria = Object.prototype.hasOwnProperty.call(body, 'idCategoria');
    const hasNombre = Object.prototype.hasOwnProperty.call(body, 'nombre');
    const hasDescripcion = Object.prototype.hasOwnProperty.call(body, 'descripcion');
    const hasEstado = Object.prototype.hasOwnProperty.call(body, 'estadoActivo');

    const sets = [];
    const params = [];

    const dbHasCodigo = await hasCodigoColumn();
    if (hasCodigo && dbHasCodigo) {
      const c = String(body.codigo ?? '').trim();
      if (!c) return res.status(400).json({ message: 'El código no puede quedar vacío' });
      sets.push('Codigo = ?');
      params.push(c);
    }

    if (hasIdCategoria) {
      const v = Number(body.idCategoria);
      if (!Number.isFinite(v) || v <= 0) return res.status(400).json({ message: 'Categoría inválida' });
      const [fk] = await pool.query(
        `SELECT IdCategoria FROM com__categoria_producto WHERE IdCategoria = ? LIMIT 1`,
        [v]
      );
      if (!fk.length) return res.status(400).json({ message: 'Categoría inválida' });
      sets.push('IdCategoria = ?');
      params.push(v);
    }
    if (hasNombre) {
      const n = String(body.nombre ?? '').trim();
      if (!n) return res.status(400).json({ message: 'El nombre no puede quedar vacío' });
      sets.push('Nombre = ?');
      params.push(n);
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

    if (!sets.length) {
      if (hasCodigo && !dbHasCodigo) {
        return res.status(400).json({
          message:
            'En esta base de datos no existe la columna Codigo. Ejecute database/add_com__producto_codigo.sql para poder editar el código.',
        });
      }
      return res.status(400).json({ message: 'No se recibieron campos para actualizar' });
    }
    params.push(id);

    try {
      const [result] = await pool.query(
        `UPDATE com__producto SET ${sets.join(', ')} WHERE IdProducto = ?`,
        params
      );
      if (!result.affectedRows) return res.status(404).json({ message: 'Producto no encontrado' });
      const sql = await listSql();
      const [updatedRows] = await pool.query(`${sql} WHERE p.IdProducto = ?`, [id]);
      if (!updatedRows.length) {
        return res.status(500).json({ message: 'Actualizado pero no se pudo recuperar el registro' });
      }
      res.json(mapProducto(updatedRows[0]));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un producto con ese código' });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

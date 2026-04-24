import { Router } from 'express';
import { getSessionUserId } from '../jwtUtil.js';
import { isDbConnectionError, sendDbUnavailable } from '../dbErrors.js';

const ESTADO_NUM = {
  Pendiente: 1,
  EnProceso: 2,
  Entregado: 3,
  Cancelado: 4,
};

const ESTADO_LABEL = {
  1: 'Pendiente',
  2: 'En proceso',
  3: 'Entregado',
  4: 'Cancelado',
};

function labelEstado(n) {
  const k = Number(n);
  return ESTADO_LABEL[k] || 'Pendiente';
}

/** Valor numérico 1–4 desde la BD (CAST recomendado en SQL; evita TINYINT(1) como boolean en mysql2). */
function leerEstadoCabeceraDb(raw) {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= 4) return n;
  return ESTADO_NUM.Pendiente;
}

function simboloMoneda(nombre) {
  const t = String(nombre || '').trim().toUpperCase();
  if (t === 'USD') return 'US$';
  if (t === 'EUR') return '€';
  if (t === 'COP' || t === '') return '$';
  return '$';
}

function fechaCreacionIso(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v) return String(v).slice(0, 10);
  return '';
}

function fechaEntregaMostrar(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 16).replace('T', ' ');
  const s = String(v);
  if (s.length >= 16) return s.slice(0, 16).replace('T', ' ');
  return s.slice(0, 19).replace('T', ' ');
}

function entregadoPorMostrar(row) {
  const ue = String(row.EntregadoPorNombreUe || '').trim();
  if (ue) return ue;
  if (row.Entregado_por != null) return `Usuario #${row.Entregado_por}`;
  return '—';
}

function creadorLegible(row) {
  let s = String(row.CreadorNombre || '').trim();
  if (!s && row.CreadorCorreo) s = String(row.CreadorCorreo).trim();
  if (!s && row.UsuarioPedidoId != null) s = `Usuario #${row.UsuarioPedidoId}`;
  return s || '—';
}

/** Unidad por defecto del producto (misma lógica que listado de productos / inventario). */
const DETALLE_INV_UNIDAD_JOIN = `
LEFT JOIN (
  SELECT i1.IdProducto, i1.IdUnidadMedida
  FROM com__inventario i1
  INNER JOIN (
    SELECT IdProducto, MIN(IdInventario) AS MinInv FROM com__inventario GROUP BY IdProducto
  ) pick ON pick.IdProducto = i1.IdProducto AND pick.MinInv = i1.IdInventario
) inv_um ON inv_um.IdProducto = d.IdProducto`;

const LIST_SQL_DETALLE = `
SELECT
  d.IdDetalle,
  p.IdPedido,
  p.IdCliente,
  p.IdTipoMoneda,
  COALESCE(CAST(p.Estado AS SIGNED), 1) AS EstadoPedido,
  p.FechaCreacion AS FechaPedidoCreacion,
  p.UsuarioCreador AS UsuarioPedidoId,
  COALESCE(
    NULLIF(TRIM(c.RazonSocial), ''),
    NULLIF(TRIM(c.NombreComercial), ''),
    TRIM(CONCAT(COALESCE(c.Nombre, ''), ' ', COALESCE(c.Apellidos, '')))
  ) AS ClienteNombre,
  d.IdProducto,
  pr.Nombre AS ProductoNombre,
  tm.Nombre AS MonedaNombre,
  d.Descripcion,
  d.Cantidad,
  COALESCE(d.IdUnidadMedida, inv_um.IdUnidadMedida) AS IdUnidadMedida,
  d.Medidas,
  TRIM(COALESCE(um_det.Nombre, '')) AS UnidadMedidaNombre,
  d.PrecioUnitario,
  d.Descuento,
  d.Total,
  d.Observacion,
  d.Fecha_entrega,
  d.Entregado_por,
  d.Recibido_por,
  TRIM(CONCAT(COALESCE(u.Nombre, ''), ' ', COALESCE(u.Apellido, ''))) AS CreadorNombre,
  u.Correo AS CreadorCorreo,
  TRIM(CONCAT(COALESCE(ue.Nombre, ''), ' ', COALESCE(ue.Apellido, ''))) AS EntregadoPorNombreUe
FROM com__pedidos_detalle d
INNER JOIN com__pedidos p ON p.IdPedido = d.IdPedido
INNER JOIN est__cliente c ON c.IdCliente = p.IdCliente
INNER JOIN com__producto pr ON pr.IdProducto = d.IdProducto
${DETALLE_INV_UNIDAD_JOIN}
INNER JOIN bas__tipo_moneda tm ON tm.IdTipoMoneda = p.IdTipoMoneda
LEFT JOIN bas__unidad_medida um_det ON um_det.IdUnidadMedida = COALESCE(d.IdUnidadMedida, inv_um.IdUnidadMedida)
LEFT JOIN seg__usuario u ON u.IdUsuario = p.UsuarioCreador
LEFT JOIN seg__usuario ue ON ue.IdUsuario = d.Entregado_por`;

function mapPedidoListRow(row) {
  const cantidad = Number(row.Cantidad) || 0;
  const precio = Number(row.PrecioUnitario) || 0;
  const desc = Number(row.Descuento) || 0;
  const monedaNombre = String(row.MonedaNombre || '').trim();
  const simbolo = simboloMoneda(monedaNombre);
  const total = row.Total != null ? Number(row.Total) : cantidad * precio - desc;
  const estadoNum = leerEstadoCabeceraDb(row.EstadoPedido);
  return {
    id: Number(row.IdDetalle),
    idPedido: Number(row.IdPedido),
    estadoCodigo: estadoNum,
    idCliente: Number(row.IdCliente),
    clienteNombre: String(row.ClienteNombre || '').trim() || '—',
    idProducto: Number(row.IdProducto),
    productoNombre: String(row.ProductoNombre || '').trim() || '—',
    idTipoMoneda: Number(row.IdTipoMoneda),
    moneda: monedaNombre,
    simboloMoneda: simbolo,
    descripcion: row.Descripcion != null ? String(row.Descripcion) : '',
    cantidad,
    idUnidadMedida:
      row.IdUnidadMedida != null && Number(row.IdUnidadMedida) > 0 ? Number(row.IdUnidadMedida) : 0,
    unidadMedidaNombre: String(row.UnidadMedidaNombre || '').trim() || '—',
    medidas: row.Medidas != null ? String(row.Medidas) : '',
    descuento: desc,
    precioUnitario: precio,
    subtotal: cantidad * precio,
    total,
    estado: labelEstado(estadoNum),
    usuarioCreacion: creadorLegible(row),
    fechaCreacion: fechaCreacionIso(row.FechaPedidoCreacion),
    observacionEliminacion: row.Observacion != null ? String(row.Observacion) : undefined,
    fechaEntrega: row.Fecha_entrega ? fechaEntregaMostrar(row.Fecha_entrega) : '',
    entregadoPorTexto: entregadoPorMostrar(row),
    recibidoPor: row.Recibido_por != null ? String(row.Recibido_por).trim() : '',
  };
}

export function pedidosRouter(pool) {
  const r = Router();

  r.get('/', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    try {
      const [rows] = await pool.query(`${LIST_SQL_DETALLE} ORDER BY p.FechaCreacion DESC, d.IdDetalle DESC`);
      res.json(rows.map(mapPedidoListRow));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_BAD_FIELD_ERROR' && String(e.sqlMessage || '').includes('Estado')) {
        return res.status(500).json({
          message:
            'Falta la columna Estado en com__pedidos. Ejecute database/add_com__pedidos_estado.sql y reinicie la API.',
        });
      }
      if (e.code === 'ER_BAD_FIELD_ERROR' && String(e.sqlMessage || '').includes('IdUnidadMedida')) {
        return res.status(500).json({
          message:
            'Falta la columna IdUnidadMedida en com__pedidos_detalle. Ejecute database/add_com__pedidos_detalle_id_unidad_medida.sql y reinicie la API.',
        });
      }
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.post('/', async (req, res) => {
    const uid = getSessionUserId(req);
    if (uid == null) return res.status(401).json({ message: 'Debe iniciar sesión' });

    const idCliente = Number(req.body?.idCliente);
    const idTipoMoneda = Number(req.body?.idTipoMoneda);
    const idProducto = Number(req.body?.idProducto);
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion).trim() : '';
    const cantidad = Number(req.body?.cantidad);
    const idUnidadMedida = Number(req.body?.idUnidadMedida);
    const medidas = req.body?.medidas != null ? String(req.body.medidas).trim() : '';
    const precioUnitario = Number(req.body?.precioUnitario);
    const descuento = Number(req.body?.descuento ?? 0);
    const totalCli = req.body?.total != null ? Number(req.body.total) : NaN;

    if (!Number.isFinite(idCliente) || idCliente <= 0) {
      return res.status(400).json({ message: 'Cliente inválido' });
    }
    if (!Number.isFinite(idTipoMoneda) || idTipoMoneda <= 0) {
      return res.status(400).json({ message: 'Moneda inválida' });
    }
    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return res.status(400).json({ message: 'Producto inválido' });
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
    if (!Number.isFinite(idUnidadMedida) || idUnidadMedida <= 0) {
      return res.status(400).json({ message: 'Seleccione una unidad de medida' });
    }
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return res.status(400).json({ message: 'Precio unitario inválido' });
    }
    const desc = Number.isFinite(descuento) && descuento >= 0 ? descuento : 0;
    const subtotal = cantidad * precioUnitario;
    const total = Number.isFinite(totalCli) ? totalCli : subtotal - desc;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[cli]] = await conn.query(`SELECT IdCliente FROM est__cliente WHERE IdCliente = ? LIMIT 1`, [
        idCliente,
      ]);
      if (!cli) {
        await conn.rollback();
        return res.status(400).json({ message: 'Cliente no encontrado' });
      }
      const [[tm]] = await conn.query(
        `SELECT IdTipoMoneda FROM bas__tipo_moneda WHERE IdTipoMoneda = ? AND COALESCE(Estado,1)=1 LIMIT 1`,
        [idTipoMoneda]
      );
      if (!tm) {
        await conn.rollback();
        return res.status(400).json({ message: 'Tipo de moneda no encontrado' });
      }
      const [[pr]] = await conn.query(
        `SELECT IdProducto FROM com__producto WHERE IdProducto = ? AND COALESCE(Estado,1)=1 LIMIT 1`,
        [idProducto]
      );
      if (!pr) {
        await conn.rollback();
        return res.status(400).json({ message: 'Producto no encontrado' });
      }
      const [[um]] = await conn.query(
        `SELECT IdUnidadMedida FROM bas__unidad_medida WHERE IdUnidadMedida = ? LIMIT 1`,
        [idUnidadMedida]
      );
      if (!um) {
        await conn.rollback();
        return res.status(400).json({ message: 'Unidad de medida no encontrada' });
      }
      const [[u]] = await conn.query(`SELECT IdUsuario FROM seg__usuario WHERE IdUsuario = ? LIMIT 1`, [uid]);
      if (!u) {
        await conn.rollback();
        return res.status(401).json({ message: 'Usuario de sesión no válido' });
      }

      const [insP] = await conn.query(
        `INSERT INTO com__pedidos (IdCliente, IdTipoMoneda, Estado, UsuarioCreador, FechaCreacion)
         VALUES (?, ?, ?, ?, NOW())`,
        [idCliente, idTipoMoneda, ESTADO_NUM.Pendiente, uid]
      );
      const idPedido = insP.insertId;

      const [insD] = await conn.query(
        `INSERT INTO com__pedidos_detalle (
           IdPedido, IdProducto, IdImpuesto, Descripcion, Cantidad, IdUnidadMedida, Medidas,
           PrecioUnitario, Descuento, Total, UsuarioCreador, FechaCreacion
         ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          idPedido,
          idProducto,
          descripcion || null,
          cantidad,
          idUnidadMedida,
          medidas || null,
          precioUnitario,
          desc,
          total,
          uid,
        ]
      );
      const detId = insD.insertId;

      await conn.commit();

      const [rows] = await pool.query(`${LIST_SQL_DETALLE} WHERE d.IdDetalle = ?`, [detId]);
      if (!rows.length) {
        return res.status(500).json({ message: 'Pedido creado pero no se pudo leer el registro' });
      }
      res.status(201).json(mapPedidoListRow(rows[0]));
    } catch (e) {
      await conn.rollback();
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      if (e.code === 'ER_BAD_FIELD_ERROR' && String(e.sqlMessage || '').includes('Estado')) {
        return res.status(500).json({
          message:
            'Falta la columna Estado en com__pedidos. Ejecute database/add_com__pedidos_estado.sql y reinicie la API.',
        });
      }
      if (e.code === 'ER_BAD_FIELD_ERROR' && String(e.sqlMessage || '').includes('IdUnidadMedida')) {
        return res.status(500).json({
          message:
            'Falta la columna IdUnidadMedida en com__pedidos_detalle. Ejecute database/add_com__pedidos_detalle_id_unidad_medida.sql y reinicie la API.',
        });
      }
      res.status(500).json({ message: 'Error del servidor' });
    } finally {
      conn.release();
    }
  });

  r.patch('/detalle/:idDetalle', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const idDetalle = Number(req.params.idDetalle);
    if (!Number.isFinite(idDetalle) || idDetalle <= 0) {
      return res.status(400).json({ message: 'Identificador de línea inválido' });
    }

    const idCliente = Number(req.body?.idCliente);
    const idTipoMoneda = Number(req.body?.idTipoMoneda);
    const idProducto = Number(req.body?.idProducto);
    const descripcion = req.body?.descripcion != null ? String(req.body.descripcion).trim() : '';
    const cantidad = Number(req.body?.cantidad);
    const idUnidadMedida = Number(req.body?.idUnidadMedida);
    const medidas = req.body?.medidas != null ? String(req.body.medidas).trim() : '';
    const precioUnitario = Number(req.body?.precioUnitario);
    const descuento = Number(req.body?.descuento ?? 0);
    const totalCli = req.body?.total != null ? Number(req.body.total) : NaN;

    if (!Number.isFinite(idCliente) || idCliente <= 0) return res.status(400).json({ message: 'Cliente inválido' });
    if (!Number.isFinite(idTipoMoneda) || idTipoMoneda <= 0) {
      return res.status(400).json({ message: 'Moneda inválida' });
    }
    if (!Number.isFinite(idProducto) || idProducto <= 0) {
      return res.status(400).json({ message: 'Producto inválido' });
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' });
    }
    if (!Number.isFinite(idUnidadMedida) || idUnidadMedida <= 0) {
      return res.status(400).json({ message: 'Seleccione una unidad de medida' });
    }
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return res.status(400).json({ message: 'Precio unitario inválido' });
    }
    const desc = Number.isFinite(descuento) && descuento >= 0 ? descuento : 0;
    const subtotal = cantidad * precioUnitario;
    const total = Number.isFinite(totalCli) ? totalCli : subtotal - desc;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[um]] = await conn.query(
        `SELECT IdUnidadMedida FROM bas__unidad_medida WHERE IdUnidadMedida = ? LIMIT 1`,
        [idUnidadMedida]
      );
      if (!um) {
        await conn.rollback();
        return res.status(400).json({ message: 'Unidad de medida no encontrada' });
      }
      const [[d]] = await conn.query(`SELECT IdPedido FROM com__pedidos_detalle WHERE IdDetalle = ? LIMIT 1`, [
        idDetalle,
      ]);
      if (!d) {
        await conn.rollback();
        return res.status(404).json({ message: 'Línea de pedido no encontrada' });
      }
      const idPedido = Number(d.IdPedido);

      const [[ped]] = await conn.query(
        `SELECT CAST(Estado AS SIGNED) AS Estado FROM com__pedidos WHERE IdPedido = ? LIMIT 1`,
        [idPedido]
      );
      if (ped && leerEstadoCabeceraDb(ped.Estado) === ESTADO_NUM.Cancelado) {
        await conn.rollback();
        return res.status(400).json({ message: 'No se puede editar un pedido cancelado' });
      }

      await conn.query(
        `UPDATE com__pedidos SET IdCliente = ?, IdTipoMoneda = ? WHERE IdPedido = ?`,
        [idCliente, idTipoMoneda, idPedido]
      );
      await conn.query(
        `UPDATE com__pedidos_detalle SET
           IdProducto = ?, Descripcion = ?, Cantidad = ?, IdUnidadMedida = ?, Medidas = ?,
           PrecioUnitario = ?, Descuento = ?, Total = ?
         WHERE IdDetalle = ?`,
        [idProducto, descripcion || null, cantidad, idUnidadMedida, medidas || null, precioUnitario, desc, total, idDetalle]
      );

      await conn.commit();
      const [rows] = await pool.query(`${LIST_SQL_DETALLE} WHERE d.IdDetalle = ?`, [idDetalle]);
      if (!rows.length) return res.status(500).json({ message: 'Actualizado pero no se pudo leer el registro' });
      res.json(mapPedidoListRow(rows[0]));
    } catch (e) {
      await conn.rollback();
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    } finally {
      conn.release();
    }
  });

  r.patch('/:idPedido/estado', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const idPedido = Number(req.params.idPedido);
    if (!Number.isFinite(idPedido) || idPedido <= 0) {
      return res.status(400).json({ message: 'Identificador de pedido inválido' });
    }
    const nuevo = Number(req.body?.estado);
    if (![ESTADO_NUM.EnProceso, ESTADO_NUM.Entregado].includes(nuevo)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    try {
      const [[p]] = await pool.query(
        `SELECT IdPedido, CAST(Estado AS SIGNED) AS Estado FROM com__pedidos WHERE IdPedido = ? LIMIT 1`,
        [idPedido]
      );
      if (!p) return res.status(404).json({ message: 'Pedido no encontrado' });
      const actual = leerEstadoCabeceraDb(p.Estado);

      if (actual === ESTADO_NUM.Entregado || actual === ESTADO_NUM.Cancelado) {
        return res.status(400).json({
          message:
            actual === ESTADO_NUM.Cancelado
              ? 'El pedido está cancelado; no se puede cambiar su estado.'
              : 'El pedido ya figura como entregado; no se puede cambiar su estado.',
        });
      }
      if (nuevo === ESTADO_NUM.EnProceso) {
        if (actual !== ESTADO_NUM.Pendiente) {
          return res.status(400).json({ message: 'Solo puede pasar a En proceso desde Pendiente' });
        }
      } else if (nuevo === ESTADO_NUM.Entregado) {
        if (actual !== ESTADO_NUM.EnProceso && actual !== ESTADO_NUM.Pendiente) {
          return res.status(400).json({ message: 'Solo puede pasar a Entregado desde Pendiente o En proceso' });
        }
      }

      if (nuevo === ESTADO_NUM.Entregado) {
        const fechaEntrega = String(req.body?.fechaEntrega ?? '').trim();
        const recibidoPor = String(req.body?.recibidoPor ?? '').trim();
        const entUserRaw = req.body?.entregadoPorUsuarioId;

        if (!fechaEntrega) {
          return res.status(400).json({ message: 'La fecha de entrega es obligatoria' });
        }
        if (!recibidoPor || recibidoPor.trim().length < 2) {
          return res.status(400).json({ message: 'El campo recibido por es obligatorio' });
        }

        const uidNum = entUserRaw != null && entUserRaw !== '' ? Number(entUserRaw) : NaN;
        if (!Number.isFinite(uidNum) || uidNum <= 0) {
          return res.status(400).json({ message: 'Seleccione el usuario interno que realizó la entrega' });
        }
        const [[ux]] = await pool.query(`SELECT IdUsuario FROM seg__usuario WHERE IdUsuario = ? LIMIT 1`, [
          uidNum,
        ]);
        if (!ux) return res.status(400).json({ message: 'Usuario de entrega no válido' });

        const fechaSql =
          fechaEntrega.length === 10
            ? `${fechaEntrega} 12:00:00`
            : String(fechaEntrega).replace('T', ' ').slice(0, 19);

        await pool.query(`UPDATE com__pedidos SET Estado = ? WHERE IdPedido = ?`, [nuevo, idPedido]);
        await pool.query(
          `UPDATE com__pedidos_detalle SET Fecha_entrega = ?, Entregado_por = ?, Recibido_por = ? WHERE IdPedido = ?`,
          [fechaSql, uidNum, recibidoPor.trim().slice(0, 200), idPedido]
        );
      } else {
        await pool.query(`UPDATE com__pedidos SET Estado = ? WHERE IdPedido = ?`, [nuevo, idPedido]);
      }

      const [rows] = await pool.query(`${LIST_SQL_DETALLE} WHERE p.IdPedido = ? ORDER BY d.IdDetalle ASC`, [
        idPedido,
      ]);
      res.json(rows.map(mapPedidoListRow));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  r.patch('/:idPedido/cancelar', async (req, res) => {
    if (getSessionUserId(req) == null) return res.status(401).json({ message: 'No autorizado' });
    const idPedido = Number(req.params.idPedido);
    if (!Number.isFinite(idPedido) || idPedido <= 0) {
      return res.status(400).json({ message: 'Identificador de pedido inválido' });
    }
    const obs = String(req.body?.observacion ?? req.body?.motivo ?? '').trim();
    if (!obs) return res.status(400).json({ message: 'El motivo de cancelación es obligatorio' });
    if (obs.length < 10) {
      return res.status(400).json({ message: 'El motivo debe tener al menos 10 caracteres' });
    }
    const obs200 = obs.slice(0, 200);

    try {
      const [[p]] = await pool.query(
        `SELECT IdPedido, CAST(Estado AS SIGNED) AS Estado FROM com__pedidos WHERE IdPedido = ? LIMIT 1`,
        [idPedido]
      );
      if (!p) return res.status(404).json({ message: 'Pedido no encontrado' });
      if (leerEstadoCabeceraDb(p.Estado) === ESTADO_NUM.Cancelado) {
        return res.status(400).json({ message: 'El pedido ya está cancelado' });
      }
      const st = leerEstadoCabeceraDb(p.Estado);
      if (st === ESTADO_NUM.Entregado) {
        return res.status(400).json({ message: 'No se puede cancelar un pedido entregado' });
      }
      if (st !== ESTADO_NUM.Pendiente && st !== ESTADO_NUM.EnProceso) {
        return res.status(400).json({ message: 'Solo puede cancelar pedidos pendientes o en proceso' });
      }

      await pool.query(`UPDATE com__pedidos SET Estado = ? WHERE IdPedido = ?`, [ESTADO_NUM.Cancelado, idPedido]);
      await pool.query(`UPDATE com__pedidos_detalle SET Observacion = ? WHERE IdPedido = ?`, [obs200, idPedido]);

      const [rows] = await pool.query(`${LIST_SQL_DETALLE} WHERE p.IdPedido = ? ORDER BY d.IdDetalle ASC`, [
        idPedido,
      ]);
      res.json(rows.map(mapPedidoListRow));
    } catch (e) {
      if (isDbConnectionError(e)) return sendDbUnavailable(res);
      console.error(e);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  return r;
}

import { campoRequerido, longitudValida, type ResultadoValidacion } from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

export function validarProductoCodigoCreacion(codigo: string): ResultadoValidacion {
  const req = campoRequerido(codigo, 'El campo Código es obligatorio');
  if (!req.valido) return req;
  const t = codigo.trim();
  const len = longitudValida(t, 1, 50, 'El código');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarProductoCodigoUnicoEnListado(
  items: readonly { id: number; codigo: string }[],
  codigo: string,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = codigo.trim().toLowerCase();
  if (!t) return { valido: true, mensaje: '' };
  const existe = items.some(
    (x) =>
      String(x.codigo ?? '')
        .trim()
        .toLowerCase() === t && (idIgnorar == null || Number(x.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Este código de producto ya está registrado' };
  return { valido: true, mensaje: '' };
}

export function validarProductoCategoriaCreacion(idCategoria: string | number | null | undefined): ResultadoValidacion {
  const raw =
    idCategoria === null || idCategoria === undefined ? '' : String(idCategoria).trim();
  if (raw === '' || raw === '0') {
    return { valido: false, mensaje: 'El campo Categoría es obligatorio' };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return { valido: false, mensaje: 'El campo Categoría es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarProductoNombreCreacion(nombre: string): ResultadoValidacion {
  const req = campoRequerido(nombre, 'El campo Nombre es obligatorio');
  if (!req.valido) return req;
  const t = nombre.trim();
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarProductoDescripcionCreacion(descripcion: string): ResultadoValidacion {
  const req = campoRequerido(descripcion, 'El campo Descripción es obligatorio');
  if (!req.valido) return req;
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarProductoCodigoContenido(codigo: string): ResultadoValidacion {
  const t = codigo.trim();
  const len = longitudValida(t, 1, 50, 'El código');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarProductoCategoriaContenido(idCategoria: string | number | null | undefined): ResultadoValidacion {
  return validarProductoCategoriaCreacion(idCategoria);
}

export function validarProductoNombreContenido(nombre: string): ResultadoValidacion {
  const t = nombre.trim();
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarProductoDescripcionContenido(descripcion: string): ResultadoValidacion {
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

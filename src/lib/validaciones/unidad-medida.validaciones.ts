import { campoRequerido, longitudValida, type ResultadoValidacion } from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';
import { soloLetrasYEspacios } from './texto.validaciones';

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

export function validarUnidadMedidaNombreCreacion(nombre: string): ResultadoValidacion {
  const req = campoRequerido(nombre, 'El campo Nombre es obligatorio');
  if (!req.valido) return req;
  const t = nombre.trim();
  if (!soloLetrasYEspacios(nombre)) {
    return { valido: false, mensaje: 'El nombre solo puede contener letras y espacios' };
  }
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUnidadMedidaNombreUnicoEnListado(
  items: readonly { id: number; nombre: string }[],
  nombre: string,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = nombre.trim().toLowerCase();
  if (!t) return { valido: true, mensaje: '' };
  const existe = items.some(
    (x) =>
      String(x.nombre ?? '')
        .trim()
        .toLowerCase() === t && (idIgnorar == null || Number(x.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Esta unidad de medida ya está creada' };
  return { valido: true, mensaje: '' };
}

export function validarUnidadMedidaDescripcionCreacion(descripcion: string): ResultadoValidacion {
  const req = campoRequerido(descripcion, 'El campo Descripción es obligatorio');
  if (!req.valido) return req;
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUnidadMedidaNombreContenido(nombre: string): ResultadoValidacion {
  const t = nombre.trim();
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (!soloLetrasYEspacios(nombre)) {
    return { valido: false, mensaje: 'El nombre solo puede contener letras y espacios' };
  }
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUnidadMedidaDescripcionContenido(descripcion: string): ResultadoValidacion {
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

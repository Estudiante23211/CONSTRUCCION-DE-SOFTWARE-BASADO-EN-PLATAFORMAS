import type { ResultadoValidacion } from './formulario.validaciones';
import { campoRequerido, longitudValida } from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';
import { soloNumeros } from './texto.validaciones';

/** Descripción del pedido (obligatoria; 10–200 caracteres; sin SQL obvio). */
export function validarPedidoDescripcion(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const req = campoRequerido(t, 'El campo Descripción es obligatorio');
  if (!req.valido) return req;
  if (contieneSQLInjection(t)) {
    return { valido: false, mensaje: 'El texto contiene caracteres o patrones no permitidos' };
  }
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) {
    if (t.length < 10) {
      return { valido: false, mensaje: 'La descripción debe tener al menos 10 caracteres' };
    }
    return len;
  }
  return { valido: true, mensaje: '' };
}

/** Motivo de cancelación: obligatorio, 10–200 caracteres, sin SQL obvio. */
export function validarPedidoMotivoCancelacion(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const req = campoRequerido(t, 'El motivo de cancelación es obligatorio');
  if (!req.valido) return req;
  if (contieneSQLInjection(t)) {
    return { valido: false, mensaje: 'El motivo contiene caracteres o patrones no permitidos' };
  }
  const len = longitudValida(t, 10, 200, 'El motivo');
  if (!len.valido) {
    if (t.length < 10) {
      return { valido: false, mensaje: 'El motivo debe tener al menos 10 caracteres' };
    }
    return len;
  }
  return { valido: true, mensaje: '' };
}

/** Descuento en porcentaje: 0–100. */
export function validarPedidoDescuentoPorcentaje(valor: number): ResultadoValidacion {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) {
    return { valido: false, mensaje: 'El descuento no puede ser negativo' };
  }
  if (n > 100) {
    return { valido: false, mensaje: 'El descuento no puede ser mayor al 100%' };
  }
  return { valido: true, mensaje: '' };
}

/** Cantidad obligatoria en creación: entero positivo como cadena de dígitos. */
export function validarPedidoCantidadCreacion(valorCadena: string): ResultadoValidacion {
  const t = String(valorCadena ?? '').trim();
  const req = campoRequerido(t, 'El campo Cantidad es obligatorio');
  if (!req.valido) return req;
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'La cantidad debe contener solo números enteros' };
  }
  const len = longitudValida(t, 1, 12, 'La cantidad');
  if (!len.valido) return len;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1) {
    return { valido: false, mensaje: 'La cantidad debe ser mayor a 0' };
  }
  return { valido: true, mensaje: '' };
}

/** Precio unitario en creación: obligatorio, número ≥ 0 (acepta decimales en número, no en soloNumeros). */
export function validarPedidoPrecioUnitarioCreacion(valor: number): ResultadoValidacion {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return { valido: false, mensaje: 'El campo Precio unitario es obligatorio' };
  }
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    return { valido: false, mensaje: 'El precio unitario no es válido' };
  }
  if (n < 0) {
    return { valido: false, mensaje: 'El precio unitario no puede ser negativo' };
  }
  return { valido: true, mensaje: '' };
}

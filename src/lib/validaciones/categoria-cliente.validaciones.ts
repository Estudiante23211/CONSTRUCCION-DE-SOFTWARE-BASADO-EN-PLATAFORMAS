/**
 * Misma política que catálogo "tipo de cliente" (nombre + descripción).
 * Reexporta con nombres específicos del módulo Categorías.
 */
export {
  validarTipoClienteNombreCreacion as validarCategoriaClienteNombreCreacion,
  validarTipoClienteNombreUnicoEnListado as validarCategoriaClienteNombreUnicoEnListado,
  validarTipoClienteDescripcionCreacion as validarCategoriaClienteDescripcionCreacion,
  validarTipoClienteNombreContenido as validarCategoriaClienteNombreContenido,
  validarTipoClienteDescripcionContenido as validarCategoriaClienteDescripcionContenido,
} from './tipo-cliente.validaciones';

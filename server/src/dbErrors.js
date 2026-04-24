/**
 * Errores típicos cuando MySQL/MariaDB no está en ejecución o no es alcanzable.
 * @param {unknown} err
 */
export function isDbConnectionError(err) {
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  return (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN'
  );
}

/** Respuesta JSON uniforme para el cliente Angular. */
export function sendDbUnavailable(res) {
  if (res.headersSent) return;
  res.status(503).json({
    message:
      'Base de datos no disponible. Inicie MySQL/MariaDB (por ejemplo en XAMPP: botón «Start» en MySQL) y compruebe en server/.env las variables MYSQL_HOST, MYSQL_PORT, MYSQL_USER y MYSQL_DATABASE.',
  });
}

import { createPool } from '../src/db.js';

const DEMO_HASH = '$2b$10$.KINcFXBs6SsaX4qLC69LOAwExYINIfJSCph4CVjPqjR4Bx3elIhW';

const pool = createPool();
try {
  const [r] = await pool.query(
    `UPDATE seg__usuario SET Clave = ? WHERE Usuario IN ('admin', 'ana')`,
    [DEMO_HASH]
  );
  console.log(`Contraseñas demo actualizadas (${r.affectedRows} filas). Usuario: admin / ana — clave: password`);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}

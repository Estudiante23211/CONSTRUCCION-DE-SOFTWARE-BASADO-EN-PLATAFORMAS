import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { createPool } from './db.js';
import { authRouter } from './routes/auth.js';
import { rolesRouter } from './routes/roles.js';
import { usuariosRouter } from './routes/usuarios.js';
import { buildClienteCatalogRouter } from './routes/clientesCatalogo.js';
import { clientesRouter } from './routes/clientes.js';
import { productosRouter } from './routes/productos.js';
import { pedidosRouter } from './routes/pedidos.js';
import { inventarioRouter } from './routes/inventario.js';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let pool;
try {
  pool = createPool();
} catch (e) {
  console.error('[kalsan-api] No se pudo crear el pool MySQL:', e);
  process.exit(1);
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    res.status(503).json({ ok: false, db: 'disconnected', error: String(e.message) });
  }
});

app.use('/api/auth', authRouter(pool));
app.use('/api/seguridad/roles', rolesRouter(pool));
app.use('/api/seguridad/usuarios', usuariosRouter(pool));

app.use('/api/clientes/tipos-cliente', buildClienteCatalogRouter(pool, 'seg__tipo_cliente', 'IdTipoCliente'));
app.use(
  '/api/clientes/categorias',
  buildClienteCatalogRouter(pool, 'seg__categoria_cliente', 'IdCategoriaCliente')
);
app.use(
  '/api/clientes/tipos-identificacion',
  buildClienteCatalogRouter(pool, 'seg__tipo_identificacion', 'IdTipoIdentificacion')
);
app.use('/api/clientes/clientes', clientesRouter(pool));

app.use(
  '/api/productos/unidades-medida',
  buildClienteCatalogRouter(pool, 'bas__unidad_medida', 'IdUnidadMedida')
);
app.use('/api/productos/tipos-moneda', buildClienteCatalogRouter(pool, 'bas__tipo_moneda', 'IdTipoMoneda'));
app.use(
  '/api/productos/categorias-producto',
  buildClienteCatalogRouter(pool, 'com__categoria_producto', 'IdCategoria')
);
app.use('/api/productos/productos', productosRouter(pool));
app.use('/api/pedidos', pedidosRouter(pool));
app.use('/api/inventario', inventarioRouter(pool));

async function start() {
  if (!process.env.JWT_SECRET?.trim()) {
    console.warn(
      '[kalsan-api] JWT_SECRET vacío: se usa un secreto de desarrollo. Defínelo en server/.env para producción.'
    );
  }

  try {
    await pool.query('SELECT 1');
    console.log(
      `[kalsan-api] MySQL OK (${process.env.MYSQL_HOST || '127.0.0.1'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'kalsan_moda'})`
    );
  } catch (e) {
    console.error('[kalsan-api] No se pudo conectar a MySQL. El servidor NO arrancará.');
    console.error('  - ¿MariaDB/MySQL está en ejecución?');
    console.error('  - ¿Existe la base kalsan_moda? (database/kalsan_moda_schema.sql)');
    console.error('  - Revisa server/.env (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE)');
    console.error('  Detalle:', e.message);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`[kalsan-api] API escuchando en http://localhost:${port}`);
    console.log(`[kalsan-api] Health: http://localhost:${port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[kalsan-api] Puerto ${port} en uso.`);
      console.error(`  Ejecuta: netstat -ano | findstr :${port}`);
      console.error('  Luego: taskkill /PID <número> /F');
      process.exit(1);
    }
    console.error('[kalsan-api] Error al iniciar el servidor:', err);
    process.exit(1);
  });

  const shutdown = (label) => {
    server.close(() => {
      console.log(`[kalsan-api] ${label}`);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('Servidor cerrado limpiamente'));
  process.on('SIGINT', () => shutdown('Servidor detenido por usuario'));
}

start().catch((e) => {
  console.error('[kalsan-api] Error fatal al iniciar:', e);
  process.exit(1);
});

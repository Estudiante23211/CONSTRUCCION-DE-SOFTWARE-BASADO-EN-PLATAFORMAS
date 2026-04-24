import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPool } from './db.js';
import { authRouter } from './routes/auth.js';
import { rolesRouter } from './routes/roles.js';
import { usuariosRouter } from './routes/usuarios.js';
import { buildClienteCatalogRouter } from './routes/clientesCatalogo.js';
import { clientesRouter } from './routes/clientes.js';
import { productosRouter } from './routes/productos.js';
import { inventarioRouter } from './routes/inventario.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let pool;
try {
  pool = createPool();
} catch (e) {
  console.error('No se pudo crear el pool MySQL:', e);
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
app.use('/api/inventario', inventarioRouter(pool));

app.listen(port, () => {
  console.log(`API Kalsan escuchando en http://localhost:${port}`);
});

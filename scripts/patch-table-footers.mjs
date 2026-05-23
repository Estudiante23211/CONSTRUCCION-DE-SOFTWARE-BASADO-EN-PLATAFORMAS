import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src', 'app', 'pages');

const targets = [
  ['seguridad/usuarios/usuarios.html', 'usuariosFiltrados.length'],
  ['cliente/tipo-client/tipo-client.html', 'tiposFiltrados.length'],
  ['cliente/categoria-cliente/categoria-cliente.html', 'categoriasFiltradas.length'],
  ['cliente/tipo-identificacion/tipo-identificacion.html', 'tiposFiltrados.length'],
  ['cliente/clientes/clientes.html', 'clientesFiltrados.length'],
  ['producto/unidad-medida/unidad-medida.html', 'unidadesFiltradas.length'],
  ['producto/tipo-moneda/tipo-moneda.html', 'tiposMonedaFiltrados.length'],
  ['producto/categorias/categorias.html', 'categoriasFiltradas.length'],
  ['producto/productos/productos.html', 'productosFiltrados.length'],
  ['inventario/inventario/inventario.html', 'inventariosFiltrados.length'],
  ['pedidos/crear-pedido/crear-pedido.html', 'pedidosFiltrados.length'],
];

function footer(countExpr) {
  return `@if (mostrarBarraPaginacion) {
          <div class="table-footer">
            <div class="footer-left">
              <span>Por página</span>
              <select
                class="form-select form-select-sm page-size-select"
                [(ngModel)]="itemsPorPagina"
                (ngModelChange)="onTamanoPaginaChange()"
              >
                @for (n of tamanoPaginaOpciones; track n) {
                  <option [ngValue]="n">{{ n }}</option>
                }
              </select>
            </div>
            <div class="footer-center">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                [disabled]="paginaActual <= 1"
                (click)="irPagina(paginaActual - 1)"
                aria-label="Anterior"
              >
                ‹
              </button>
              <span>{{ paginaActual }} / {{ totalPaginas }}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                [disabled]="paginaActual >= totalPaginas"
                (click)="irPagina(paginaActual + 1)"
                aria-label="Siguiente"
              >
                ›
              </button>
            </div>
            <div class="footer-right">{{ ${countExpr} }} registro(s)</div>
          </div>
        }`;
}

const re =
  /@if \(mostrarBarraPaginacion\) \{[\s\S]*?<div class="card-footer[\s\S]*?\}\s*\n\s*\}/;

for (const [rel, count] of targets) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, 'utf8');
  if (!re.test(text)) {
    console.warn('No match:', rel);
    continue;
  }
  text = text.replace(re, footer(count));
  fs.writeFileSync(file, text);
  console.log('OK', rel);
}

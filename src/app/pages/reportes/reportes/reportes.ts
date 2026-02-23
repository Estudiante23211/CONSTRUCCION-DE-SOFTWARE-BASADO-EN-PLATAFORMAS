import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Pedido {
  id: number;
  cliente: string;
  total: number;
  estado: string;
  fecha: string;
}

interface Inventario {
  producto: string;
  cantidadActual: number;
  alertaMinima: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements AfterViewInit {

  tituloModulo = 'Reportes';

  fechaInicio = '';
  fechaFin = '';

  pedidos: Pedido[] = [
    { id: 1, cliente: 'Juan Pérez', total: 50000, estado: 'Entregado', fecha: '2026-02-10' },
    { id: 2, cliente: 'Empresa ABC', total: 120000, estado: 'Entregado', fecha: '2026-02-15' },
    { id: 3, cliente: 'Cliente XYZ', total: 80000, estado: 'Pendiente', fecha: '2026-02-18' }
  ];

  inventario: Inventario[] = [
    { producto: 'Camisa', cantidadActual: 5, alertaMinima: 10 },
    { producto: 'Zapatos', cantidadActual: 25, alertaMinima: 5 }
  ];

  ngAfterViewInit() {
    this.generarGraficaVentas();
    this.generarGraficaStock();
  }

  get pedidosFiltrados() {
    return this.pedidos.filter(p =>
      (!this.fechaInicio || p.fecha >= this.fechaInicio) &&
      (!this.fechaFin || p.fecha <= this.fechaFin)
    );
  }

  get totalVentas() {
    return this.pedidosFiltrados
      .filter(p => p.estado === 'Entregado')
      .reduce((acc, p) => acc + p.total, 0);
  }

  get productosStockBajo() {
    return this.inventario.filter(i => i.cantidadActual <= i.alertaMinima);
  }

  // 📊 GRAFICA DE VENTAS
  generarGraficaVentas() {
    const entregados = this.pedidos.filter(p => p.estado === 'Entregado');

    new Chart('ventasChart', {
      type: 'bar',
      data: {
        labels: entregados.map(p => p.cliente),
        datasets: [{
          label: 'Ventas por Cliente',
          data: entregados.map(p => p.total),
          backgroundColor: '#198754'
        }]
      }
    });
  }

  // 📊 GRAFICA DE STOCK
  generarGraficaStock() {
    new Chart('stockChart', {
      type: 'doughnut',
      data: {
        labels: this.inventario.map(i => i.producto),
        datasets: [{
          data: this.inventario.map(i => i.cantidadActual),
          backgroundColor: ['#0d6efd', '#dc3545', '#ffc107']
        }]
      }
    });
  }

  // 📥 EXPORTAR A EXCEL
  exportarExcel() {

    const datos = this.pedidosFiltrados.map(p => ({
      ID: p.id,
      Cliente: p.cliente,
      Total: p.total,
      Estado: p.estado,
      Fecha: p.fecha
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = { Sheets: { 'Reporte': worksheet }, SheetNames: ['Reporte'] };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream'
    });

    FileSaver.saveAs(data, 'reporte_ventas.xlsx');
  }

}
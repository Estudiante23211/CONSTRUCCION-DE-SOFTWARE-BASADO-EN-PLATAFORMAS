import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})

export class Dashboard implements OnInit {
  // 🔹 Variables KPI
  pedidosTotales = 0;
  clientesRegistrados = 0;
  insumosCriticos = 0;
  reportesGenerados = 0;

  ngOnInit() {
    this.animateCounter('pedidosTotales', 0, 0);
    this.animateCounter('clientesRegistrados', 0, 0);
    this.animateCounter('insumosCriticos', 0, 0);
    this.animateCounter('reportesGenerados', 0, 0);
  }

  animateCounter(property: string, target: number, duration: number) {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / target));
    const timer = setInterval(() => {
      start++;
      (this as any)[property] = start;
      if (start >= target) clearInterval(timer);
    }, stepTime);
  }

  // 📊 Gráfico Estado de Pedidos (Doughnut)
  public pedidoChartType: ChartType = 'doughnut';

  public pedidoChartData: ChartConfiguration['data'] = {
    labels: ['Pendiente', 'En Proceso', 'Entregado'],
    datasets: [
      {
        data: [50, 456, 78],
        backgroundColor: ['#f39c12', '#3498db', '#2ecc71']
      }
    ]
  };

  public pedidoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.2,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          font: {
            size: 12
          }
        }
      }
    }
  };

  // 📊 Gráfico Niveles de Inventario (Line)
  public inventarioChartType: ChartType = 'line';

  public inventarioChartData: ChartConfiguration['data'] = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Tela (mts)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#e74c3c',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Cierres (unid)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3498db',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Botones (unid)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#2ecc71',
        fill: false,
        tension: 0.3
      }
    ]
  };
  
  public inventarioChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  public today: Date = new Date();

}


import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ProduitService } from '../../../core/services/produit.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-statistiques-produits',
  templateUrl: './statistiques-produits.component.html',
  styleUrls: ['./statistiques-produits.component.css'],
  standalone: false
})
export class StatistiquesProduitsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ventesChart') ventesChartRef!: ElementRef;
  @ViewChild('stockChart') stockChartRef!: ElementRef;
  @ViewChild('categoriesChart') categoriesChartRef!: ElementRef;

  produits: any[] = [];
  statistiques: any = {};
  repartitionCategories: any[] = [];
  loading = true;
  errorMessage = '';
  triSelectionne: string = 'ventes'; // ventes, vues, stock

  private ventesChart: Chart | null = null;
  private stockChart: Chart | null = null;
  private categoriesChart: Chart | null = null;

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData(): void {
    this.loading = true;
    this.produitService.getStatistiquesProduits({ tri: this.triSelectionne, limite: 20 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.produits = response.produits;
          this.statistiques = response.statistiques;
          this.repartitionCategories = response.repartitionCategories;
          setTimeout(() => this.createCharts(), 100);
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des statistiques';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onTriChange(): void {
    this.loadData();
  }

  private destroyCharts(): void {
    if (this.ventesChart) this.ventesChart.destroy();
    if (this.stockChart) this.stockChart.destroy();
    if (this.categoriesChart) this.categoriesChart.destroy();
  }

  private createCharts(): void {
    this.destroyCharts();

    // Graphique des ventes par produit (top 5)
    const topVentes = this.produits.slice(0, 5);
    this.ventesChart = new Chart(this.ventesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: topVentes.map(p => p.nom),
        datasets: [{
          label: 'Nombre de ventes',
          data: topVentes.map(p => p.statistiques.nombre_ventes || 0),
          backgroundColor: '#667eea',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Graphique des stocks (doughnut)
    const stockNormal = this.statistiques.stockTotal - 
                       (this.statistiques.produitsFaibleStock || 0) - 
                       (this.statistiques.produitsRuptureStock || 0);
    this.stockChart = new Chart(this.stockChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Stock normal', 'Stock faible', 'Rupture'],
        datasets: [{
          data: [
            Math.max(stockNormal, 0),
            this.statistiques.produitsFaibleStock || 0,
            this.statistiques.produitsRuptureStock || 0
          ],
          backgroundColor: ['#4caf50', '#ff9800', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '60%'
      }
    });

    // Graphique des ventes par catégorie (pie)
    if (this.repartitionCategories.length > 0) {
      this.categoriesChart = new Chart(this.categoriesChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: this.repartitionCategories.map(c => c.categorie),
          datasets: [{
            data: this.repartitionCategories.map(c => c.totalVentes || 0),
            backgroundColor: ['#667eea', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }
}
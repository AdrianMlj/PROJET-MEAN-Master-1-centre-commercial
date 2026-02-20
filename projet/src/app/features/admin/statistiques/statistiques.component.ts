import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { StatistiquesService } from '../../../core/services/statistiques.service';
import { StatistiquesGlobales } from '../../../core/models/statistiques.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-statistiques',
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css'],
  standalone: false
})
export class StatistiquesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('caChart') caChartRef!: ElementRef;
  @ViewChild('commandesChart') commandesChartRef!: ElementRef;
  @ViewChild('paiementsChart') paiementsChartRef!: ElementRef;
  @ViewChild('boutiquesChart') boutiquesChartRef!: ElementRef;

  statistiques: StatistiquesGlobales['statistiques'] | null = null;
  loading = true;
  errorMessage = '';

  // Chart instances
  private caChart: Chart | null = null;
  private commandesChart: Chart | null = null;
  private paiementsChart: Chart | null = null;
  private boutiquesChart: Chart | null = null;

  constructor(
    private statistiquesService: StatistiquesService
  ) {}

  ngOnInit(): void {
    this.loadStatistiques();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  ngOnDestroy(): void {
    // Détruire les graphiques pour éviter les fuites mémoire
    this.destroyCharts();
  }

  loadStatistiques(): void {
    this.loading = true;
    this.statistiquesService.getStatistiquesGlobales().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistiques = response.statistiques;
          setTimeout(() => this.createCharts(), 100); // Petit délai pour que les vues soient prêtes
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement statistiques:', error);
        this.errorMessage = 'Impossible de charger les statistiques';
        this.loading = false;
      }
    });
  }

  createCharts(): void {
    this.destroyCharts();
    this.createCAChart();
    this.createCommandesChart();
    this.createPaiementsChart();
    this.createBoutiquesChart();
  }

  destroyCharts(): void {
    if (this.caChart) this.caChart.destroy();
    if (this.commandesChart) this.commandesChart.destroy();
    if (this.paiementsChart) this.paiementsChart.destroy();
    if (this.boutiquesChart) this.boutiquesChart.destroy();
  }

  createCAChart(): void {
    if (!this.statistiques || !this.caChartRef) return;

    const evolutionCA = this.statistiques.evolutionCA || [];
    const labels = evolutionCA.map(item => `${item.mois}/${item.annee}`);
    const data = evolutionCA.map(item => item.total);

    this.caChart = new Chart(this.caChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Chiffre d\'affaires (€)',
          data: data.length ? data : [0, 0, 0, 0, 0, 0],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `CA: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.raw as number)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value as number);
              }
            }
          }
        }
      }
    });
  }

  createCommandesChart(): void {
    if (!this.statistiques || !this.commandesChartRef) return;

    const totalCommandes = this.statistiques.totalCommandes || 0;
    const commandesCeMois = this.statistiques.commandesCeMois || 0;
    const commandesCetteSemaine = this.statistiques.commandesCetteSemaine || 0;

    this.commandesChart = new Chart(this.commandesChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Cette semaine', 'Ce mois', 'Total'],
        datasets: [{
          data: [commandesCetteSemaine, commandesCeMois, totalCommandes],
          backgroundColor: [
            '#ff9800',
            '#4caf50',
            '#667eea'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.raw} commandes`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  createPaiementsChart(): void {
    if (!this.statistiques || !this.paiementsChartRef) return;

    const paiements = this.statistiques.statistiquesPaiements || [];
    
    if (paiements.length === 0) {
      // Données par défaut si aucune
      this.paiementsChart = new Chart(this.paiementsChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Payé', 'Impayé'],
          datasets: [{
            data: [0, this.statistiques.totalBoutiques || 0],
            backgroundColor: ['#4caf50', '#f44336']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    } else {
      this.paiementsChart = new Chart(this.paiementsChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: paiements.map(p => p._id === 'paye' ? 'Payé' : 'Impayé'),
          datasets: [{
            data: paiements.map(p => p.count),
            backgroundColor: ['#4caf50', '#f44336', '#ff9800', '#9c27b0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  createBoutiquesChart(): void {
    if (!this.statistiques || !this.boutiquesChartRef) return;

    const actives = this.statistiques.boutiquesActives || 0;
    const inactives = (this.statistiques.totalBoutiques || 0) - actives;

    this.boutiquesChart = new Chart(this.boutiquesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Boutiques'],
        datasets: [
          {
            label: 'Actives',
            data: [actives],
            backgroundColor: '#4caf50',
            borderRadius: 6
          },
          {
            label: 'Inactives',
            data: [inactives],
            backgroundColor: '#f44336',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // Méthodes utilitaires
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
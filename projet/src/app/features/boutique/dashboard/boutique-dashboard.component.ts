import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../core/services/boutique.service';

@Component({
  selector: 'app-boutique-dashboard',
  templateUrl: './boutique-dashboard.component.html',
  styleUrls: ['./boutique-dashboard.component.css'],
  standalone: false
})
export class BoutiqueDashboardComponent implements OnInit {
  boutiqueNom: string = '';
  loading = true;
  errorMessage = '';

  // Statistiques
  totalCommandes = 0;
  commandesEnAttente = 0;
  commandesEnPreparation = 0;
  commandesLivrees = 0;
  commandesCeMois = 0;
  commandesCetteSemaine = 0;
  produitsActifs = 0;
  chiffreAffairesTotal = 0;
  chiffreAffairesMois = 0;
  chiffreAffairesSemaine = 0;
  produitsPlusVendus: any[] = [];
  evolutionVentes: any[] = [];
  clientsFideles: any[] = [];
  statistiquesProduits: any = {};

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatistiques();
  }

  loadStatistiques(): void {
    this.loading = true;
    this.boutiqueService.getStatistiques().subscribe({
      next: (response) => {
        if (response.success) {
          this.boutiqueNom = response.boutique.nom;
          const stats = response.statistiques;
          this.totalCommandes = stats.totalCommandes;
          this.commandesEnAttente = stats.commandesEnAttente;
          this.commandesEnPreparation = stats.commandesEnPreparation;
          this.commandesLivrees = stats.commandesLivrees;
          this.commandesCeMois = stats.commandesCeMois;
          this.commandesCetteSemaine = stats.commandesCetteSemaine;
          this.produitsActifs = stats.produitsActifs;
          this.chiffreAffairesTotal = stats.chiffreAffairesTotal;
          this.chiffreAffairesMois = stats.chiffreAffairesMois;
          this.chiffreAffairesSemaine = stats.chiffreAffairesSemaine;
          this.produitsPlusVendus = stats.produitsPlusVendus || [];
          this.evolutionVentes = stats.evolutionVentes || [];
          this.clientsFideles = stats.clientsFideles || [];
          this.statistiquesProduits = stats.statistiquesProduits || {};
        } else {
          this.errorMessage = 'Erreur lors du chargement des statistiques';
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Impossible de charger les statistiques';
        this.loading = false;
        console.error(error);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  navigateTo(path: string): void {
    this.router.navigate([`/boutique/${path}`]);
  }
}
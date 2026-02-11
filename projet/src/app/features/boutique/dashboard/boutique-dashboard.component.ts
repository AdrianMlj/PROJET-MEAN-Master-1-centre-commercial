import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-boutique-dashboard',
  templateUrl: './boutique-dashboard.component.html',
  styleUrls: ['./boutique-dashboard.component.css'],
  standalone: false
})
export class BoutiqueDashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats = {
    produits: 0,
    commandes: 0,
    revenus: 0,
    avis: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    // Simulation de données
    this.stats = {
      produits: 45,
      commandes: 128,
      revenus: 12500,
      avis: 23
    };
  }
}
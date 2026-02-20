import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-creer-utilisateur-boutique',
  templateUrl: './creer-utilisateur-boutique.component.html',
  styleUrls: ['./creer-utilisateur-boutique.component.css'],
  standalone: false
})
export class CreerUtilisateurBoutiqueComponent implements OnInit {
  userForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: [''],
      telephone: [''],
      role: ['boutique'], // Fixé à boutique
      est_actif: [true]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.creerUtilisateurBoutique(this.userForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '✅ Compte boutique créé avec succès !';
          setTimeout(() => {
            this.router.navigate(['/admin/utilisateurs/liste']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 500 && error.error?.error?.includes('E11000 duplicate key')) {
          this.errorMessage = '❌ Cet email est déjà utilisé. Veuillez en choisir un autre.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Données invalides. Vérifiez votre formulaire.';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
        this.loading = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/admin/utilisateurs/liste']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
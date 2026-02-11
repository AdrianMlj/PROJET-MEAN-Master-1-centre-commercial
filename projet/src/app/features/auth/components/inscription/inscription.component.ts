import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.css'],
  standalone: false
})
export class InscriptionComponent implements OnInit {
  inscriptionForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.inscriptionForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: [''],
      telephone: [''],
      adresse: this.formBuilder.group({
        rue: [''],
        ville: [''],
        code_postal: [''],
        pays: ['France']
      })
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.navigateToDashboard();
    }
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('mot_de_passe')?.value;
    const confirmPassword = form.get('confirm_password')?.value;
    
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.markFormGroupTouched(this.inscriptionForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
      ...this.inscriptionForm.value,
      role: 'acheteur' as const
    };
    
    delete formData.confirm_password;

    this.authService.register(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Inscription réussie ! Redirection...';
          setTimeout(() => {
            this.navigateToDashboard();
          }, 2000);
        } else {
          this.errorMessage = response.message;
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  private navigateToDashboard(): void {
    this.router.navigate(['/acheteur/dashboard']);
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
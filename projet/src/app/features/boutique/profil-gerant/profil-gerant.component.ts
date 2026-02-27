import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profil-gerant',
  templateUrl: './profil-gerant.component.html',
  styleUrls: ['./profil-gerant.component.css'],
  standalone: false
})
export class ProfilGerantComponent implements OnInit {
  profilForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: User | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  avatarFile: File | null = null;
  avatarPreview: string | null = null;
  avatarUploading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profilForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: [''],
      telephone: [''],
      adresse: this.fb.group({
        rue: [''],
        ville: [''],
        code_postal: [''],
        pays: ['France']
      }),
      preferences: this.fb.group({
        newsletter: [false],
        notifications: [true],
        langue: ['fr']
      })
    });

    this.passwordForm = this.fb.group({
      ancien_mot_de_passe: ['', Validators.required],
      nouveau_mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      confirm_mot_de_passe: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profilForm.patchValue({
          nom: user.nom,
          prenom: user.prenom || '',
          telephone: user.telephone || '',
          adresse: user.adresse || { rue: '', ville: '', code_postal: '', pays: 'France' },
          preferences: user.preferences || { newsletter: false, notifications: true, langue: 'fr' }
        });
      }
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const nouveau = form.get('nouveau_mot_de_passe')?.value;
    const confirm = form.get('confirm_mot_de_passe')?.value;
    return nouveau === confirm ? null : { mismatch: true };
  }

  // ✅ MODIFIÉ: Méthode simplifiée pour l'avatar Cloudinary
  getAvatarUrl(): string {
    // Si pas d'utilisateur ou pas d'avatar, retourner l'image par défaut
    if (!this.currentUser || !this.currentUser.avatar_url) {
      return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';
    }
    return this.currentUser.avatar_url;
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.avatarPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (!this.avatarFile) return;
    this.avatarUploading = true;
    this.authService.uploadAvatar(this.avatarFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Avatar mis à jour';
          // Recharger le profil pour avoir la nouvelle URL
          this.authService.refreshUserProfile();
          this.avatarFile = null;
          this.avatarPreview = null;
        } else {
          this.errorMessage = response.message || 'Erreur';
        }
        this.avatarUploading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de l\'upload';
        this.avatarUploading = false;
      }
    });
  }

  onProfilSubmit(): void {
    if (this.profilForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.modifierProfil(this.profilForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Profil mis à jour';
          this.authService.refreshUserProfile();
        } else {
          this.errorMessage = response.message || 'Erreur';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { ancien_mot_de_passe, nouveau_mot_de_passe } = this.passwordForm.value;
    this.authService.changerMotDePasse({ ancien_mot_de_passe, nouveau_mot_de_passe }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Mot de passe changé';
          this.passwordForm.reset();
        } else {
          this.errorMessage = response.message || 'Erreur';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur';
        this.loading = false;
      }
    });
  }

  retour(): void {
    this.router.navigate(['/boutique/dashboard']);
  }
}
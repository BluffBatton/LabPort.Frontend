import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { UserDto, UserPasswordUpdateDto, UserUpdateDto } from '../../../core/api/api.models';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { UserApiService } from '../../../core/api/user-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-profile-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly profile = signal<UserDto | null>(null);
  readonly loading = signal(false);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly deleting = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly profileForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true
    })
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    this.userApi
      .getMyProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.reset({
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email ?? '',
            phoneNumber: profile.phoneNumber ?? ''
          });
        },
        error: (error: unknown) => {
          this.profile.set(null);
          this.addError('GET /api/User/GetMyProfile', error);
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.message.set(null);

    this.userApi
      .updateMyProfile(this.profilePayload())
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('profile.saved'));
          this.refresh();
        },
        error: (error: unknown) => this.addError('PATCH /api/User/UpdateMyProfile', error)
      });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.message.set(null);

    this.userApi
      .updateMyPassword(this.passwordPayload())
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('profile.passwordSaved'));
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: ''
          });
        },
        error: (error: unknown) => this.addError('PATCH /api/User/UpdateMyPassword', error)
      });
  }

  deleteProfile(): void {
    if (!globalThis.confirm(this.i18n.t('profile.deleteConfirm'))) {
      return;
    }

    this.deleting.set(true);
    this.message.set(null);

    this.userApi
      .deleteMyProfile()
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.auth.logout();
          void this.router.navigate(['/auth/login']);
        },
        error: (error: unknown) => this.addError('DELETE /api/User/DeleteMyProfile', error)
      });
  }

  fullName(): string {
    const profile = this.profile();
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
    const session = this.auth.session();
    return name || profile?.email || session?.displayName || '-';
  }

  email(): string {
    const profile = this.profile();
    const sessionEmail = this.auth.session()?.claims['email'];
    return profile?.email || (typeof sessionEmail === 'string' ? sessionEmail : '-');
  }

  phone(): string {
    return this.profile()?.phoneNumber || '-';
  }

  hasEditableProfile(): boolean {
    return this.profile() !== null;
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private profilePayload(): UserUpdateDto {
    const value = this.profileForm.getRawValue();

    return {
      firstName: value.firstName.trim() || null,
      lastName: value.lastName.trim() || null,
      email: value.email.trim() || null,
      phoneNumber: value.phoneNumber.trim() || null
    };
  }

  private passwordPayload(): UserPasswordUpdateDto {
    const value = this.passwordForm.getRawValue();

    return {
      currentPassword: value.currentPassword,
      newPassword: value.newPassword
    };
  }

  private addError(label: string, error: unknown): void {
    this.errors.update((errors) => [...errors, `${label}: ${this.errorMessage(error)}`]);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Request failed';
  }
}

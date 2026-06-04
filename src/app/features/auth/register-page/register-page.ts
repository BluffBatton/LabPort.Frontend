import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { RegisterDto } from '../../../core/api/api.models';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LocalizationService } from '../../../core/localization/localization.service';
import { SupportedLocale } from '../../../core/localization/translations';

@Component({
  selector: 'app-register-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss'
})
export class RegisterPage {
  readonly i18n = inject(LocalizationService);
  readonly message = signal<string | null>(null);
  readonly registeredUserId = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = new FormGroup({
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
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    containerLabel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    temperatureMin: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    temperatureMax: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    humidityMin: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    humidityMax: new FormControl<number | null>(null, {
      validators: [Validators.required]
    })
  });

  private readonly api = inject(LabportApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerAvailable = this.api.isAvailable('auth', 'register');
  readonly registerEndpointLabel = this.api.endpointLabel('auth', 'register');

  isSubmitDisabled(): boolean {
    return this.loading() || this.form.invalid || !this.registerAvailable;
  }

  setLocale(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
  }

  onSubmit(): void {
    if (!this.registerAvailable) {
      this.message.set(this.i18n.t('auth.register.disabled'));
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set(null);
    this.registeredUserId.set(null);

    this.auth.register(this.payload()).subscribe({
      next: (userId) => {
        this.loading.set(false);
        this.registeredUserId.set(userId);
        this.message.set(this.i18n.t('auth.register.created'));
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.message.set(error instanceof Error ? error.message : this.i18n.t('auth.register.failed'));
      }
    });
  }

  openLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  private payload(): RegisterDto {
    const value = this.form.getRawValue();

    return {
      user: {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim() || null,
        role: 'user',
        passwordHash: value.password
      },
      container: {
        label: value.containerLabel.trim(),
        temperatureMin: value.temperatureMin,
        temperatureMax: value.temperatureMax,
        humidityMin: value.humidityMin,
        humidityMax: value.humidityMax
      }
    };
  }
}

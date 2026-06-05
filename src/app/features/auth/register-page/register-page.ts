import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
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

const finiteNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as unknown;
  return typeof value === 'number' && Number.isFinite(value) ? null : { finiteNumber: true };
};

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
  readonly errorDetails = signal<string | null>(null);
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
      validators: [Validators.required, finiteNumberValidator]
    }),
    temperatureMax: new FormControl<number | null>(null, {
      validators: [Validators.required, finiteNumberValidator]
    }),
    humidityMin: new FormControl<number | null>(null, {
      validators: [Validators.required, finiteNumberValidator]
    }),
    humidityMax: new FormControl<number | null>(null, {
      validators: [Validators.required, finiteNumberValidator]
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
      this.message.set(this.i18n.t('auth.register.validationFailed'));
      return;
    }

    const payload = this.payload();

    this.loading.set(true);
    this.message.set(null);
    this.errorDetails.set(null);
    this.registeredUserId.set(null);

    this.auth.register(payload).subscribe({
      next: (userId) => {
        this.loading.set(false);
        this.registeredUserId.set(userId);
        this.message.set(this.i18n.t('auth.register.created'));
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.handleRegisterError(error, payload);
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
        temperatureMin: this.numberValue(value.temperatureMin),
        temperatureMax: this.numberValue(value.temperatureMax),
        humidityMin: this.numberValue(value.humidityMin),
        humidityMax: this.numberValue(value.humidityMax)
      }
    };
  }

  private numberValue(value: number | null): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('Registration numeric field is missing or invalid.');
    }

    return value;
  }

  private handleRegisterError(error: unknown, sentPayload: RegisterDto): void {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.backendMessage(error.error);
      const debugDetails = {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        errorBody: error.error,
        sentPayload
      };

      console.error('Registration failed', debugDetails);

      this.message.set(`Registration failed: ${error.status} ${backendMessage}`);
      this.errorDetails.set(this.prettyJson(debugDetails));
      return;
    }

    const debugDetails = {
      error,
      sentPayload
    };

    console.error('Registration failed', debugDetails);

    this.message.set(error instanceof Error ? `Registration failed: ${error.message}` : this.i18n.t('auth.register.failed'));
    this.errorDetails.set(this.prettyJson(debugDetails));
  }

  private backendMessage(errorBody: unknown): string {
    if (!errorBody) {
      return this.i18n.t('auth.register.noBackendMessage');
    }

    if (typeof errorBody === 'string') {
      return errorBody;
    }

    if (typeof errorBody === 'object') {
      const body = errorBody as Record<string, unknown>;
      const message = body['message'] ?? body['title'] ?? body['detail'] ?? body['error'];

      if (typeof message === 'string') {
        return message;
      }

      if (body['errors']) {
        return this.prettyJson(body['errors']);
      }
    }

    return this.prettyJson(errorBody);
  }

  private prettyJson(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}

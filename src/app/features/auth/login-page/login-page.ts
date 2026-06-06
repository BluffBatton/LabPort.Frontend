import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LabportApiService } from '../../../core/api/labport-api.service';
import { ADMIN_ROLES } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { LocalizationService } from '../../../core/localization/localization.service';
import { SupportedLocale } from '../../../core/localization/translations';

@Component({
  selector: 'app-login-page',
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
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  readonly i18n = inject(LocalizationService);
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });
  readonly message = signal<string | null>(null);
  readonly loading = signal(false);

  private readonly api = inject(LabportApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  readonly loginAvailable = this.api.isAvailable('auth', 'login');

  isSubmitDisabled(): boolean {
    return this.loading() || this.form.invalid || !this.loginAvailable;
  }

  setLocale(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
  }

  onSubmit(): void {
    if (!this.loginAvailable) {
      this.message.set(this.i18n.t('auth.login.disabled'));
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        const defaultRoute = this.auth.hasAnyRole(ADMIN_ROLES) ? '/admin' : '/lab/samples';
        void this.router.navigateByUrl(this.returnUrl ?? defaultRoute);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.message.set(this.loginErrorMessage(error));
      }
    });
  }

  private loginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return `${this.i18n.t('auth.login.failed')}: ${error.status} ${this.backendMessage(error.error)}`;
    }

    return error instanceof Error ? error.message : this.i18n.t('auth.login.backendMissing');
  }

  private backendMessage(errorBody: unknown): string {
    if (!errorBody) {
      return this.i18n.t('auth.login.noBackendMessage');
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
    }

    return this.i18n.t('auth.login.noBackendMessage');
  }
}

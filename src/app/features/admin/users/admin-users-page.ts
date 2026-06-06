import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { UserDto } from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-users-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-users-page.html',
  styleUrl: './admin-users-page.scss'
})
export class AdminUsersPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['name', 'email', 'phoneNumber', 'role', 'createdAt', 'lastLoginAt', 'actions'];
  readonly users = signal<UserDto[]>([]);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly reportForm = new FormGroup({
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true })
  });

  private readonly adminApi = inject(AdminApiService);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    this.adminApi
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.users.set([...users].sort((first, second) => this.i18n.compareText(this.fullName(first), this.fullName(second)))),
        error: (error: unknown) => {
          this.users.set([]);
          this.addError(this.i18n.t('admin.users.listTitle'), error);
        }
      });
  }

  exportUsers(): void {
    const range = this.reportForm.getRawValue();

    this.exporting.set(true);
    this.message.set(null);

    this.adminApi
      .exportUsersReport(this.toIsoDate(range.from), this.toIsoDate(range.to))
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob);
          this.message.set(this.i18n.t('admin.users.exported'));
        },
        error: (error: unknown) => this.addError(this.i18n.t('admin.users.export'), error)
      });
  }

  resetReportRange(): void {
    this.reportForm.reset({
      from: '',
      to: ''
    });
  }

  fullName(user: UserDto): string {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email || '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private downloadBlob(blob: Blob): void {
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = 'labport-users-report';
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    globalThis.URL.revokeObjectURL(url);
  }

  private toIsoDate(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
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

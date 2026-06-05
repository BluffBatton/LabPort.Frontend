import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../core/api/admin-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-data-management-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-data-management-page.html',
  styleUrl: './admin-data-management-page.scss'
})
export class AdminDataManagementPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly exporting = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly exportForm = new FormGroup({
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true })
  });

  private readonly adminApi = inject(AdminApiService);
  private readonly document = inject(DOCUMENT);

  exportUsers(): void {
    const range = this.exportForm.getRawValue();

    this.exporting.set(true);
    this.message.set(null);
    this.errors.set([]);

    this.adminApi
      .exportUsersReport(this.toIsoDate(range.from), this.toIsoDate(range.to))
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob);
          this.message.set(this.i18n.t('dataManagement.usersExported'));
        },
        error: (error: unknown) => this.addError('GET /api/Admin/ExportUsersReport', error)
      });
  }

  resetExportRange(): void {
    this.exportForm.reset({
      from: '',
      to: ''
    });
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private downloadBlob(blob: Blob): void {
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = 'labport-users-report.csv';
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

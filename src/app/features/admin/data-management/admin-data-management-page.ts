import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { finalize } from 'rxjs';

import { SettingsBackupDto, SettingsBackupImportResultDto } from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { readableApiError } from '../../../core/api/api-error';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-data-management-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTimepickerModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './admin-data-management-page.html',
  styleUrl: './admin-data-management-page.scss'
})
export class AdminDataManagementPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly exportingUsers = signal(false);
  readonly exportingSettings = signal(false);
  readonly importingSettings = signal(false);
  readonly selectedBackup = signal<SettingsBackupDto | null>(null);
  readonly selectedFileName = signal<string | null>(null);
  readonly importResult = signal<SettingsBackupImportResultDto | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly exportForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    fromTime: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
    toTime: new FormControl<Date | null>(null)
  });

  private readonly adminApi = inject(AdminApiService);
  private readonly document = inject(DOCUMENT);
  private readonly dateAdapter = inject(DateAdapter<Date>);

  constructor() {
    effect(() => this.dateAdapter.setLocale(this.i18n.dateLocale()));
  }

  exportUsers(): void {
    const range = this.exportForm.getRawValue();

    this.exportingUsers.set(true);
    this.message.set(null);
    this.errors.set([]);

    this.adminApi
      .exportUsersReport(this.toIsoDate(range.from, 'start', range.fromTime), this.toIsoDate(range.to, 'end', range.toTime))
      .pipe(finalize(() => this.exportingUsers.set(false)))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob, 'labport-users-report.csv');
          this.message.set(this.i18n.t('dataManagement.usersExported'));
        },
        error: (error: unknown) => this.addError(this.i18n.t('dataManagement.exportUsers'), error)
      });
  }

  exportSettingsBackup(): void {
    this.exportingSettings.set(true);
    this.message.set(null);
    this.errors.set([]);

    this.adminApi
      .exportSettingsBackup()
      .pipe(finalize(() => this.exportingSettings.set(false)))
      .subscribe({
        next: (backup) => {
          const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json'
          });
          this.downloadBlob(blob, `labport-settings-backup-${this.timestamp()}.json`);
          this.message.set(this.i18n.t('dataManagement.backupCreated'));
        },
        error: (error: unknown) => this.addError(this.i18n.t('dataManagement.exportSettings'), error)
      });
  }

  onSettingsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.selectedBackup.set(null);
    this.importResult.set(null);
    this.errors.set([]);

    if (!file) {
      this.selectedFileName.set(null);
      return;
    }

    this.selectedFileName.set(file.name);

    void file
      .text()
      .then((content) => {
        const parsed = JSON.parse(content) as unknown;
        this.selectedBackup.set(this.validateBackup(parsed));
      })
      .catch(() => {
        this.selectedBackup.set(null);
        this.addError(this.i18n.t('dataManagement.importSettings'), new Error(this.i18n.t('dataManagement.invalidFile')));
      });
  }

  importSettingsBackup(): void {
    const backup = this.selectedBackup();

    if (!backup) {
      this.addError(this.i18n.t('dataManagement.importSettings'), new Error(this.i18n.t('dataManagement.invalidFile')));
      return;
    }

    this.importingSettings.set(true);
    this.importResult.set(null);
    this.message.set(null);
    this.errors.set([]);

    this.adminApi
      .importSettingsBackup(backup)
      .pipe(finalize(() => this.importingSettings.set(false)))
      .subscribe({
        next: (result) => {
          this.importResult.set(result);
          this.message.set(this.i18n.t('dataManagement.importCompleted'));
        },
        error: (error: unknown) => this.addError(this.i18n.t('dataManagement.importSettings'), error)
      });
  }

  resetExportRange(): void {
    this.exportForm.reset({
      from: null,
      fromTime: null,
      to: null,
      toTime: null
    });
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  sourceTypePreviewCount(): number {
    return this.selectedBackup()?.sourceTypes?.length ?? 0;
  }

  testTypePreviewCount(): number {
    return this.selectedBackup()?.testTypes?.length ?? 0;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    globalThis.URL.revokeObjectURL(url);
  }

  private toIsoDate(value: Date | null | undefined, boundary: 'start' | 'end', time?: Date | null): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value.getTime());

    if (time && !Number.isNaN(time.getTime())) {
      parsed.setHours(time.getHours(), time.getMinutes(), 0, 0);
    } else if (boundary === 'start') {
      parsed.setHours(0, 0, 0, 0);
    } else {
      parsed.setHours(23, 59, 59, 999);
    }

    return parsed.toISOString();
  }

  private addError(label: string, error: unknown): void {
    this.errors.update((errors) => [...errors, `${label}: ${this.errorMessage(error)}`]);
  }

  private errorMessage(error: unknown): string {
    return readableApiError(error);
  }

  private validateBackup(value: unknown): SettingsBackupDto {
    if (!value || typeof value !== 'object') {
      throw new Error('Invalid settings backup.');
    }

    const backup = value as SettingsBackupDto;

    if (!Array.isArray(backup.sourceTypes) || !Array.isArray(backup.testTypes)) {
      throw new Error('Invalid settings backup.');
    }

    return {
      exportedAt: backup.exportedAt,
      sourceTypes: backup.sourceTypes,
      testTypes: backup.testTypes
    };
  }

  private timestamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      '-',
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds())
    ].join('');
  }
}

import { DatePipe, DOCUMENT } from '@angular/common';
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
import { MatTableModule } from '@angular/material/table';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { finalize } from 'rxjs';

import { AdminUserReportItemDto, BackendRole, Role, UserDto } from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { readableApiError } from '../../../core/api/api-error';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-users-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTimepickerModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
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
  readonly deletingUserId = signal<string | null>(null);
  readonly loadingStatisticsId = signal<string | null>(null);
  readonly selectedStatistics = signal<AdminUserReportItemDto | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly reportForm = new FormGroup({
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
      .exportUsersReport(this.toIsoDate(range.from, 'start', range.fromTime), this.toIsoDate(range.to, 'end', range.toTime))
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          this.downloadBlob(blob);
          this.message.set(this.i18n.t('admin.users.exported'));
        },
        error: (error: unknown) => this.addError(this.i18n.t('admin.users.export'), error)
      });
  }

  deleteUser(user: UserDto): void {
    if (!user.id) {
      this.addError(this.i18n.t('admin.users.deleteUser'), new Error('User reference is missing.'));
      return;
    }

    const name = this.fullName(user);

    if (!globalThis.confirm(this.i18n.t('admin.users.deleteConfirm').replace('{name}', name))) {
      return;
    }

    this.deletingUserId.set(user.id);
    this.message.set(null);

    this.adminApi
      .deleteUser(user.id)
      .pipe(finalize(() => this.deletingUserId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.users.deleted'));
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('admin.users.deleteUser'), error)
      });
  }

  loadUserStatistics(user: UserDto): void {
    if (!user.id) {
      this.addError(this.i18n.t('admin.users.statistics'), new Error('User reference is missing.'));
      return;
    }

    this.loadingStatisticsId.set(user.id);
    this.message.set(null);

    this.adminApi
      .getUserInfoStatistics(user.id)
      .pipe(finalize(() => this.loadingStatisticsId.set(null)))
      .subscribe({
        next: (statistics) => this.selectedStatistics.set(statistics),
        error: (error: unknown) => this.addError(this.i18n.t('admin.users.statistics'), error)
      });
  }

  resetReportRange(): void {
    this.reportForm.reset({
      from: null,
      fromTime: null,
      to: null,
      toTime: null
    });
  }

  fullName(user: UserDto): string {
    const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
    const name = parts
      .filter((part, index) => parts.findIndex((candidate) => candidate.localeCompare(part, undefined, { sensitivity: 'base' }) === 0) === index)
      .join(' ');
    return name || user.email || '-';
  }

  roleValue(role: Role | null | undefined): BackendRole {
    return String(role ?? '').toLowerCase() === 'admin' ? 'Admin' : 'User';
  }

  roleLabel(role: BackendRole): string {
    return role === 'Admin' ? this.i18n.t('admin.users.role.admin') : this.i18n.t('admin.users.role.user');
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
}

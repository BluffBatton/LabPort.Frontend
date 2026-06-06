import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { BackendRole, Role, UserDto } from '../../../core/api/api.models';
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
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
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
  readonly updatingRoleId = signal<string | null>(null);
  readonly deletingUserId = signal<string | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);
  readonly roleOptions: readonly BackendRole[] = ['User', 'Admin'];

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

  updateRole(user: UserDto, role: BackendRole): void {
    if (!user.id) {
      this.addError(this.i18n.t('admin.users.manageRole'), new Error('User reference is missing.'));
      return;
    }

    if (role === this.roleValue(user.role)) {
      return;
    }

    const name = this.fullName(user);

    if (!globalThis.confirm(this.i18n.t('admin.users.changeRoleConfirm').replace('{name}', name))) {
      return;
    }

    this.updatingRoleId.set(user.id);
    this.message.set(null);

    this.adminApi
      .updateUserRole(user.id, { role })
      .pipe(finalize(() => this.updatingRoleId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.users.roleUpdated'));
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('admin.users.manageRole'), error)
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
    return readableApiError(error);
  }
}

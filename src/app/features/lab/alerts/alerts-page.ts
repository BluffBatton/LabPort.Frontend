import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { AlertDto } from '../../../core/api/api.models';
import { readableApiError } from '../../../core/api/api-error';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-alerts-page',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './alerts-page.html',
  styleUrl: './alerts-page.scss'
})
export class AlertsPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['createdAt', 'message', 'status', 'actions'];
  readonly alerts = signal<AlertDto[]>([]);
  readonly selectedAlert = signal<AlertDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly markingReadId = signal<string | null>(null);
  readonly deletingAlertId = signal<string | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  private readonly labApi = inject(LabApiService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    this.labApi
      .getAlerts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (alerts) => this.alerts.set(alerts),
        error: (error: unknown) => {
          this.alerts.set([]);
          this.addError(this.i18n.t('alerts.listTitle'), error);
        }
      });
  }

  loadDetails(alert: AlertDto): void {
    if (!alert.id) {
      this.addError(this.i18n.t('alerts.detailsTitle'), new Error('Alert reference is missing.'));
      return;
    }

    this.loadingDetailsId.set(alert.id);

    this.labApi
      .getAlertById(alert.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (selectedAlert) => this.selectedAlert.set(selectedAlert),
        error: (error: unknown) => this.addError(this.i18n.t('alerts.detailsTitle'), error)
      });
  }

  markAsRead(alert: AlertDto): void {
    if (!alert.id) {
      this.addError(this.i18n.t('alerts.markRead'), new Error('Alert reference is missing.'));
      return;
    }

    this.markingReadId.set(alert.id);
    this.message.set(null);

    this.labApi
      .markAlertAsRead(alert.id)
      .pipe(finalize(() => this.markingReadId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('alerts.markedRead'));
          if (this.selectedAlert()?.id === alert.id) {
            this.selectedAlert.set({
              ...this.selectedAlert()!,
              isRead: true,
              readAt: new Date().toISOString()
            });
          }
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('alerts.markRead'), error)
      });
  }

  deleteAlert(alert: AlertDto): void {
    if (!alert.id) {
      this.addError(this.i18n.t('alerts.delete'), new Error('Alert reference is missing.'));
      return;
    }

    const label = alert.message || this.i18n.t('alerts.detailsTitle');

    if (!globalThis.confirm(this.i18n.t('alerts.deleteConfirm').replace('{message}', label))) {
      return;
    }

    this.deletingAlertId.set(alert.id);
    this.message.set(null);

    this.labApi
      .deleteAlert(alert.id)
      .pipe(finalize(() => this.deletingAlertId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('alerts.deleted'));
          if (this.selectedAlert()?.id === alert.id) {
            this.selectedAlert.set(null);
          }
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('alerts.delete'), error)
      });
  }

  statusLabel(alert: AlertDto): string {
    return alert.isRead ? this.i18n.t('alerts.status.read') : this.i18n.t('alerts.status.unread');
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private addError(label: string, error: unknown): void {
    this.errors.update((errors) => [...errors, `${label}: ${this.errorMessage(error)}`]);
  }

  private errorMessage(error: unknown): string {
    return readableApiError(error);
  }
}

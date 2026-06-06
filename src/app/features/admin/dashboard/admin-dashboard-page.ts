import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { AdminStatisticsDto } from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss'
})
export class AdminDashboardPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly dayOptions = [7, 14, 30, 90] as const;
  readonly days = signal(7);
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly stats = signal<AdminStatisticsDto | null>(null);

  private readonly adminApi = inject(AdminApiService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    this.adminApi
      .getStatistics(this.days())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error: unknown) => {
          this.stats.set(null);
          this.addError(this.i18n.t('pages.adminDashboard.title'), error);
        }
      });
  }

  setDays(days: number): void {
    this.days.set(days);
    this.refresh();
  }

  metric(value: number | null | undefined): number | string {
    return typeof value === 'number' ? value : '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
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

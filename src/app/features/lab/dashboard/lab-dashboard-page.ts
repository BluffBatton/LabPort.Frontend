import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, Observable, OperatorFunction, of } from 'rxjs';

import { ContainerReadingStatsDto, ReadingPointDto, SampleDto, TestDto, TestResultDto } from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

interface DashboardData {
  readonly stats: ContainerReadingStatsDto | null;
  readonly samples: readonly SampleDto[];
  readonly tests: readonly TestDto[];
  readonly results: readonly TestResultDto[];
}

@Component({
  selector: 'app-lab-dashboard-page',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './lab-dashboard-page.html',
  styleUrl: './lab-dashboard-page.scss'
})
export class LabDashboardPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly loading = signal(false);
  readonly errors = signal<string[]>([]);
  readonly data = signal<DashboardData>({
    stats: null,
    samples: [],
    tests: [],
    results: []
  });

  private readonly labApi = inject(LabApiService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    forkJoin({
      stats: this.labApi.getContainerReadingStats().pipe(this.fallback('GET /api/Statistics/GetContainerReadingsStats', null)),
      samples: this.labApi.getSamples().pipe(this.fallback('GET /api/Sample/GetAllSamples', [] as SampleDto[])),
      tests: this.labApi.getTests().pipe(this.fallback('GET /api/Test/GetAllTests', [] as TestDto[])),
      results: this.labApi.getTestResults().pipe(this.fallback('GET /api/TestResult/GetAllTestResults', [] as TestResultDto[]))
    }).subscribe((data) => {
      this.data.set(data);
      this.loading.set(false);
    });
  }

  readingPoints(): readonly ReadingPointDto[] {
    return this.data().stats?.points ?? [];
  }

  recentReadings(): readonly ReadingPointDto[] {
    return this.readingPoints().slice(-5).reverse();
  }

  metricValue(value: number | null | undefined, unit: string): string {
    return typeof value === 'number' ? `${value.toFixed(1)} ${unit}` : '-';
  }

  private fallback<TSource, TFallback>(label: string, fallbackValue: TFallback): OperatorFunction<TSource, TSource | TFallback> {
    return (source: Observable<TSource>) =>
      source.pipe(
        catchError((error: unknown) => {
          this.errors.update((errors) => [...errors, `${label}: ${this.errorMessage(error)}`]);
          return of(fallbackValue);
        })
      );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Request failed';
  }
}

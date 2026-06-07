import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import {
  LidPosition,
  SensorReadingDto
} from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-readings-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './readings-page.html',
  styleUrl: './readings-page.scss'
})
export class ReadingsPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['createdAt', 'temperature', 'humidity', 'lidPosition', 'actions'];
  readonly takeOptions = [10, 25, 50, 100] as const;
  readonly take = signal(25);
  readonly readings = signal<SensorReadingDto[]>([]);
  readonly selectedReading = signal<SensorReadingDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly errors = signal<string[]>([]);

  private readonly labApi = inject(LabApiService);

  constructor() {
    this.refresh();
  }

  latestReading(): SensorReadingDto | null {
    return this.readings()[0] ?? null;
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    this.labApi
      .getSensorReadings(this.take())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (readings) => this.readings.set(readings),
        error: (error: unknown) => {
          this.readings.set([]);
          this.addError(this.i18n.t('readings.listTitle'), error);
        }
      });
  }

  setTake(take: number): void {
    this.take.set(take);
    this.refresh();
  }

  loadDetails(reading: SensorReadingDto): void {
    if (!reading.id) {
      this.addError(this.i18n.t('readings.detailsTitle'), new Error('Sensor reading reference is missing.'));
      return;
    }

    this.loadingDetailsId.set(reading.id);

    this.labApi
      .getSensorReadingById(reading.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (selectedReading) => this.selectedReading.set(selectedReading),
        error: (error: unknown) => this.addError(this.i18n.t('readings.detailsTitle'), error)
      });
  }

  lidLabel(lidPosition: LidPosition | undefined | null): string {
    return lidPosition ? this.i18n.t(`readings.lid.${lidPosition}`) : '-';
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

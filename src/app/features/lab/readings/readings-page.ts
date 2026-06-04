import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import {
  LidPosition,
  SensorReadingCreateDto,
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
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './readings-page.html',
  styleUrl: './readings-page.scss'
})
export class ReadingsPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['createdAt', 'temperature', 'humidity', 'lidPosition', 'actions'];
  readonly takeOptions = [10, 25, 50, 100] as const;
  readonly lidPositions: readonly LidPosition[] = ['closed', 'open'];
  readonly take = signal(25);
  readonly readings = signal<SensorReadingDto[]>([]);
  readonly selectedReading = signal<SensorReadingDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly form = new FormGroup({
    deviceKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    temperature: new FormControl<number | null>(null),
    humidity: new FormControl<number | null>(null),
    lidPosition: new FormControl<LidPosition>('closed', {
      nonNullable: true
    })
  });

  private readonly labApi = inject(LabApiService);

  constructor() {
    this.refresh();
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
          this.addError('GET /api/SensorReading/GetAllSensorReadings/{take}', error);
        }
      });
  }

  setTake(take: number): void {
    this.take.set(take);
    this.refresh();
  }

  createReading(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    this.labApi
      .createSensorReading(this.createPayload())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('readings.created'));
          this.form.reset({
            deviceKey: '',
            temperature: null,
            humidity: null,
            lidPosition: 'closed'
          });
          this.refresh();
        },
        error: (error: unknown) => this.addError('POST /api/SensorReading/CreateSensor', error)
      });
  }

  loadDetails(reading: SensorReadingDto): void {
    if (!reading.id) {
      this.addError('GET /api/SensorReading/GetSensorReadingById/{Id}', new Error('Sensor reading id is missing.'));
      return;
    }

    this.loadingDetailsId.set(reading.id);

    this.labApi
      .getSensorReadingById(reading.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (selectedReading) => this.selectedReading.set(selectedReading),
        error: (error: unknown) => this.addError('GET /api/SensorReading/GetSensorReadingById/{Id}', error)
      });
  }

  lidLabel(lidPosition: LidPosition | undefined | null): string {
    return lidPosition ? this.i18n.t(`readings.lid.${lidPosition}`) : '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private createPayload(): SensorReadingCreateDto {
    const value = this.form.getRawValue();

    return {
      deviceKey: value.deviceKey.trim(),
      ...(typeof value.temperature === 'number' ? { temperature: value.temperature } : {}),
      ...(typeof value.humidity === 'number' ? { humidity: value.humidity } : {}),
      lidPosition: value.lidPosition
    };
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

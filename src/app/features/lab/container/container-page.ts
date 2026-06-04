import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { ContainerDto, ContainerUpdateDto } from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-container-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './container-page.html',
  styleUrl: './container-page.scss'
})
export class ContainerPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly container = signal<ContainerDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly form = new FormGroup({
    temperatureMin: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    temperatureMax: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    humidityMin: new FormControl<number | null>(null, {
      validators: [Validators.required]
    }),
    humidityMax: new FormControl<number | null>(null, {
      validators: [Validators.required]
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
      .getContainer()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (container) => {
          this.container.set(container);
          this.form.reset({
            temperatureMin: container.temperatureMin ?? null,
            temperatureMax: container.temperatureMax ?? null,
            humidityMin: container.humidityMin ?? null,
            humidityMax: container.humidityMax ?? null
          });
        },
        error: (error: unknown) => this.addError('GET /api/Container/GetContainer', error)
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    this.labApi
      .updateContainer(this.payload())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('container.saved'));
          this.refresh();
        },
        error: (error: unknown) => this.addError('PATCH /api/Container/UpdateContainer', error)
      });
  }

  value(value: number | null | undefined, unit: string): string {
    return typeof value === 'number' ? `${value.toFixed(1)} ${unit}` : '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private payload(): ContainerUpdateDto {
    const value = this.form.getRawValue();

    return {
      temperatureMin: value.temperatureMin,
      temperatureMax: value.temperatureMax,
      humidityMin: value.humidityMin,
      humidityMax: value.humidityMax
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

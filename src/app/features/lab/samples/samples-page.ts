import { DatePipe } from '@angular/common';
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
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { ContainerDto, SampleCreateDto, SampleDto, SampleUpdateDto, SourceDto } from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-samples-page',
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
  templateUrl: './samples-page.html',
  styleUrl: './samples-page.scss'
})
export class SamplesPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['name', 'collectedAt', 'sourceName', 'containerOwnerFullName', 'actions'];
  readonly samples = signal<SampleDto[]>([]);
  readonly sources = signal<SourceDto[]>([]);
  readonly container = signal<ContainerDto | null>(null);
  readonly selectedSample = signal<SampleDto | null>(null);
  readonly detailedSample = signal<SampleDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    collectedAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    sourceId: new FormControl('', {
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

    forkJoin({
      samples: this.labApi.getSamples().pipe(
        catchError((error: unknown) => {
          this.addError(this.i18n.t('samples.listTitle'), error);
          return of([] as SampleDto[]);
        })
      ),
      sources: this.labApi.getSources().pipe(
        catchError((error: unknown) => {
          this.addError(this.i18n.t('sources.listTitle'), error);
          return of([] as SourceDto[]);
        })
      ),
      container: this.labApi.getContainer().pipe(
        catchError((error: unknown) => {
          this.addError(this.i18n.t('pages.container.title'), error);
          return of(null);
        })
      )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ samples, sources, container }) => {
        this.samples.set([...samples].sort((first, second) => this.i18n.compareText(first.name, second.name)));
        this.sources.set([...sources].sort((first, second) => this.i18n.compareText(first.name, second.name)));
        this.container.set(container);
      });
  }

  startCreate(): void {
    this.selectedSample.set(null);
    this.message.set(null);
    this.form.reset({
      name: '',
      collectedAt: this.toDateTimeLocal(new Date().toISOString()),
      sourceId: ''
    });
  }

  editSample(sample: SampleDto): void {
    this.selectedSample.set(sample);
    this.message.set(null);
    this.form.reset({
      name: sample.name ?? '',
      collectedAt: this.toDateTimeLocal(sample.collectedAt),
      sourceId: sample.sourceId ?? ''
    });
  }

  loadDetails(sample: SampleDto): void {
    if (!sample.id) {
      this.addError(this.i18n.t('samples.detailsTitle'), new Error('Sample reference is missing.'));
      return;
    }

    this.loadingDetailsId.set(sample.id);

    this.labApi
      .getSampleById(sample.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (detailedSample) => this.detailedSample.set(detailedSample),
        error: (error: unknown) => this.addError(this.i18n.t('samples.detailsTitle'), error)
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedSample = this.selectedSample();
    const request = selectedSample?.id
      ? this.labApi.updateSample(selectedSample.id, this.updatePayload())
      : this.labApi.createSample(this.createPayload());

    this.saving.set(true);
    this.message.set(null);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.set(
          selectedSample ? this.i18n.t('samples.savedUpdate') : this.i18n.t('samples.savedCreate')
        );
        this.startCreate();
        this.refresh();
      },
      error: (error: unknown) => this.addError(this.i18n.t('samples.save'), error)
    });
  }

  deleteSample(sample: SampleDto): void {
    if (!sample.id) {
      this.addError(this.i18n.t('samples.delete'), new Error('Sample reference is missing.'));
      return;
    }

    const sampleName = sample.name || this.i18n.t('samples.unnamed');

    if (!globalThis.confirm(this.i18n.t('samples.deleteConfirm').replace('{name}', sampleName))) {
      return;
    }

    this.deletingId.set(sample.id);
    this.message.set(null);

    this.labApi
      .deleteSample(sample.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('samples.deleted'));
          if (this.selectedSample()?.id === sample.id) {
            this.startCreate();
          }
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('samples.delete'), error)
      });
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private createPayload(): SampleCreateDto {
    const value = this.form.getRawValue();
    const containerId = this.container()?.id;

    return {
      name: value.name.trim(),
      collectedAt: this.toIsoDate(value.collectedAt),
      ...(containerId ? { containerId } : {}),
      ...(value.sourceId ? { sourceId: value.sourceId } : {})
    };
  }

  private updatePayload(): SampleUpdateDto {
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      collectedAt: this.toIsoDate(value.collectedAt),
      sourceId: value.sourceId || null
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

  private toIsoDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  private toDateTimeLocal(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const timezoneOffset = parsed.getTimezoneOffset() * 60000;
    return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }
}

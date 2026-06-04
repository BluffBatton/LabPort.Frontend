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

import { SourceCreateDto, SourceDto, SourceTypeDto, SourceUpdateDto } from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-sources-page',
  imports: [
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
  templateUrl: './sources-page.html',
  styleUrl: './sources-page.scss'
})
export class SourcesPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['name', 'sourceTypeName', 'location', 'contactInfo', 'actions'];
  readonly sources = signal<SourceDto[]>([]);
  readonly sourceTypes = signal<SourceTypeDto[]>([]);
  readonly selectedSource = signal<SourceDto | null>(null);
  readonly detailedSource = signal<SourceDto | null>(null);
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
    sourceTypeId: new FormControl('', {
      nonNullable: true
    }),
    location: new FormControl('', {
      nonNullable: true
    }),
    contactInfo: new FormControl('', {
      nonNullable: true
    }),
    note: new FormControl('', {
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
      sources: this.labApi.getSources().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/Source/GetAllSources', error);
          return of([] as SourceDto[]);
        })
      ),
      sourceTypes: this.labApi.getSourceTypes().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/SourceType/GetAllSourceTypes', error);
          return of([] as SourceTypeDto[]);
        })
      )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ sources, sourceTypes }) => {
        this.sources.set(sources);
        this.sourceTypes.set(sourceTypes);
      });
  }

  startCreate(): void {
    this.selectedSource.set(null);
    this.message.set(null);
    this.form.reset({
      name: '',
      sourceTypeId: '',
      location: '',
      contactInfo: '',
      note: ''
    });
  }

  editSource(source: SourceDto): void {
    this.selectedSource.set(source);
    this.message.set(null);
    this.form.reset({
      name: source.name ?? '',
      sourceTypeId: source.sourceTypeId ?? '',
      location: source.location ?? '',
      contactInfo: source.contactInfo ?? '',
      note: source.note ?? ''
    });
  }

  loadDetails(source: SourceDto): void {
    if (!source.id) {
      this.addError('GET /api/Source/GetSourceById/{Id}', new Error('Source id is missing.'));
      return;
    }

    this.loadingDetailsId.set(source.id);

    this.labApi
      .getSourceById(source.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (detailedSource) => this.detailedSource.set(detailedSource),
        error: (error: unknown) => this.addError('GET /api/Source/GetSourceById/{Id}', error)
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedSource = this.selectedSource();
    const request = selectedSource?.id
      ? this.labApi.updateSource(selectedSource.id, this.updatePayload())
      : this.labApi.createSource(this.createPayload());

    this.saving.set(true);
    this.message.set(null);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.set(selectedSource ? this.i18n.t('sources.savedUpdate') : this.i18n.t('sources.savedCreate'));
        this.startCreate();
        this.refresh();
      },
      error: (error: unknown) => this.addError(selectedSource ? 'PATCH /api/Source/UpdateSource/{Id}' : 'POST /api/Source/CreateSource', error)
    });
  }

  deleteSource(source: SourceDto): void {
    if (!source.id) {
      this.addError('DELETE /api/Source/DeleteSource/{Id}', new Error('Source id is missing.'));
      return;
    }

    const sourceName = source.name ?? source.id;

    if (!globalThis.confirm(this.i18n.t('sources.deleteConfirm').replace('{name}', sourceName))) {
      return;
    }

    this.deletingId.set(source.id);
    this.message.set(null);

    this.labApi
      .deleteSource(source.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('sources.deleted'));
          if (this.selectedSource()?.id === source.id) {
            this.startCreate();
          }
          this.refresh();
        },
        error: (error: unknown) => this.addError('DELETE /api/Source/DeleteSource/{Id}', error)
      });
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private createPayload(): SourceCreateDto {
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      note: value.note.trim() || null,
      location: value.location.trim() || null,
      contactInfo: value.contactInfo.trim() || null,
      ...(value.sourceTypeId ? { sourceTypeId: value.sourceTypeId } : {})
    };
  }

  private updatePayload(): SourceUpdateDto {
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      note: value.note.trim() || null,
      location: value.location.trim() || null,
      contactInfo: value.contactInfo.trim() || null,
      sourceTypeId: value.sourceTypeId || null
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

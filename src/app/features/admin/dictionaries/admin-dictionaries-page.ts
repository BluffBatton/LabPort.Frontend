import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import {
  SourceTypeCreateDto,
  SourceTypeDto,
  TestTypeCreateDto,
  TestTypeDto
} from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-admin-dictionaries-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-dictionaries-page.html',
  styleUrl: './admin-dictionaries-page.scss'
})
export class AdminDictionariesPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly sourceTypeColumns = ['name', 'actions'];
  readonly testTypeColumns = ['name', 'range', 'unit', 'actions'];
  readonly sourceTypes = signal<SourceTypeDto[]>([]);
  readonly testTypes = signal<TestTypeDto[]>([]);
  readonly loading = signal(false);
  readonly savingSourceType = signal(false);
  readonly savingTestType = signal(false);
  readonly deletingSourceTypeId = signal<string | null>(null);
  readonly deletingTestTypeId = signal<string | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly sourceTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  readonly testTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    referenceMin: new FormControl<number | null>(null),
    referenceMax: new FormControl<number | null>(null),
    unit: new FormControl('', {
      nonNullable: true
    })
  });

  private readonly adminApi = inject(AdminApiService);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    forkJoin({
      sourceTypes: this.adminApi.getSourceTypes().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/SourceType/GetAllSourceTypes', error);
          return of([] as SourceTypeDto[]);
        })
      ),
      testTypes: this.adminApi.getTestTypes().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/Test/GetTestTypeQuery', error);
          return of([] as TestTypeDto[]);
        })
      )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ sourceTypes, testTypes }) => {
        this.sourceTypes.set(sourceTypes);
        this.testTypes.set(testTypes);
      });
  }

  createSourceType(): void {
    if (this.sourceTypeForm.invalid) {
      this.sourceTypeForm.markAllAsTouched();
      return;
    }

    this.savingSourceType.set(true);
    this.message.set(null);

    this.adminApi
      .createSourceType(this.sourceTypePayload())
      .pipe(finalize(() => this.savingSourceType.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.dictionaries.sourceTypeCreated'));
          this.sourceTypeForm.reset({ name: '' });
          this.refresh();
        },
        error: (error: unknown) => this.addError('POST /api/Admin/CreateSourceType', error)
      });
  }

  deleteSourceType(sourceType: SourceTypeDto): void {
    if (!sourceType.id) {
      this.addError('DELETE /api/Admin/DeleteSourceType/{id}', new Error('Source type id is missing.'));
      return;
    }

    const name = sourceType.name ?? sourceType.id;

    if (!globalThis.confirm(this.i18n.t('admin.dictionaries.deleteSourceTypeConfirm').replace('{name}', name))) {
      return;
    }

    this.deletingSourceTypeId.set(sourceType.id);
    this.message.set(null);

    this.adminApi
      .deleteSourceType(sourceType.id)
      .pipe(finalize(() => this.deletingSourceTypeId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.dictionaries.sourceTypeDeleted'));
          this.refresh();
        },
        error: (error: unknown) => this.addError('DELETE /api/Admin/DeleteSourceType/{id}', error)
      });
  }

  createTestType(): void {
    if (this.testTypeForm.invalid) {
      this.testTypeForm.markAllAsTouched();
      return;
    }

    this.savingTestType.set(true);
    this.message.set(null);

    this.adminApi
      .createTestType(this.testTypePayload())
      .pipe(finalize(() => this.savingTestType.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.dictionaries.testTypeCreated'));
          this.testTypeForm.reset({
            name: '',
            referenceMin: null,
            referenceMax: null,
            unit: ''
          });
          this.refresh();
        },
        error: (error: unknown) => this.addError('POST /api/Admin/CreateTestType', error)
      });
  }

  deleteTestType(testType: TestTypeDto): void {
    if (!testType.id) {
      this.addError('DELETE /api/Admin/DeleteTestType/{id}', new Error('Test type id is missing.'));
      return;
    }

    const name = testType.name ?? testType.id;

    if (!globalThis.confirm(this.i18n.t('admin.dictionaries.deleteTestTypeConfirm').replace('{name}', name))) {
      return;
    }

    this.deletingTestTypeId.set(testType.id);
    this.message.set(null);

    this.adminApi
      .deleteTestType(testType.id)
      .pipe(finalize(() => this.deletingTestTypeId.set(null)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('admin.dictionaries.testTypeDeleted'));
          this.refresh();
        },
        error: (error: unknown) => this.addError('DELETE /api/Admin/DeleteTestType/{id}', error)
      });
  }

  range(testType: TestTypeDto): string {
    const min = typeof testType.referenceMin === 'number' ? testType.referenceMin : null;
    const max = typeof testType.referenceMax === 'number' ? testType.referenceMax : null;

    if (min === null && max === null) {
      return '-';
    }

    return `${min ?? '-'} - ${max ?? '-'}`;
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private sourceTypePayload(): SourceTypeCreateDto {
    const value = this.sourceTypeForm.getRawValue();

    return {
      name: value.name.trim()
    };
  }

  private testTypePayload(): TestTypeCreateDto {
    const value = this.testTypeForm.getRawValue();

    return {
      name: value.name.trim(),
      referenceMin: value.referenceMin,
      referenceMax: value.referenceMax,
      unit: value.unit.trim() || null
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

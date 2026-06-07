import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import {
  SourceTypeCreateDto,
  SourceTypeDto,
  SourceTypeUpdateDto,
  TestTypeCreateDto,
  TestTypeDto,
  TestTypeUpdateDto
} from '../../../core/api/api.models';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { readableApiError } from '../../../core/api/api-error';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';
import { TranslationKey } from '../../../core/localization/translations';

type DictionaryKind = 'source' | 'test' | 'both';

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
  private readonly route = inject(ActivatedRoute);
  readonly kind = this.dictionaryKind();
  readonly sourceTypeColumns = ['name', 'actions'];
  readonly testTypeColumns = ['name', 'range', 'unit', 'actions'];
  readonly sourceTypes = signal<SourceTypeDto[]>([]);
  readonly testTypes = signal<TestTypeDto[]>([]);
  readonly loading = signal(false);
  readonly savingSourceType = signal(false);
  readonly savingTestType = signal(false);
  readonly deletingSourceTypeId = signal<string | null>(null);
  readonly deletingTestTypeId = signal<string | null>(null);
  readonly selectedSourceType = signal<SourceTypeDto | null>(null);
  readonly selectedTestType = signal<TestTypeDto | null>(null);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly sourceTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)]
    })
  });

  readonly testTypeForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)]
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
      sourceTypes: this.showSourceTypes()
        ? this.adminApi.getSourceTypes().pipe(
            catchError((error: unknown) => {
              this.addError(this.i18n.t('admin.dictionaries.sourceTypes'), error);
              return of([] as SourceTypeDto[]);
            })
          )
        : of([] as SourceTypeDto[]),
      testTypes: this.showTestTypes()
        ? this.adminApi.getTestTypes().pipe(
            catchError((error: unknown) => {
              this.addError(this.i18n.t('admin.dictionaries.testTypes'), error);
              return of([] as TestTypeDto[]);
            })
          )
        : of([] as TestTypeDto[])
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ sourceTypes, testTypes }) => {
        this.sourceTypes.set(
          this.uniqueBy(sourceTypes, (sourceType) => this.normalizeKey(sourceType.name)).sort((first, second) =>
            this.i18n.compareText(first.name, second.name)
          )
        );
        this.testTypes.set(
          this.uniqueBy(testTypes, (testType) =>
            [
              this.normalizeKey(testType.name),
              this.numericKey(testType.referenceMin),
              this.numericKey(testType.referenceMax),
              this.normalizeKey(testType.unit)
            ].join('|')
          ).sort((first, second) => this.i18n.compareText(first.name, second.name))
        );
      });
  }

  saveSourceType(): void {
    if (this.sourceTypeForm.invalid) {
      this.sourceTypeForm.markAllAsTouched();
      return;
    }

    const selectedSourceType = this.selectedSourceType();
    const request =
      selectedSourceType?.id
        ? this.adminApi.updateSourceType(selectedSourceType.id, this.sourceTypeUpdatePayload())
        : this.adminApi.createSourceType(this.sourceTypePayload());

    this.savingSourceType.set(true);
    this.message.set(null);

    request.pipe(finalize(() => this.savingSourceType.set(false))).subscribe({
      next: () => {
        this.message.set(
          selectedSourceType
            ? this.i18n.t('admin.dictionaries.sourceTypeUpdated')
            : this.i18n.t('admin.dictionaries.sourceTypeCreated')
        );
        this.cancelSourceTypeEdit();
        this.refresh();
      },
      error: (error: unknown) => this.addError(this.i18n.t('admin.dictionaries.saveSourceType'), error)
    });
  }

  editSourceType(sourceType: SourceTypeDto): void {
    this.selectedSourceType.set(sourceType);
    this.message.set(null);
    this.sourceTypeForm.reset({
      name: sourceType.name ?? ''
    });
  }

  cancelSourceTypeEdit(): void {
    this.selectedSourceType.set(null);
    this.sourceTypeForm.reset({ name: '' });
  }

  deleteSourceType(sourceType: SourceTypeDto): void {
    if (!sourceType.id) {
      this.addError(this.i18n.t('admin.dictionaries.delete'), new Error('Source type reference is missing.'));
      return;
    }

    const name = sourceType.name || this.i18n.t('sources.noType');

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
        error: (error: unknown) => this.addError(this.i18n.t('admin.dictionaries.delete'), error)
      });
  }

  saveTestType(): void {
    if (this.testTypeForm.invalid) {
      this.testTypeForm.markAllAsTouched();
      return;
    }

    const selectedTestType = this.selectedTestType();
    const request =
      selectedTestType?.id
        ? this.adminApi.updateTestType(selectedTestType.id, this.testTypeUpdatePayload())
        : this.adminApi.createTestType(this.testTypePayload());

    this.savingTestType.set(true);
    this.message.set(null);

    request.pipe(finalize(() => this.savingTestType.set(false))).subscribe({
      next: () => {
        this.message.set(
          selectedTestType
            ? this.i18n.t('admin.dictionaries.testTypeUpdated')
            : this.i18n.t('admin.dictionaries.testTypeCreated')
        );
        this.cancelTestTypeEdit();
        this.refresh();
      },
      error: (error: unknown) => this.addError(this.i18n.t('admin.dictionaries.saveTestType'), error)
    });
  }

  editTestType(testType: TestTypeDto): void {
    this.selectedTestType.set(testType);
    this.message.set(null);
    this.testTypeForm.reset({
      name: testType.name ?? '',
      referenceMin: testType.referenceMin ?? null,
      referenceMax: testType.referenceMax ?? null,
      unit: testType.unit ?? ''
    });
  }

  cancelTestTypeEdit(): void {
    this.selectedTestType.set(null);
    this.testTypeForm.reset({
      name: '',
      referenceMin: null,
      referenceMax: null,
      unit: ''
    });
  }

  deleteTestType(testType: TestTypeDto): void {
    if (!testType.id) {
      this.addError(this.i18n.t('admin.dictionaries.delete'), new Error('Test type reference is missing.'));
      return;
    }

    const name = testType.name || this.i18n.t('tests.noTestType');

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
        error: (error: unknown) => this.addError(this.i18n.t('admin.dictionaries.delete'), error)
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

  pageTitle(): string {
    return this.i18n.t(this.pageTitleKey());
  }

  showSourceTypes(): boolean {
    return this.kind !== 'test';
  }

  showTestTypes(): boolean {
    return this.kind !== 'source';
  }

  singleColumn(): boolean {
    return this.showSourceTypes() !== this.showTestTypes();
  }

  private pageTitleKey(): TranslationKey {
    if (this.kind === 'source') {
      return 'pages.sourceTypes.title';
    }

    if (this.kind === 'test') {
      return 'pages.testTypes.title';
    }

    return 'pages.dictionaries.title';
  }

  private dictionaryKind(): DictionaryKind {
    const kind = this.route.snapshot.data['dictionaryKind'];
    return kind === 'source' || kind === 'test' || kind === 'both' ? kind : 'both';
  }

  private sourceTypePayload(): SourceTypeCreateDto {
    const value = this.sourceTypeForm.getRawValue();

    return {
      name: value.name.trim()
    };
  }

  private sourceTypeUpdatePayload(): SourceTypeUpdateDto {
    return this.sourceTypePayload();
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

  private testTypeUpdatePayload(): TestTypeUpdateDto {
    return this.testTypePayload();
  }

  private addError(label: string, error: unknown): void {
    this.errors.update((errors) => [...errors, `${label}: ${this.errorMessage(error)}`]);
  }

  private errorMessage(error: unknown): string {
    return readableApiError(error);
  }

  private uniqueBy<T>(items: readonly T[], keySelector: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = keySelector(item);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private normalizeKey(value: string | null | undefined): string {
    return (value ?? '').trim().toLocaleLowerCase(this.i18n.dateLocale());
  }

  private numericKey(value: number | null | undefined): string {
    return typeof value === 'number' ? String(value) : '';
  }
}

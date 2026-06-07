import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { ResultStatus, TestDto, TestResultCreateDto, TestResultDto } from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-results-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTimepickerModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './results-page.html',
  styleUrl: './results-page.scss'
})
export class ResultsPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['name', 'testSubject', 'value', 'resultStatus', 'performedAt', 'actions'];
  readonly statuses: readonly ResultStatus[] = ['expected', 'unexpected', 'failed', 'pending'];
  readonly results = signal<TestResultDto[]>([]);
  readonly tests = signal<TestDto[]>([]);
  readonly detailedResult = signal<TestResultDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly form = new FormGroup({
    testId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    performedAt: new FormControl<Date | null>(null),
    performedTime: new FormControl<Date | null>(null),
    valueNumeric: new FormControl<number | null>(null),
    valueText: new FormControl('', {
      nonNullable: true
    }),
    unit: new FormControl('', {
      nonNullable: true
    }),
    resultStatus: new FormControl<ResultStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    note: new FormControl('', {
      nonNullable: true
    })
  });

  private readonly labApi = inject(LabApiService);
  private readonly dateAdapter = inject(DateAdapter<Date>);

  constructor() {
    effect(() => this.dateAdapter.setLocale(this.i18n.dateLocale()));
    this.refresh();
    this.resetForm();
  }

  refresh(): void {
    this.loading.set(true);
    this.errors.set([]);

    forkJoin({
      results: this.labApi.getTestResults().pipe(
        catchError((error: unknown) => {
          this.addError(this.i18n.t('results.listTitle'), error);
          return of([] as TestResultDto[]);
        })
      ),
      tests: this.labApi.getTests().pipe(
        catchError((error: unknown) => {
          this.addError(this.i18n.t('tests.listTitle'), error);
          return of([] as TestDto[]);
        })
      )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ results, tests }) => {
        this.results.set([...results].sort((first, second) => this.i18n.compareText(first.name, second.name)));
        this.tests.set([...tests].sort((first, second) => this.i18n.compareText(first.subject, second.subject)));
      });
  }

  resetForm(): void {
    const now = new Date();
    this.message.set(null);
    this.form.reset({
      testId: '',
      name: '',
      performedAt: now,
      performedTime: now,
      valueNumeric: null,
      valueText: '',
      unit: '',
      resultStatus: 'pending',
      note: ''
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
      .createTestResult(this.createPayload())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set(this.i18n.t('results.savedCreate'));
          this.resetForm();
          this.refresh();
        },
        error: (error: unknown) => this.addError(this.i18n.t('results.createTitle'), error)
    });
  }

  loadDetails(result: TestResultDto): void {
    if (!result.id) {
      this.addError(this.i18n.t('results.detailsTitle'), new Error('Test result reference is missing.'));
      return;
    }

    this.loadingDetailsId.set(result.id);

    this.labApi
      .getTestResultById(result.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (detailedResult) => this.detailedResult.set(detailedResult),
        error: (error: unknown) => this.addError(this.i18n.t('results.detailsTitle'), error)
      });
  }

  resultValue(result: TestResultDto): string {
    if (typeof result.valueNumeric === 'number') {
      return `${result.valueNumeric} ${result.unit ?? ''}`.trim();
    }

    return result.valueText || '-';
  }

  statusLabel(status: ResultStatus | undefined): string {
    return status ? this.i18n.t(`results.status.${status}`) : '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private createPayload(): TestResultCreateDto {
    const value = this.form.getRawValue();

    return {
      testId: value.testId,
      name: value.name.trim(),
      performedAt: this.toIsoDate(value.performedAt, value.performedTime),
      valueNumeric: value.valueNumeric,
      valueText: value.valueText.trim() || null,
      unit: value.unit.trim() || null,
      resultStatus: value.resultStatus,
      note: value.note.trim() || null
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

  private toIsoDate(value: Date | null | undefined, time?: Date | null): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value.getTime());

    if (time && !Number.isNaN(time.getTime())) {
      parsed.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }

    return parsed.toISOString();
  }
}

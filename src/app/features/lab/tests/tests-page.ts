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

import {
  SampleDto,
  TestCreateDto,
  TestDto,
  TestStatus,
  TestTypeDto,
  TestUpdatedDto
} from '../../../core/api/api.models';
import { LabApiService } from '../../../core/api/lab-api.service';
import { LabportApiService } from '../../../core/api/labport-api.service';
import { LocalizationService } from '../../../core/localization/localization.service';

@Component({
  selector: 'app-tests-page',
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
  templateUrl: './tests-page.html',
  styleUrl: './tests-page.scss'
})
export class TestsPage {
  readonly i18n = inject(LocalizationService);
  readonly api = inject(LabportApiService);
  readonly displayedColumns = ['subject', 'sampleName', 'testTypeName', 'testStatus', 'testedAt', 'actions'];
  readonly statuses: readonly TestStatus[] = ['await', 'started', 'done'];
  readonly tests = signal<TestDto[]>([]);
  readonly samples = signal<SampleDto[]>([]);
  readonly testTypes = signal<TestTypeDto[]>([]);
  readonly selectedTest = signal<TestDto | null>(null);
  readonly detailedTest = signal<TestDto | null>(null);
  readonly loading = signal(false);
  readonly loadingDetailsId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly message = signal<string | null>(null);

  readonly form = new FormGroup({
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    sampleId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    testTypeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    testedAt: new FormControl('', {
      nonNullable: true
    }),
    testStatus: new FormControl<TestStatus>('await', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    comment: new FormControl('', {
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
      tests: this.labApi.getTests().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/Test/GetAllTests', error);
          return of([] as TestDto[]);
        })
      ),
      samples: this.labApi.getSamples().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/Sample/GetAllSamples', error);
          return of([] as SampleDto[]);
        })
      ),
      testTypes: this.labApi.getTestTypes().pipe(
        catchError((error: unknown) => {
          this.addError('GET /api/Test/GetTestTypeQuery', error);
          return of([] as TestTypeDto[]);
        })
      )
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ tests, samples, testTypes }) => {
        this.tests.set(tests);
        this.samples.set(samples);
        this.testTypes.set(testTypes);
      });
  }

  startCreate(): void {
    this.selectedTest.set(null);
    this.message.set(null);
    this.form.reset({
      subject: '',
      sampleId: '',
      testTypeId: '',
      testedAt: this.toDateTimeLocal(new Date().toISOString()),
      testStatus: 'await',
      comment: ''
    });
    this.form.controls.subject.enable();
    this.form.controls.sampleId.enable();
    this.form.controls.testedAt.enable();
  }

  editTest(test: TestDto): void {
    this.selectedTest.set(test);
    this.message.set(null);
    this.form.reset({
      subject: test.subject ?? '',
      sampleId: test.sampleId ?? '',
      testTypeId: test.testTypeId ?? '',
      testedAt: this.toDateTimeLocal(test.testedAt),
      testStatus: test.testStatus ?? 'await',
      comment: test.comment ?? ''
    });
    this.form.controls.subject.disable();
    this.form.controls.sampleId.disable();
    this.form.controls.testedAt.disable();
  }

  loadDetails(test: TestDto): void {
    if (!test.id) {
      this.addError('GET /api/Test/GetTestById/{id}', new Error('Test id is missing.'));
      return;
    }

    this.loadingDetailsId.set(test.id);

    this.labApi
      .getTestById(test.id)
      .pipe(finalize(() => this.loadingDetailsId.set(null)))
      .subscribe({
        next: (detailedTest) => this.detailedTest.set(detailedTest),
        error: (error: unknown) => this.addError('GET /api/Test/GetTestById/{id}', error)
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedTest = this.selectedTest();
    const request = selectedTest?.id
      ? this.labApi.updateTest(selectedTest.id, this.updatePayload())
      : this.labApi.createTest(this.createPayload());

    this.saving.set(true);
    this.message.set(null);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.set(selectedTest ? this.i18n.t('tests.savedUpdate') : this.i18n.t('tests.savedCreate'));
        this.startCreate();
        this.refresh();
      },
      error: (error: unknown) => this.addError(selectedTest ? 'PATCH /api/Test/UpdateTest/{id}' : 'POST /api/Test/CreateTest', error)
    });
  }

  statusLabel(status: TestStatus | undefined): string {
    return status ? this.i18n.t(`tests.status.${status}`) : '-';
  }

  endpointErrors(): readonly string[] {
    return this.errors();
  }

  private createPayload(): TestCreateDto {
    const value = this.form.getRawValue();

    return {
      sampleId: value.sampleId,
      testTypeId: value.testTypeId,
      subject: value.subject.trim(),
      testedAt: value.testedAt ? this.toIsoDate(value.testedAt) : null,
      comment: value.comment.trim() || null
    };
  }

  private updatePayload(): TestUpdatedDto {
    const value = this.form.getRawValue();

    return {
      testStatus: value.testStatus,
      testTypeId: value.testTypeId || null,
      comment: value.comment.trim() || null
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

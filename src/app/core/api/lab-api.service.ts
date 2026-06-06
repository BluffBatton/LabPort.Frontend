import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ContainerDto,
  ContainerReadingStatsDto,
  ContainerUpdateDto,
  AlertDto,
  SensorReadingCreateDto,
  SensorReadingDto,
  SampleCreateDto,
  SampleDto,
  SampleUpdateDto,
  SourceCreateDto,
  SourceDto,
  SourceTypeDto,
  SourceUpdateDto,
  TestCreateDto,
  TestDto,
  TestResultCreateDto,
  TestTypeDto,
  TestUpdatedDto,
  TestResultDto
} from './api.models';
import { LabportApiService } from './labport-api.service';

@Injectable({
  providedIn: 'root'
})
export class LabApiService {
  private readonly api = inject(LabportApiService);
  private readonly http = inject(HttpClient);

  getContainerReadingStats(): Observable<ContainerReadingStatsDto> {
    return this.http.get<ContainerReadingStatsDto>(this.api.endpointUrl('statistics', 'containerReadings'));
  }

  getContainer(): Observable<ContainerDto> {
    return this.http.get<ContainerDto>(this.api.endpointUrl('container', 'current'));
  }

  updateContainer(container: ContainerUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('container', 'update'), container);
  }

  getSamples(): Observable<SampleDto[]> {
    return this.http.get<SampleDto[]>(this.api.endpointUrl('sample', 'list'));
  }

  getSampleById(id: string): Observable<SampleDto> {
    return this.http.get<SampleDto>(this.api.endpointUrl('sample', 'byId', { Id: id }));
  }

  createSample(sample: SampleCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('sample', 'create'), sample);
  }

  updateSample(id: string, sample: SampleUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('sample', 'update', { id }), sample);
  }

  deleteSample(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('sample', 'delete', { id }));
  }

  getSources(): Observable<SourceDto[]> {
    return this.http.get<SourceDto[]>(this.api.endpointUrl('source', 'list'));
  }

  getSourceById(id: string): Observable<SourceDto> {
    return this.http.get<SourceDto>(this.api.endpointUrl('source', 'byId', { Id: id }));
  }

  createSource(source: SourceCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('source', 'create'), source);
  }

  updateSource(id: string, source: SourceUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('source', 'update', { Id: id }), source);
  }

  deleteSource(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('source', 'delete', { Id: id }));
  }

  getSourceTypes(): Observable<SourceTypeDto[]> {
    return this.http.get<SourceTypeDto[]>(this.api.endpointUrl('sourceType', 'list'));
  }

  getTests(): Observable<TestDto[]> {
    return this.http.get<TestDto[]>(this.api.endpointUrl('test', 'list'));
  }

  getTestById(id: string): Observable<TestDto> {
    return this.http.get<TestDto>(this.api.endpointUrl('test', 'byId', { id }));
  }

  createTest(test: TestCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('test', 'create'), test);
  }

  updateTest(id: string, test: TestUpdatedDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('test', 'update', { id }), test);
  }

  getTestTypes(): Observable<TestTypeDto[]> {
    return this.http.get<TestTypeDto[]>(this.api.endpointUrl('test', 'testTypes'));
  }

  getTestResults(): Observable<TestResultDto[]> {
    return this.http.get<TestResultDto[]>(this.api.endpointUrl('testResult', 'list'));
  }

  getTestResultById(id: string): Observable<TestResultDto> {
    return this.http.get<TestResultDto>(this.api.endpointUrl('testResult', 'byId', { id }));
  }

  createTestResult(testResult: TestResultCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('testResult', 'create'), testResult);
  }

  getSensorReadings(take: number): Observable<SensorReadingDto[]> {
    return this.http.get<SensorReadingDto[]>(this.api.endpointUrl('sensorReading', 'list', { take }));
  }

  getSensorReadingById(id: string): Observable<SensorReadingDto> {
    return this.http.get<SensorReadingDto>(this.api.endpointUrl('sensorReading', 'byId', { Id: id }));
  }

  createSensorReading(sensorReading: SensorReadingCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('sensorReading', 'create'), sensorReading);
  }

  getAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(this.api.endpointUrl('alert', 'list'));
  }

  getAlertById(id: string): Observable<AlertDto> {
    return this.http.get<AlertDto>(this.api.endpointUrl('alert', 'byId', { Id: id }));
  }

  markAlertAsRead(id: string): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('alert', 'markAsRead', { id }), {});
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('alert', 'delete', { id }));
  }
}

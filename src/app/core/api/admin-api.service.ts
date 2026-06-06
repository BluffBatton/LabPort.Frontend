import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdminStatisticsDto,
  SettingsBackupDto,
  SettingsBackupImportResultDto,
  SourceTypeCreateDto,
  SourceTypeDto,
  SourceTypeUpdateDto,
  TestTypeCreateDto,
  TestTypeDto,
  TestTypeUpdateDto,
  UserRoleUpdateDto,
  UserDto
} from './api.models';
import { LabportApiService } from './labport-api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly api = inject(LabportApiService);
  private readonly http = inject(HttpClient);

  getStatistics(days = 7): Observable<AdminStatisticsDto> {
    return this.http.get<AdminStatisticsDto>(this.api.endpointUrl('admin', 'dashboard', {}, { days }));
  }

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.api.endpointUrl('admin', 'users'));
  }

  exportUsersReport(from?: string | null, to?: string | null): Observable<Blob> {
    return this.http.get(this.api.endpointUrl('admin', 'usersReport', {}, { from, to }), {
      responseType: 'blob'
    });
  }

  updateUserRole(id: string, role: UserRoleUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('admin', 'updateUserRole', { id }), role);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('admin', 'deleteUser', { id }));
  }

  getSourceTypes(): Observable<SourceTypeDto[]> {
    return this.http.get<SourceTypeDto[]>(this.api.endpointUrl('sourceType', 'list'));
  }

  createSourceType(sourceType: SourceTypeCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('admin', 'createSourceType'), sourceType);
  }

  updateSourceType(id: string, sourceType: SourceTypeUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('admin', 'updateSourceType', { id }), sourceType);
  }

  deleteSourceType(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('admin', 'deleteSourceType', { id }));
  }

  getTestTypes(): Observable<TestTypeDto[]> {
    return this.http.get<TestTypeDto[]>(this.api.endpointUrl('test', 'testTypes'));
  }

  createTestType(testType: TestTypeCreateDto): Observable<void> {
    return this.http.post<void>(this.api.endpointUrl('admin', 'createTestType'), testType);
  }

  updateTestType(id: string, testType: TestTypeUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('admin', 'updateTestType', { id }), testType);
  }

  deleteTestType(id: string): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('admin', 'deleteTestType', { id }));
  }

  exportSettingsBackup(): Observable<SettingsBackupDto> {
    return this.http.get<SettingsBackupDto>(this.api.endpointUrl('admin', 'exportSettingsBackup'));
  }

  importSettingsBackup(backup: SettingsBackupDto): Observable<SettingsBackupImportResultDto> {
    return this.http.post<SettingsBackupImportResultDto>(this.api.endpointUrl('admin', 'importSettingsBackup'), backup);
  }
}

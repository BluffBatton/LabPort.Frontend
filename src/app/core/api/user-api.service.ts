import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserDto, UserPasswordUpdateDto, UserUpdateDto } from './api.models';
import { LabportApiService } from './labport-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly api = inject(LabportApiService);
  private readonly http = inject(HttpClient);

  getMyProfile(): Observable<UserDto> {
    return this.http.get<UserDto>(this.api.endpointUrl('user', 'profile'));
  }

  updateMyProfile(profile: UserUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('user', 'updateProfile'), profile);
  }

  updateMyPassword(password: UserPasswordUpdateDto): Observable<void> {
    return this.http.patch<void>(this.api.endpointUrl('user', 'updatePassword'), password);
  }

  deleteMyProfile(): Observable<void> {
    return this.http.delete<void>(this.api.endpointUrl('user', 'deleteProfile'));
  }
}

export type Role = 'user' | 'admin' | 'User' | 'Admin';
export type BackendRole = 'User' | 'Admin';

export interface UserInfoDto {
  readonly id?: string;
  readonly role?: Role;
}

export interface UserDto {
  readonly id?: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly email?: string | null;
  readonly phoneNumber?: string | null;
  readonly role?: Role;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly lastLoginAt?: string | null;
}

export interface UserUpdateDto {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly email?: string | null;
  readonly phoneNumber?: string | null;
}

export interface UserRoleUpdateDto {
  readonly role: BackendRole;
}

export interface UserPasswordUpdateDto {
  readonly currentPassword?: string | null;
  readonly newPassword?: string | null;
}

export interface ReadingPointDto {
  readonly time?: string;
  readonly temperature?: number;
  readonly humidity?: number;
}

export type ReadingStatsRange = 'hour' | 'day' | 'last7days';

export type LidPosition = 'open' | 'closed';

export interface SensorReadingDto {
  readonly id?: string;
  readonly temperature?: number;
  readonly humidity?: number;
  readonly createdAt?: string;
  readonly lidPosition?: LidPosition;
}

export interface SensorReadingCreateDto {
  readonly deviceKey?: string | null;
  readonly temperature?: number | null;
  readonly humidity?: number | null;
  readonly lidPosition?: LidPosition | null;
}

export interface AlertDto {
  readonly id?: string;
  readonly message?: string | null;
  readonly details?: string | null;
  readonly isRead?: boolean;
  readonly createdAt?: string;
  readonly readAt?: string | null;
  readonly sensorReadingId?: string;
}

export interface ContainerReadingStatsDto {
  readonly containerId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly tempMin?: number | null;
  readonly tempMax?: number | null;
  readonly tempAvg?: number | null;
  readonly humMin?: number | null;
  readonly humMax?: number | null;
  readonly humAvg?: number | null;
  readonly points?: readonly ReadingPointDto[] | null;
}

export interface ContainerDto {
  readonly id?: string;
  readonly label?: string | null;
  readonly temperatureMin?: number;
  readonly temperatureMax?: number;
  readonly humidityMin?: number;
  readonly humidityMax?: number;
}

export interface ContainerCreateDto {
  readonly label?: string | null;
  readonly temperatureMin?: number | null;
  readonly temperatureMax?: number | null;
  readonly humidityMin?: number | null;
  readonly humidityMax?: number | null;
  readonly userId?: string;
}

export interface ContainerUpdateDto {
  readonly temperatureMin?: number | null;
  readonly temperatureMax?: number | null;
  readonly humidityMin?: number | null;
  readonly humidityMax?: number | null;
}

export interface AuthResponseDto {
  readonly accessToken?: string | null;
  readonly refreshToken?: string | null;
  readonly expiresAt?: string;
  readonly user?: UserInfoDto;
}

export interface RefreshTokenDto {
  readonly accessToken?: string | null;
  readonly refreshToken?: string | null;
}

export interface UserCreateDto {
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly email?: string | null;
  readonly phoneNumber?: string | null;
  readonly role?: Role;
  readonly passwordHash?: string | null;
}

export interface RegisterDto {
  readonly user?: UserCreateDto;
  readonly container?: ContainerCreateDto;
}

export interface AdminStatisticsDto {
  readonly totalUsers?: number;
  readonly activeUsersLastNDays?: number;
  readonly totalSamples?: number;
  readonly totalTests?: number;
  readonly totalAlerts?: number;
  readonly daysWindow?: number;
}

export interface SampleDto {
  readonly id?: string;
  readonly name?: string | null;
  readonly collectedAt?: string;
  readonly containerId?: string;
  readonly containerOwnerFullName?: string | null;
  readonly sourceId?: string;
  readonly sourceName?: string | null;
}

export interface SampleCreateDto {
  readonly name?: string | null;
  readonly collectedAt?: string;
  readonly containerId?: string;
  readonly sourceId?: string;
}

export interface SampleUpdateDto {
  readonly name?: string | null;
  readonly collectedAt?: string | null;
  readonly sourceId?: string | null;
}

export interface SourceDto {
  readonly id?: string;
  readonly name?: string | null;
  readonly note?: string | null;
  readonly location?: string | null;
  readonly contactInfo?: string | null;
  readonly sourceTypeId?: string;
  readonly sourceTypeName?: string | null;
}

export interface SourceCreateDto {
  readonly name?: string | null;
  readonly note?: string | null;
  readonly location?: string | null;
  readonly contactInfo?: string | null;
  readonly sourceTypeId?: string;
}

export interface SourceUpdateDto {
  readonly name?: string | null;
  readonly note?: string | null;
  readonly location?: string | null;
  readonly contactInfo?: string | null;
  readonly sourceTypeId?: string | null;
}

export interface SourceTypeDto {
  readonly id?: string;
  readonly name?: string | null;
}

export interface SourceTypeCreateDto {
  readonly name?: string | null;
}

export interface SourceTypeUpdateDto {
  readonly name?: string | null;
}

export interface TestDto {
  readonly id?: string;
  readonly testedAt?: string;
  readonly subject?: string | null;
  readonly testStatus?: TestStatus;
  readonly comment?: string | null;
  readonly sampleId?: string;
  readonly sampleName?: string | null;
  readonly testTypeId?: string;
  readonly testTypeName?: string | null;
}

export type TestStatus = 'await' | 'started' | 'done';

export interface TestCreateDto {
  readonly sampleId?: string;
  readonly testTypeId?: string;
  readonly subject?: string | null;
  readonly testedAt?: string | null;
  readonly comment?: string | null;
}

export interface TestUpdatedDto {
  readonly testStatus?: TestStatus;
  readonly comment?: string | null;
  readonly testTypeId?: string | null;
}

export interface TestTypeDto {
  readonly id?: string;
  readonly name?: string | null;
  readonly referenceMin?: number | null;
  readonly referenceMax?: number | null;
  readonly unit?: string | null;
}

export interface TestTypeCreateDto {
  readonly name?: string | null;
  readonly referenceMin?: number | null;
  readonly referenceMax?: number | null;
  readonly unit?: string | null;
}

export interface TestTypeUpdateDto {
  readonly name?: string | null;
  readonly referenceMin?: number | null;
  readonly referenceMax?: number | null;
  readonly unit?: string | null;
}

export interface SettingsBackupSourceTypeDto {
  readonly name?: string | null;
}

export interface SettingsBackupTestTypeDto {
  readonly name?: string | null;
  readonly referenceMin?: number | null;
  readonly referenceMax?: number | null;
  readonly unit?: string | null;
}

export interface SettingsBackupDto {
  readonly exportedAt?: string;
  readonly sourceTypes?: readonly SettingsBackupSourceTypeDto[];
  readonly testTypes?: readonly SettingsBackupTestTypeDto[];
}

export interface SettingsBackupImportResultDto {
  readonly createdSourceTypes?: number;
  readonly skippedSourceTypes?: number;
  readonly createdTestTypes?: number;
  readonly skippedTestTypes?: number;
}

export interface TestResultDto {
  readonly id?: string;
  readonly name?: string | null;
  readonly performedAt?: string;
  readonly valueNumeric?: number | null;
  readonly valueText?: string | null;
  readonly unit?: string | null;
  readonly resultStatus?: ResultStatus;
  readonly note?: string | null;
  readonly testId?: string;
  readonly testSubject?: string | null;
}

export type ResultStatus = 'expected' | 'unexpected' | 'failed' | 'pending';

export interface TestResultCreateDto {
  readonly testId?: string;
  readonly name?: string | null;
  readonly performedAt?: string | null;
  readonly valueNumeric?: number | null;
  readonly valueText?: string | null;
  readonly unit?: string | null;
  readonly resultStatus?: ResultStatus;
  readonly note?: string | null;
}

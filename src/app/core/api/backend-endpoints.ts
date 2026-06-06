export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface BackendEndpointDefinition {
  readonly method: HttpMethod;
  readonly path: string | null;
  readonly todo: string;
}

const missingEndpointTodo = 'Server support is not available for this feature yet.';
const implementationPendingTodo = 'This feature is available through the LabPort service.';

export const BACKEND_ENDPOINTS = {
  auth: {
    login: {
      method: 'POST',
      path: '/api/Auth/Login',
      todo: implementationPendingTodo
    },
    refresh: {
      method: 'POST',
      path: '/api/Auth/RefreshToken',
      todo: implementationPendingTodo
    },
    register: {
      method: 'POST',
      path: '/api/Auth/Register',
      todo: implementationPendingTodo
    },
    currentUser: {
      method: 'GET',
      path: '/api/User/GetMyProfile',
      todo: implementationPendingTodo
    }
  },
  lab: {
    dashboard: {
      method: 'GET',
      path: '/api/Statistics/GetContainerReadingsStats',
      todo: implementationPendingTodo
    },
    samples: {
      method: 'GET',
      path: '/api/Sample/GetAllSamples',
      todo: implementationPendingTodo
    },
    orders: {
      method: 'GET',
      path: null,
      todo: missingEndpointTodo
    },
    results: {
      method: 'GET',
      path: '/api/TestResult/GetAllTestResults',
      todo: implementationPendingTodo
    },
    reports: {
      method: 'GET',
      path: null,
      todo: missingEndpointTodo
    }
  },
  admin: {
    dashboard: {
      method: 'GET',
      path: '/api/Admin/GetStatistics',
      todo: implementationPendingTodo
    },
    users: {
      method: 'GET',
      path: '/api/Admin/GetAllUsers',
      todo: implementationPendingTodo
    },
    roles: {
      method: 'GET',
      path: null,
      todo: missingEndpointTodo
    },
    dictionaries: {
      method: 'GET',
      path: '/api/SourceType/GetAllSourceTypes',
      todo: implementationPendingTodo
    },
    audit: {
      method: 'GET',
      path: null,
      todo: missingEndpointTodo
    },
    usersReport: {
      method: 'GET',
      path: '/api/Admin/ExportUsersReport/export/users',
      todo: implementationPendingTodo
    },
    updateUserRole: {
      method: 'PATCH',
      path: '/api/Admin/UpdateUserRole/{id}',
      todo: implementationPendingTodo
    },
    deleteUser: {
      method: 'DELETE',
      path: '/api/Admin/DeleteUser/{id}',
      todo: implementationPendingTodo
    },
    createSourceType: {
      method: 'POST',
      path: '/api/Admin/CreateSourceType',
      todo: implementationPendingTodo
    },
    updateSourceType: {
      method: 'PATCH',
      path: '/api/Admin/UpdateSourceType/{id}',
      todo: implementationPendingTodo
    },
    deleteSourceType: {
      method: 'DELETE',
      path: '/api/Admin/DeleteSourceType/{id}',
      todo: implementationPendingTodo
    },
    createTestType: {
      method: 'POST',
      path: '/api/Admin/CreateTestType',
      todo: implementationPendingTodo
    },
    updateTestType: {
      method: 'PATCH',
      path: '/api/Admin/UpdateTestType/{id}',
      todo: implementationPendingTodo
    },
    deleteTestType: {
      method: 'DELETE',
      path: '/api/Admin/DeleteTestType/{id}',
      todo: implementationPendingTodo
    },
    exportSettingsBackup: {
      method: 'GET',
      path: '/api/Admin/ExportSettingsBackup',
      todo: implementationPendingTodo
    },
    importSettingsBackup: {
      method: 'POST',
      path: '/api/Admin/ImportSettingsBackup',
      todo: implementationPendingTodo
    }
  },
  user: {
    profile: {
      method: 'GET',
      path: '/api/User/GetMyProfile',
      todo: implementationPendingTodo
    },
    updateProfile: {
      method: 'PATCH',
      path: '/api/User/UpdateMyProfile',
      todo: implementationPendingTodo
    },
    updatePassword: {
      method: 'PATCH',
      path: '/api/User/UpdateMyPassword',
      todo: implementationPendingTodo
    },
    deleteProfile: {
      method: 'DELETE',
      path: '/api/User/DeleteMyProfile',
      todo: implementationPendingTodo
    }
  },
  sample: {
    list: {
      method: 'GET',
      path: '/api/Sample/GetAllSamples',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/Sample/GetSampleById/{Id}',
      todo: implementationPendingTodo
    },
    create: {
      method: 'POST',
      path: '/api/Sample/CreateSample',
      todo: implementationPendingTodo
    },
    update: {
      method: 'PATCH',
      path: '/api/Sample/UpdateSample/{id}',
      todo: implementationPendingTodo
    },
    delete: {
      method: 'DELETE',
      path: '/api/Sample/DeleteSample/{id}',
      todo: implementationPendingTodo
    }
  },
  source: {
    list: {
      method: 'GET',
      path: '/api/Source/GetAllSources',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/Source/GetSourceById/{Id}',
      todo: implementationPendingTodo
    },
    create: {
      method: 'POST',
      path: '/api/Source/CreateSource',
      todo: implementationPendingTodo
    },
    update: {
      method: 'PATCH',
      path: '/api/Source/UpdateSource/{Id}',
      todo: implementationPendingTodo
    },
    delete: {
      method: 'DELETE',
      path: '/api/Source/DeleteSource/{Id}',
      todo: implementationPendingTodo
    }
  },
  test: {
    list: {
      method: 'GET',
      path: '/api/Test/GetAllTests',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/Test/GetTestById/{id}',
      todo: implementationPendingTodo
    },
    create: {
      method: 'POST',
      path: '/api/Test/CreateTest',
      todo: implementationPendingTodo
    },
    update: {
      method: 'PATCH',
      path: '/api/Test/UpdateTest/{id}',
      todo: implementationPendingTodo
    },
    testTypes: {
      method: 'GET',
      path: '/api/Test/GetTestTypeQuery',
      todo: implementationPendingTodo
    }
  },
  testResult: {
    list: {
      method: 'GET',
      path: '/api/TestResult/GetAllTestResults',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/TestResult/GetTestResultById/{id}',
      todo: implementationPendingTodo
    },
    create: {
      method: 'POST',
      path: '/api/TestResult/CreateTestResult',
      todo: implementationPendingTodo
    }
  },
  container: {
    current: {
      method: 'GET',
      path: '/api/Container/GetContainer',
      todo: implementationPendingTodo
    },
    update: {
      method: 'PATCH',
      path: '/api/Container/UpdateContainer',
      todo: implementationPendingTodo
    }
  },
  sensorReading: {
    list: {
      method: 'GET',
      path: '/api/SensorReading/GetAllSensorReadings/{take}',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/SensorReading/GetSensorReadingById/{Id}',
      todo: implementationPendingTodo
    },
    create: {
      method: 'POST',
      path: '/api/SensorReading/CreateSensor',
      todo: implementationPendingTodo
    }
  },
  sensor: {
    toggleLid: {
      method: 'POST',
      path: '/api/Sensor/ToggleLid',
      todo: implementationPendingTodo
    }
  },
  alert: {
    list: {
      method: 'GET',
      path: '/api/Alert/GetAllAlerts',
      todo: implementationPendingTodo
    },
    byId: {
      method: 'GET',
      path: '/api/Alert/GetAlertById/{Id}',
      todo: implementationPendingTodo
    },
    markAsRead: {
      method: 'PATCH',
      path: '/api/Alert/MarkAsRead/{id}',
      todo: implementationPendingTodo
    },
    delete: {
      method: 'DELETE',
      path: '/api/Alert/DeleteAlert/{id}',
      todo: implementationPendingTodo
    }
  },
  sourceType: {
    list: {
      method: 'GET',
      path: '/api/SourceType/GetAllSourceTypes',
      todo: implementationPendingTodo
    }
  },
  statistics: {
    containerReadings: {
      method: 'GET',
      path: '/api/Statistics/GetContainerReadingsStats',
      todo: implementationPendingTodo
    }
  }
} as const;

export type BackendEndpointArea = keyof typeof BACKEND_ENDPOINTS;

# LabPort.Web

Angular SPA frontend for the LabPort field laboratory diagnostics system.

LabPort.Web supports laboratory sample registration, source management, test and result workflows, sensor/container monitoring, alerts, profile actions, and administration screens through the documented LabPort.Backend REST API.

## Technologies

- Angular
- TypeScript
- Angular Material
- Angular Router
- Reactive Forms
- SCSS
- JWT authentication
- REST API services

## Install

```bash
npm install
```

## Configure API Base URL

Set the backend URL in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Example:

```ts
export const environment = {
  apiBaseUrl: 'https://your-labport-backend.example.com'
};
```

The frontend appends documented paths such as `/api/Auth/Login`, `/api/Sample/GetAllSamples`, and `/api/SensorReading/GetAllSensorReadings/1`.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4200/`.

## Build

```bash
npm run build
```

## Lab Assistant Features

- JWT login and protected lab routes.
- Samples list, create, edit, delete, and details.
- Sources list, create, edit, delete, and details.
- Container thresholds and latest sensor reading.
- Sensor readings list and create action.
- Alerts list and details as read-only backend data.
- Tests list, create, update status/comment/type, and details.
- Test results list, create, and details.
- Profile page showing useful user information only.

Technical IDs are kept only in TypeScript for routing, edit/delete actions, and API requests.

## Admin Features

- Protected admin layout with role guard.
- Users table and users CSV export.
- Test type create/delete through Admin endpoints.
- Source type create/delete through Admin endpoints.
- Admin statistics overview.
- Data management page with users CSV export.
- Disabled backup/import placeholders where backend endpoint support is missing.

## Localization

Supported languages:

- Ukrainian (`uk`) by default.
- English (`en`).

The selected language is stored in `localStorage`. Dates are formatted with `uk-UA` for Ukrainian and `en-US` for English. Text lists use locale-aware `localeCompare` sorting.

## Known Limitations

- Full database backup/import is not supported by the backend yet, so those actions are visible but disabled.
- Admin user deletion and role changes are not implemented because backend endpoints are not documented.
- Alert mark-as-read/delete is disabled because the backend currently exposes read-only alert endpoints.
- Lab orders and lab reports remain placeholders until matching backend endpoints exist.
- Source type and test type update actions are not implemented because only create/delete endpoints are documented.
- Test delete and test result update/delete are not implemented because those backend endpoints are missing.

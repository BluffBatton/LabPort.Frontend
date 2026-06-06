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

The frontend appends documented paths such as `/api/Auth/Login`, `/api/Sample/GetAllSamples`, `/api/SensorReading/GetAllSensorReadings/1`, and `/api/Sensor/ToggleLid`.

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

- JWT login and protected lab routes, with `/login` and `/auth/login` entry points.
- Samples list, create, edit, delete, and details.
- Sources list, create, edit, delete, and details.
- Container thresholds, latest sensor reading, IoT lid toggle, and dashboard reading range selector.
- Sensor readings list and create action.
- Alerts list, details, mark-as-read, and delete actions.
- Tests list, create, update status/comment/type, and details.
- Test results list, create, and details.
- Profile page showing useful user information only.

Technical IDs are kept only in TypeScript for routing, edit/delete actions, and API requests.

## Admin Features

- Protected admin layout with role guard.
- Users table, role update, delete, and users CSV export.
- Test type create/edit/delete through Admin endpoints at `/admin/test-types`.
- Source type create/edit/delete through Admin endpoints at `/admin/source-types`.
- Admin statistics overview.
- Data management page with users CSV export and JSON settings backup/import.

## Localization

Supported languages:

- Ukrainian (`uk`) by default.
- English (`en`).

The selected language is stored in `localStorage`. Dates are formatted with `uk-UA` for Ukrainian and `en-US` for English. Text lists use locale-aware `localeCompare` sorting.

## Known Limitations

- Full physical database backup/restore is not implemented; the frontend currently supports settings backup/import for source types and test types.
- Lab orders and lab reports remain placeholders until matching backend endpoints exist.
- Dedicated admin roles and audit-log pages remain placeholders until matching backend endpoints exist.
- Sensor reading update/delete, test delete, and test result update/delete are not implemented because those backend endpoints are missing.

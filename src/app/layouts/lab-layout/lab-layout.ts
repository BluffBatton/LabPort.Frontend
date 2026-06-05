import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, of } from 'rxjs';

import { UserApiService } from '../../core/api/user-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LocalizationService } from '../../core/localization/localization.service';
import { SupportedLocale, TranslationKey } from '../../core/localization/translations';

interface NavItem {
  readonly path: string;
  readonly labelKey: TranslationKey;
  readonly captionKey: TranslationKey;
}

@Component({
  selector: 'app-lab-layout',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatListModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './lab-layout.html',
  styleUrl: './lab-layout.scss'
})
export class LabLayout {
  readonly auth = inject(AuthService);
  readonly i18n = inject(LocalizationService);
  readonly profile = toSignal(
    inject(UserApiService)
      .getMyProfile()
      .pipe(catchError(() => of(null))),
    { initialValue: null }
  );

  readonly navItems: readonly NavItem[] = [
    { path: '/lab/dashboard', labelKey: 'nav.lab.dashboard', captionKey: 'nav.lab.dashboard.caption' },
    { path: '/lab/container', labelKey: 'nav.lab.container', captionKey: 'nav.lab.container.caption' },
    { path: '/lab/readings', labelKey: 'nav.lab.readings', captionKey: 'nav.lab.readings.caption' },
    { path: '/lab/alerts', labelKey: 'nav.lab.alerts', captionKey: 'nav.lab.alerts.caption' },
    { path: '/lab/samples', labelKey: 'nav.lab.samples', captionKey: 'nav.lab.samples.caption' },
    { path: '/lab/sources', labelKey: 'nav.lab.sources', captionKey: 'nav.lab.sources.caption' },
    { path: '/lab/tests', labelKey: 'nav.lab.tests', captionKey: 'nav.lab.tests.caption' },
    { path: '/lab/orders', labelKey: 'nav.lab.orders', captionKey: 'nav.lab.orders.caption' },
    { path: '/lab/results', labelKey: 'nav.lab.results', captionKey: 'nav.lab.results.caption' },
    { path: '/lab/reports', labelKey: 'nav.lab.reports', captionKey: 'nav.lab.reports.caption' },
    { path: '/lab/profile', labelKey: 'nav.lab.profile', captionKey: 'nav.lab.profile.caption' }
  ];

  private readonly router = inject(Router);

  sessionLabel(): string {
    const profile = this.profile();

    if (profile) {
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      return fullName || profile.email || 'JWT session';
    }

    const session = this.auth.session();
    return session?.displayName ?? 'JWT session';
  }

  setLocale(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}

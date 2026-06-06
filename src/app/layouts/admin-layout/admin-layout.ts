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
  selector: 'app-admin-layout',
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
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  readonly auth = inject(AuthService);
  readonly i18n = inject(LocalizationService);
  readonly profile = toSignal(
    inject(UserApiService)
      .getMyProfile()
      .pipe(catchError(() => of(null))),
    { initialValue: null }
  );

  readonly navItems: readonly NavItem[] = [
    { path: '/admin/dashboard', labelKey: 'nav.admin.dashboard', captionKey: 'nav.admin.dashboard.caption' },
    { path: '/admin/users', labelKey: 'nav.admin.users', captionKey: 'nav.admin.users.caption' },
    { path: '/admin/roles', labelKey: 'nav.admin.roles', captionKey: 'nav.admin.roles.caption' },
    { path: '/admin/source-types', labelKey: 'nav.admin.sourceTypes', captionKey: 'nav.admin.sourceTypes.caption' },
    { path: '/admin/test-types', labelKey: 'nav.admin.testTypes', captionKey: 'nav.admin.testTypes.caption' },
    { path: '/admin/data-management', labelKey: 'nav.admin.dataManagement', captionKey: 'nav.admin.dataManagement.caption' },
    { path: '/admin/audit', labelKey: 'nav.admin.audit', captionKey: 'nav.admin.audit.caption' },
    { path: '/admin/profile', labelKey: 'nav.admin.profile', captionKey: 'nav.admin.profile.caption' }
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

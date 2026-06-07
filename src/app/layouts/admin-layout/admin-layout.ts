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
    { path: '/admin/dashboard', labelKey: 'nav.admin.dashboard' },
    { path: '/admin/users', labelKey: 'nav.admin.users' },
    { path: '/admin/source-types', labelKey: 'nav.admin.sourceTypes' },
    { path: '/admin/test-types', labelKey: 'nav.admin.testTypes' },
    { path: '/admin/data-management', labelKey: 'nav.admin.dataManagement' }
  ];

  private readonly router = inject(Router);

  sessionLabel(): string {
    const profile = this.profile();

    if (profile) {
      const fullName = this.uniqueName(profile.firstName, profile.lastName);
      return fullName || profile.email || '';
    }

    const session = this.auth.session();
    return session?.displayName ?? '';
  }

  setLocale(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }

  private uniqueName(firstName: string | null | undefined, lastName: string | null | undefined): string {
    const parts = [firstName, lastName].filter(Boolean) as string[];
    const uniqueParts = parts.filter((part, index) => {
      return parts.findIndex((candidate) => candidate.localeCompare(part, undefined, { sensitivity: 'base' }) === 0) === index;
    });

    return uniqueParts.join(' ');
  }
}

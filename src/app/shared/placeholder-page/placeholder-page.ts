import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';

import { LabportApiService } from '../../core/api/labport-api.service';
import { LocalizationService } from '../../core/localization/localization.service';
import { TranslationKey } from '../../core/localization/translations';

interface PlaceholderRouteData {
  readonly eyebrowKey?: TranslationKey;
  readonly titleKey?: TranslationKey;
  readonly descriptionKey?: TranslationKey;
  readonly endpointArea?: string;
  readonly endpointName?: string;
}

@Component({
  selector: 'app-placeholder-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule],
  templateUrl: './placeholder-page.html',
  styleUrl: './placeholder-page.scss'
})
export class PlaceholderPage {
  readonly i18n = inject(LocalizationService);

  private readonly api = inject(LabportApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data
  });

  data(): PlaceholderRouteData {
    return this.routeData() as PlaceholderRouteData;
  }

  text(key: TranslationKey | undefined, fallbackKey: TranslationKey): string {
    return this.i18n.t(key ?? fallbackKey);
  }

  endpointStatus(): string {
    const data = this.data();

    if (!data.endpointArea || !data.endpointName) {
      return this.i18n.t('placeholder.endpointMissing');
    }

    if (this.api.isAvailable(data.endpointArea, data.endpointName)) {
      return this.api.endpointLabel(data.endpointArea, data.endpointName);
    }

    return this.api.unavailableMessage(data.endpointArea, data.endpointName);
  }

  endpointSubtitle(): string {
    const data = this.data();

    if (data.endpointArea && data.endpointName && this.api.isAvailable(data.endpointArea, data.endpointName)) {
      return this.i18n.t('placeholder.endpointAvailable');
    }

    return this.i18n.t('placeholder.endpointMissing');
  }

  implementationStatus(): string {
    const data = this.data();

    if (data.endpointArea && data.endpointName && this.api.isAvailable(data.endpointArea, data.endpointName)) {
      return this.i18n.t('placeholder.implementationPending');
    }

    return this.i18n.t('placeholder.nextStep');
  }

  actionLabel(): string {
    const data = this.data();

    if (data.endpointArea && data.endpointName && this.api.isAvailable(data.endpointArea, data.endpointName)) {
      return this.i18n.t('placeholder.actionPending');
    }

    return this.i18n.t('placeholder.action');
  }
}

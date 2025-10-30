import { Page, expect, Locator } from '@playwright/test';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RetryManager } from '../utils/retry';
import { selectFromGridDropdown, ensureDropdownClosed } from '../utils/ui';
import { Formule, Option, Promo } from '../types/models';

export class CreationClientTunnelPage {
  constructor(private readonly page: Page) {}

  private get boutonCreationClient(): Locator {
    return this.page.locator('#btnCreationClient_CD');
  }

  private get lienCreerClient(): Locator {
    return this.page.getByRole('link', { name: 'Créer un client depuis le' });
  }

  private get boutonEntreprise(): Locator {
    return this.page.getByText('Entreprise', { exact: true });
  }

  private get listeSociete(): Locator {
    return this.page.locator('[id="InnerModel\\.ListSocieteTraitement_I"]');
  }

  private get boutonValiderCreation(): Locator {
    return this.page.locator('#btnValiderCreationClient_CD');
  }

  private get listePromoTunnel(): Locator {
    return this.page.locator('[id="InnerModel\\.ListPromoTunnel_I"]');
  }

  private get zoneOptions(): Locator {
    return this.page.getByRole('group', { name: 'Liste des options' });
  }

  private get zonePromotions(): Locator {
    return this.page.getByRole('group', { name: 'Liste des promotions' });
  }

  public async ouvrirCreationClient(): Promise<void> {
    logger.debug('Ouverture de la création de client');
    await RetryManager.executeWithRetry(
      async () => {
        await this.boutonCreationClient.click();
        await this.lienCreerClient.click();
      },
      'Ouverture création client'
    );
    logger.info('✅ Création de client ouverte');
  }

  public async selectionnerTypeEntreprise(): Promise<void> {
    logger.debug('Sélection du type Entreprise');
    await RetryManager.executeWithRetry(
      async () => {
        await this.boutonEntreprise.click();
      },
      'Sélection type Entreprise'
    );
    logger.info('✅ Type Entreprise sélectionné');
  }

  public async selectionnerSociete(nomSociete: string): Promise<void> {
    logger.debug(`Sélection de la société: ${nomSociete}`);
    await RetryManager.executeWithRetry(
      async () => {
        await selectFromGridDropdown(this.page, this.listeSociete, nomSociete, 10000, 3);
        await this.page.waitForTimeout(1000);
      },
      `Sélection société ${nomSociete}`
    );
    await ensureDropdownClosed(this.page, this.listeSociete);
    logger.info(`✅ Société sélectionnée: ${nomSociete}`);
  }

  public async selectionnerFormule(formule: Formule): Promise<void> {
    logger.debug(`Sélection de la formule: ${formule.Nom}`);
    
    const maxRetries = 3;
    let retryCount = 0;
    let formuleFound = false;

    while (retryCount < maxRetries && !formuleFound) {
      try {
        const radioButton = this.page.locator(`#${formule.RadioId.replace('_I_D', '')}`);
        await expect(radioButton).toContainText(formule.Nom, { ignoreCase: true, timeout: 5000 });

        formuleFound = true;
      } catch (error) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (retryCount >= maxRetries) {
          throw new Error(`Impossible de trouver la formule '${formule.Nom}' après ${maxRetries} tentatives. Dernière erreur: ${errorMessage}`);
        }

        logger.warn(`Tentative ${retryCount}/${maxRetries} échouée pour la formule '${formule.Nom}'. Retry de la sélection de société...`);

        await this.retrySelectionSociete(formule.Societe?.Nom || '');

        await this.page.waitForTimeout(3000);
      }
    }

    await this.page.locator(`#${formule.RadioId}`).click();
    logger.info(`✅ Formule sélectionnée: ${formule.Nom}`);
  }

  private async retrySelectionSociete(nomSociete: string): Promise<void> {
    await selectFromGridDropdown(this.page, this.listeSociete, nomSociete, 10000, 2);
    await ensureDropdownClosed(this.page, this.listeSociete);
    await this.page.waitForTimeout(1000);
  }

  public async selectionnerOption(option: Option): Promise<void> {
    logger.debug(`Sélection de l'option: ${option.Nom}`);
    
    await expect(this.zoneOptions).toBeVisible();

    await this.page.locator(`#${option.RadioId}`).click();
    logger.info(`✅ Option sélectionnée: ${option.Nom}`);
  }

  public async selectionnerPromo(promo: Promo): Promise<void> {
    logger.debug(`Sélection de la promotion: ${promo.Nom}`);
    await expect(this.zonePromotions).toBeVisible();
    await this.listePromoTunnel.click();
    await this.page.waitForTimeout(300);

    const promoElement = this.page.getByRole('cell', { name: promo.Nom, exact: true });
    await expect(promoElement).toBeVisible({ timeout: config.timeoutMs });
    await promoElement.click();

    logger.info(`✅ Promotion sélectionnée: ${promo.Nom}`);
  }

  public async validerCreationEtAttendrePopup(): Promise<Page> {
    logger.debug('Validation de la création et attente de la popup');
    
    const popupPromise = this.page.waitForEvent('popup');
    await this.boutonValiderCreation.click();
    const popup = await popupPromise;
    
    logger.info('✅ Popup ouverte après validation');
    return popup;
  }

  public async verifierUrlPopup(
    popupPage: Page, 
    formule: Formule, 
    selectedOptionCode: string = '', 
    selectedPromoCode: string = '', 
    usePromo: boolean = false
  ): Promise<void> {
    logger.debug('Vérification de l\'URL de la popup');
    
    await popupPage.waitForLoadState('domcontentloaded');

    let expectedUrlBase = `https://site-ulys-ecommerce-trade-beta.azurewebsites.net/?code=${formule.Code}`;

    if (formule.HasOptions && !selectedOptionCode) {
      expectedUrlBase += `&opt=${selectedOptionCode}`;
    }

    let expectedUrl = expectedUrlBase;
    if (usePromo && formule.HasPromos && selectedPromoCode) {
      expectedUrl += `&promo=${selectedPromoCode}`;
    }

    const maxWaitTime = config.timeoutMs;
    const checkInterval = 1000;
    let elapsed = 0;
    let urlMatches = false;
    let currentUrl = '';

    while (elapsed < maxWaitTime && !urlMatches) {
      await this.page.waitForTimeout(checkInterval);
      elapsed += checkInterval;

      currentUrl = popupPage.url();

      const containsCode = currentUrl.includes(`code=${formule.Code}`);
      const containsOption = !formule.HasOptions ||
                           !selectedOptionCode ||
                           currentUrl.includes(`opt=${selectedOptionCode}`);

      let containsPromo = true;
      if (usePromo && formule.HasPromos && selectedPromoCode) {
        containsPromo = currentUrl.includes(`promo=${selectedPromoCode}`);
      } else if (!usePromo && formule.HasPromos) {
        containsPromo = !currentUrl.includes('promo=');
      }

      urlMatches = containsCode && containsOption && containsPromo;

      if (urlMatches) {
        break;
      }
    }

    if (!urlMatches) {
      await popupPage.goto(expectedUrl, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(5000);
      currentUrl = popupPage.url();

      const containsCode = currentUrl.includes(formule.Code);
      const containsOption = !formule.HasOptions ||
                           !selectedOptionCode ||
                           currentUrl.includes(`opt=${selectedOptionCode}`);

      let containsPromo = true;
      if (usePromo && formule.HasPromos && selectedPromoCode) {
        containsPromo = currentUrl.includes(`promo=${selectedPromoCode}`);
      } else if (!usePromo && formule.HasPromos) {
        containsPromo = !currentUrl.includes('promo=');
      }

      urlMatches = containsCode && containsOption && containsPromo;
    }

    if (!urlMatches) {
      throw new Error(`L'URL finale '${currentUrl}' devrait correspondre à l'URL attendue '${expectedUrl}'.`);
    }
    
    logger.info(`✅ URL de la popup vérifiée: ${currentUrl}`);
  }
}

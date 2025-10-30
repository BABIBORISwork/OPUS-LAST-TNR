import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { MainPage } from '../pages/MainPage';
import { CreationClientTunnelPage } from '../pages/CreationClientTunnelPage';
import { logger } from '../utils/logger';
import { config } from '../config';
import { Formule } from '../types/models';
import { getFormulesTestCasesSync } from '../utils/database';

test.describe('Tunnel de création de client', () => {
  const testCases = getFormulesTestCasesSync();

  test('Vérification des cas de test', async () => {
    expect(testCases.length).toBeGreaterThan(0);
    logger.info(`✅ ${testCases.length} cas de test disponibles`);
  });

  testCases.forEach((testCase, index) => {
    test(testCase.testName, async ({ browser }: { browser: Browser }) => {
      const startTime = Date.now();
      let selectedOptionCode = '';
      let selectedPromoCode = '';

      const context = await browser.newContext();
      const page = await context.newPage();
      
      page.setDefaultTimeout(config.timeoutMs);
      page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
      
      const mainPage = new MainPage(page);
      const tunnelPage = new CreationClientTunnelPage(page);

      try {
        logger.info(`🚀 [${index + 1}/${testCases.length}] Début du test: ${testCase.testName}`);
        logger.info(`   Société: ${testCase.societeName}`);
        logger.info(`   Formule: ${testCase.formule.Nom} (${testCase.formule.Code})`);
        logger.info(`   Type: ${testCase.isPro ? 'Pro' : 'Particulier'}`);
        logger.info(`   Promo: ${testCase.usePromo ? 'Oui' : 'Non'}`);

        await mainPage.naviguerVersOpus();

        await tunnelPage.ouvrirCreationClient();

        if (testCase.isPro) {
          await tunnelPage.selectionnerTypeEntreprise();
        }

        await tunnelPage.selectionnerSociete(testCase.societeName);

        await tunnelPage.selectionnerFormule(testCase.formule);

        if (testCase.formule.HasOptions && testCase.formule.Options?.length) {
          const randomIndex = Math.floor(Math.random() * testCase.formule.Options.length);
          const selectedOption = testCase.formule.Options[randomIndex];
          selectedOptionCode = selectedOption.Code;

          await tunnelPage.selectionnerOption(selectedOption);
          logger.info(`   Option sélectionnée: ${selectedOption.Nom} (${selectedOption.Code})`);
        }

        if (testCase.usePromo && testCase.formule.HasPromos && testCase.formule.Promos?.length) {
          const randomIndex = Math.floor(Math.random() * testCase.formule.Promos.length);
          const selectedPromo = testCase.formule.Promos[randomIndex];
          selectedPromoCode = selectedPromo.Code;

          await tunnelPage.selectionnerPromo(selectedPromo);
          logger.info(`   Promo sélectionnée: ${selectedPromo.Nom} (${selectedPromo.Code})`);
        }

        // Validation et attente de la popup
        const popupPage = await tunnelPage.validerCreationEtAttendrePopup();

        // Vérification de l'URL de la popup
        await tunnelPage.verifierUrlPopup(
          popupPage, 
          testCase.formule, 
          selectedOptionCode, 
          selectedPromoCode, 
          testCase.usePromo
        );

        // Fermer la popup
        await popupPage.close();

        // Log de succès
        const duration = Date.now() - startTime;
        const typeFormule = testCase.isPro ? 'Pro' : 'Part';
        const finalOptionText = testCase.formule.HasOptions && selectedOptionCode ? ` avec option ${selectedOptionCode}` : '';
        let finalPromoText = '';
        
        if (testCase.usePromo && testCase.formule.HasPromos && selectedPromoCode) {
          finalPromoText = ` avec code promo ${selectedPromoCode}`;
        } else if (!testCase.usePromo && testCase.formule.HasPromos) {
          finalPromoText = ' SANS code promo';
        }

        logger.info(`✅ [${index + 1}/${testCases.length}] Test réussi pour ${testCase.societeName} - Formule ${typeFormule} ${testCase.formule.Nom} (Code: ${testCase.formule.Code})${finalOptionText}${finalPromoText} - Durée: ${duration}ms`);

      } catch (error) {
        const duration = Date.now() - startTime;
        const typeFormule = testCase.isPro ? 'Pro' : 'Part';
        const promoText = testCase.usePromo ? 'AVEC promo' : 'SANS promo';
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error(`❌ [${index + 1}/${testCases.length}] Test échoué pour ${testCase.societeName} - Formule ${typeFormule} ${testCase.formule.Nom} (${promoText}): ${errorMessage}`);
        logger.error(`   Durée: ${duration}ms`);

        throw error;
      } finally {
        await page.close();
        await context.close();
      }
    });
  });

  // Test pour afficher tous les cas disponibles (utile pour debug)
  test('Afficher les cas de test disponibles', async () => {
    logger.info('=== CAS DE TEST DISPONIBLES ===');
    testCases.forEach((testCase, index) => {
      const typeFormule = testCase.isPro ? 'Pro' : 'Part';
      const promoText = testCase.usePromo ? 'AVEC promo' : 'SANS promo';
      logger.info(`${index + 1}. ${testCase.testName}`);
      logger.info(`   Société: ${testCase.societeName}`);
      logger.info(`   Formule: ${testCase.formule.Nom} (${testCase.formule.Code}) - ${typeFormule}`);
      logger.info(`   Promo: ${promoText}`);
      if (testCase.formule.HasOptions) {
        logger.info(`   Options: ${testCase.formule.Options?.length || 0} disponibles`);
      }
      if (testCase.formule.HasPromos) {
        logger.info(`   Promotions: ${testCase.formule.Promos?.length || 0} disponibles`);
      }
      logger.info('---');
    });
    logger.info(`Total: ${testCases.length} cas de test`);
  });
});
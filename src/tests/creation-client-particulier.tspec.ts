import { test, expect } from '@playwright/test';
import { CreationClientParticulierPage, DonneesClientParticulier } from '../pages/CreationClientParticulierPage';
import { MainPage } from '../pages/MainPage';
import { config } from '../config';
import { logger } from '../utils/logger';
import { openDbForWrite, createClientsTable, generateUniqueRueGrandeAddress, closeDb } from '../utils/sqlite';

test.describe('Création de client particulier depuis OPUS', () => {
  let creationClientPage: CreationClientParticulierPage;
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    creationClientPage = new CreationClientParticulierPage(page);
    mainPage = new MainPage(page);
    
    await mainPage.naviguerVersOpus();
  });

  test('Créer un client particulier depuis OPUS', async ({ page }) => {
    const emailUnique = await CreationClientParticulierPage.genererEmailUnique();
    
    const db = openDbForWrite();
    createClientsTable(db);
    const adresseVoieUnique = generateUniqueRueGrandeAddress(db);
    closeDb(db);
    
    const qualites: ('MADAME' | 'MONSIEUR')[] = ['MADAME', 'MONSIEUR'];
    const qualiteAleatoire = qualites[Math.floor(Math.random() * qualites.length)];
    
    const jour = Math.floor(Math.random() * 28) + 1; 
    const mois = Math.floor(Math.random() * 12) + 1; 
    const dateNaissance = `${jour.toString().padStart(2, '0')}/${mois.toString().padStart(2, '0')}/1969`;

    const donneesClient: DonneesClientParticulier = {
      email: emailUnique,
      qualite: qualiteAleatoire,
      nom: 'ROUBAUD',
      prenom: 'Jeremy',
      adresseVoie: adresseVoieUnique,
      codePostal: '13410',
      localite: 'LAMBESC',
      telephone: '07 53 53 94 11',
      interlocuteurVA: 'BALLY Karine',
      dateNaissance: dateNaissance
    };

    logger.info(`🚀 Début du test de création de client particulier (${qualiteAleatoire}) depuis OPUS`);

    await creationClientPage.ouvrirCreationClientDepuisOpus();

    await creationClientPage.verifierModalCreation();

    await creationClientPage.saisirEmail(donneesClient.email);

    await creationClientPage.verifierModalAvecDonnees(donneesClient.email);

    await creationClientPage.remplirFormulaireClient(donneesClient);

    await creationClientPage.validerCreation();

    await creationClientPage.verifierRedirectionHistorique();

    await creationClientPage.verifierDonneesClient(donneesClient);

    await creationClientPage.sauvegarderClientEnBase(donneesClient);

    await creationClientPage.verifierHistorique();

    logger.info('✅ Test de création de client particulier terminé avec succès');
  });
});

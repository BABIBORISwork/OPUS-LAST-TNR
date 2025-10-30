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
    
    // Navigation initiale via MainPage
    await mainPage.naviguerVersOpus();
  });

  test('Créer un client particulier depuis OPUS', async ({ page }) => {
    // Génération d'un email unique en base
    const emailUnique = await CreationClientParticulierPage.genererEmailUnique();
    
    // Génération d'une adresse unique pour RUE GRANDE 13410 LAMBESC
    const db = openDbForWrite();
    createClientsTable(db);
    const adresseVoieUnique = generateUniqueRueGrandeAddress(db);
    closeDb(db);
    
    // Génération de données aléatoires
    const qualites: ('MADAME' | 'MONSIEUR')[] = ['MADAME', 'MONSIEUR'];
    const qualiteAleatoire = qualites[Math.floor(Math.random() * qualites.length)];
    
    // Génération d'une date de naissance en 1969
    const jour = Math.floor(Math.random() * 28) + 1; // 1-28 pour éviter les problèmes de mois
    const mois = Math.floor(Math.random() * 12) + 1; // 1-12
    const dateNaissance = `${jour.toString().padStart(2, '0')}/${mois.toString().padStart(2, '0')}/1969`;

    // Données de test avec email unique et adresse unique
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

    // 1. Ouvrir la création de client depuis OPUS
    await creationClientPage.ouvrirCreationClientDepuisOpus();

    // 2. Vérifier le modal initial
    await creationClientPage.verifierModalCreation();

    // 3. Saisir l'email
    await creationClientPage.saisirEmail(donneesClient.email);

    // 4. Vérifier le modal avec les données pré-remplies
    await creationClientPage.verifierModalAvecDonnees(donneesClient.email);

    // 5. Remplir le formulaire complet
    await creationClientPage.remplirFormulaireClient(donneesClient);

    // 6. Valider la création
    await creationClientPage.validerCreation();

    // 7. Vérifier la redirection vers l'historique
    await creationClientPage.verifierRedirectionHistorique();

    // 8. Vérifier les données du client créé
    await creationClientPage.verifierDonneesClient(donneesClient);

    // 9. Sauvegarder le client en base de données
    await creationClientPage.sauvegarderClientEnBase(donneesClient);

    // 10. Vérifier l'historique
    await creationClientPage.verifierHistorique();

    logger.info('✅ Test de création de client particulier terminé avec succès');
  });
});

import { Page, expect, Locator } from '@playwright/test';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RetryManager } from '../utils/retry';
import { openDbForWrite, createClientsTable, saveClientData, ClientData, closeDb, generateUniqueEmail } from '../utils/sqlite';

export interface DonneesClientParticulier {
  email: string;
  qualite: 'MADAME' | 'MONSIEUR';
  nom: string;
  prenom: string;
  adresseVoie: string;
  codePostal: string;
  localite: string;
  telephone: string;
  interlocuteurVA: string;
  dateNaissance: string;
}

export class CreationClientParticulierPage {
  constructor(private readonly page: Page) {}

  private get boutonCreationClient(): Locator {
    return this.page.locator('#btnCreationClient_CD');
  }

  private get lienCreerClientDepuisOpus(): Locator {
    return this.page.getByRole('link', { name: 'Créer un client depuis OPUS' });
  }

  private get champEmail(): Locator {
    return this.page.locator('#Email_I');
  }

  private get boutonValiderEmail(): Locator {
    return this.page.locator('#btnValiderCreationMailClient_CD');
  }

  private get modalCreationClient(): Locator {
    return this.page.locator('#popupCreationClient_PW-1');
  }

  private get champQualite(): Locator {
    return this.page.locator('[id="InnerModel.Qualite.Code_I"]');
  }

  private get champNom(): Locator {
    return this.page.locator('[id="InnerModel.Nom"]').getByRole('textbox');
  }

  private get champPrenom(): Locator {
    return this.page.locator('[id="InnerModel.Prenom_I"]');
  }

  private get champAdresseVoie(): Locator {
    return this.page.locator('[id="InnerModel.AdresseVoie_I"]');
  }

  private get champCodePostal(): Locator {
    return this.page.locator('[id="InnerModel.AdresseCodePostal_I"]');
  }

  private get champLocalite(): Locator {
    return this.page.locator('[id="InnerModel.AdresseLocalite_I"]');
  }

  private get champTelephone(): Locator {
    return this.page.locator('[id="InnerModel.Portable_I"]');
  }

  private get champInterlocuteurVA(): Locator {
    return this.page.locator('[id="InnerModel.InterlocuteurVA.Code_I"]');
  }

  private get champDateNaissance(): Locator {
    return this.page.locator('[id="InnerModel.DateNaissance_I"]');
  }

  private get boutonValiderCreation(): Locator {
    return this.page.locator('#btnValiderCreationClient_CD');
  }

  public async ouvrirCreationClientDepuisOpus(): Promise<void> {
    logger.debug('Ouverture de la création de client depuis OPUS');
    await RetryManager.executeWithRetry(
      async () => {
        await this.boutonCreationClient.click();
        await this.lienCreerClientDepuisOpus.click();
      },
      'Ouverture création client depuis OPUS'
    );
    logger.info('✅ Création de client depuis OPUS ouverte');
  }

  public async saisirEmail(email: string): Promise<void> {
    logger.debug(`Saisie de l'email: ${email}`);
    await RetryManager.executeWithRetry(
      async () => {
        await this.champEmail.click();
        await this.champEmail.fill(email);
        await this.boutonValiderEmail.click();
      },
      `Saisie email ${email}`
    );
    logger.info(`✅ Email saisi: ${email}`);
  }

  public async verifierModalCreation(): Promise<void> {
    logger.debug('Vérification du modal de création');
    await expect(this.modalCreationClient).toMatchAriaSnapshot(`
      - text: Créer un compte
      - img "[Fermer]"
      - text: Dénomination
      - table:
        - rowgroup:
          - row "C Particulier U Entreprise U Administration":
            - cell "C Particulier U Entreprise U Administration":
              - table:
                - rowgroup:
                  - row "C Particulier U Entreprise U Administration":
                    - cell "C Particulier":
                      - table:
                        - rowgroup:
                          - row "C Particulier":
                            - cell "C":
                              - textbox: C
                            - cell "Particulier"
                    - cell "U Entreprise":
                      - table:
                        - rowgroup:
                          - row "U Entreprise":
                            - cell "U":
                              - textbox: U
                            - cell "Entreprise"
                    - cell "U Administration":
                      - table:
                        - rowgroup:
                          - row "U Administration":
                            - cell "U":
                              - textbox: U
                            - cell "Administration"
      - text: "Saisissez une adresse email :"
      - table:
        - rowgroup:
          - row "Adresse email* :":
            - cell "Adresse email* :":
              - paragraph: "Adresse email* :"
            - cell
      - table:
        - rowgroup:
          - row "Annuler":
            - cell "Annuler":
              - button
              - table:
                - rowgroup:
                  - row "Annuler":
                    - cell
                    - cell "Annuler"
      - table:
        - rowgroup:
          - row "Submit Suivant":
            - cell "Submit Suivant":
              - button "Submit"
              - table:
                - rowgroup:
                  - row "Suivant":
                    - cell
                    - cell "Suivant"
    `);
    logger.info('✅ Modal de création vérifié');
  }

  public async verifierModalAvecDonnees(email: string): Promise<void> {
    logger.debug('Vérification du modal avec les données pré-remplies');
    await expect(this.modalCreationClient).toMatchAriaSnapshot(`
      - text: Créer un compte
      - img "[Fermer]"
      - group "Dénomination":
        - table:
          - rowgroup:
            - row "C Particulier U Entreprise U Administration":
              - cell "C Particulier U Entreprise U Administration":
                - table:
                  - rowgroup:
                    - row "C Particulier U Entreprise U Administration":
                      - cell "C Particulier":
                        - table:
                          - rowgroup:
                            - row "C Particulier":
                              - cell "C":
                                - textbox: C
                              - cell "Particulier"
                      - cell "U Entreprise":
                        - table:
                          - rowgroup:
                            - row "U Entreprise":
                              - cell "U":
                                - textbox: U
                              - cell "Entreprise"
                      - cell "U Administration":
                        - table:
                          - rowgroup:
                            - row "U Administration":
                              - cell "U":
                                - textbox: U
                              - cell "Administration"
        - table:
          - rowgroup:
            - row "Qualité MADAME v":
              - cell "Qualité"
              - cell "MADAME v":
                - table:
                  - rowgroup:
                    - row "MADAME v":
                      - cell "MADAME":
                        - textbox: MADAME
                      - cell "v":
                        - table:
                          - rowgroup:
                            - row "v":
                              - cell "v":
                                - img "v"
              - cell
              - cell
            - row "Nom * Prénom *":
              - cell "Nom *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell
              - cell "Prénom *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
      - group "Adresse":
        - table:
          - rowgroup:
            - row "N°Appart., Escalier, Chez...":
              - cell "N°Appart., Escalier, Chez..."
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
            - row "Bât., Imm., Rés.":
              - cell "Bât., Imm., Rés."
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
            - row "N° et lib de la voie *":
              - cell "N° et lib de la voie *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
            - row "Lieu-Dit ou BP":
              - cell "Lieu-Dit ou BP"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
            - row "Code Postal * Localité *":
              - cell "Code Postal *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell "Localité *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
            - row "Pays * FRANCE v":
              - cell "Pays *"
              - cell "FRANCE v":
                - table:
                  - rowgroup:
                    - row "FRANCE v":
                      - cell "FRANCE":
                        - textbox: FRANCE
                      - cell "v":
                        - table:
                          - rowgroup:
                            - row "v":
                              - cell "v":
                                - img "v"
            - row:
              - cell
              - cell
      - group "Coordonnées":
        - table:
          - rowgroup:
            - row "Mail * ${email}":
              - cell "Mail *"
              - cell "${email}":
                - table:
                  - rowgroup:
                    - row "${email}":
                      - cell "${email}":
                        - textbox: ${email}
              - cell
            - row:
              - cell
              - cell
            - row "Téléphone":
              - cell "Téléphone"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell
            - row "Portable":
              - cell "Portable"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell
              - cell
            - row "Fax":
              - cell "Fax"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell
              - cell
            - row "U Mode de com. préféré Mail v Langue de com. Français v":
              - cell
              - cell "U Mode de com. préféré Mail v":
                - textbox: U
                - table:
                  - rowgroup:
                    - row "Mail v":
                      - cell "Mail":
                        - textbox [disabled]: Mail
                      - cell "v":
                        - table:
                          - rowgroup:
                            - row "v":
                              - cell "v":
                                - img "v"
              - cell "Langue de com."
              - cell "Français v":
                - table:
                  - rowgroup:
                    - row "Français v":
                      - cell "Français":
                        - textbox: Français
                      - cell "v":
                        - table:
                          - rowgroup:
                            - row "v":
                              - cell "v":
                                - img "v"
            - row "Interlocuteur VA v Entrer le code postal pour obtenir la liste des interlocuteurs":
              - cell "Interlocuteur VA"
              - cell "v":
                - table:
                  - rowgroup:
                    - row "v":
                      - cell:
                        - textbox
                      - cell "v":
                        - table:
                          - rowgroup:
                            - row "v":
                              - cell "v":
                                - img "v"
              - cell "Entrer le code postal pour obtenir la liste des interlocuteurs"
      - group "Informations complémentaires":
        - table:
          - rowgroup:
            - row "Date de naissance *":
              - cell "Date de naissance *"
              - cell:
                - table:
                  - rowgroup:
                    - row:
                      - cell:
                        - textbox
              - cell
              - cell
      - table:
        - rowgroup:
          - row "Annuler":
            - cell "Annuler":
              - button
              - table:
                - rowgroup:
                  - row "Annuler":
                    - cell
                    - cell "Annuler"
      - table:
        - rowgroup:
          - row "Précédent":
            - cell "Précédent":
              - button
      - table:
        - rowgroup:
          - row "Submit Valider":
            - cell "Submit Valider":
              - button "Submit"
              - table:
                - rowgroup:
                  - row "Valider":
                    - cell
                    - cell "Valider"
    `);
    logger.info('✅ Modal avec données vérifié');
  }

  public async remplirFormulaireClient(donnees: DonneesClientParticulier): Promise<void> {
    logger.debug('Remplissage du formulaire client');
    
    if (donnees.qualite !== 'MADAME') {
      await RetryManager.executeWithRetry(
        async () => {
          await this.champQualite.click();
          
          await this.page.waitForTimeout(1000);
          
          const qualiteElement = this.page.getByRole('cell', { name: donnees.qualite, exact: true });
          await expect(qualiteElement).toBeVisible({ timeout: 10000 });
          
          await qualiteElement.click();
          
          await this.page.waitForTimeout(500);
        },
        `Sélection qualité ${donnees.qualite}`
      );
    } else {
      logger.debug('Qualité MADAME par défaut - pas de sélection nécessaire');
    }

    await RetryManager.executeWithRetry(
      async () => {
        await this.champNom.click();
        await this.champNom.fill(donnees.nom);
      },
      `Saisie nom ${donnees.nom}`
    );

    await RetryManager.executeWithRetry(
      async () => {
        await this.champPrenom.click();
        await this.champPrenom.fill(donnees.prenom);
      },
      `Saisie prénom ${donnees.prenom}`
    );

    await RetryManager.executeWithRetry(
      async () => {
        await this.champAdresseVoie.click();
        await this.champAdresseVoie.fill(donnees.adresseVoie);
      },
      `Saisie adresse ${donnees.adresseVoie}`
    );

    await RetryManager.executeWithRetry(
      async () => {
        await this.champCodePostal.click();
        await this.champCodePostal.fill(donnees.codePostal);
      },
      `Saisie code postal ${donnees.codePostal}`
    );

    await RetryManager.executeWithRetry(
      async () => {
        await this.champLocalite.click();
      },
      'Clic sur champ localité pour déclencher le remplissage automatique'
    );

    await expect(this.champLocalite).toHaveValue(donnees.localite);

    await RetryManager.executeWithRetry(
      async () => {
        await this.champTelephone.click();
        await this.champTelephone.fill(donnees.telephone);
      },
      `Saisie téléphone ${donnees.telephone}`
    );

    await RetryManager.executeWithRetry(
      async () => {
        await this.champDateNaissance.click();
        await this.champDateNaissance.fill(donnees.dateNaissance);
      },
      `Saisie date naissance ${donnees.dateNaissance}`
    );

    logger.info('✅ Formulaire client rempli');
  }

  public async validerCreation(): Promise<void> {
    logger.debug('Validation de la création du client');
    await RetryManager.executeWithRetry(
      async () => {
        await this.boutonValiderCreation.click();
      },
      'Validation création client'
    );
    logger.info('✅ Création du client validée');
  }

  public async verifierRedirectionHistorique(): Promise<void> {
    logger.debug('Vérification de la redirection vers l\'historique');
    await this.page.waitForURL('**/GRC/Historique', { timeout: config.timeoutMs });
    logger.info('✅ Redirection vers l\'historique confirmée');
  }

  public async verifierDonneesClient(donnees: DonneesClientParticulier): Promise<void> {
    logger.debug('Vérification des données du client créé');
    
    const qualiteAbregee = donnees.qualite === 'MADAME' ? 'MME' : 'M';
    const nomComplet = `${qualiteAbregee} ${donnees.prenom.toUpperCase()} ${donnees.nom.toUpperCase()} - Particulier`;
    
    await expect(this.page.locator('#nomParticulier')).toContainText(nomComplet);
    await expect(this.page.locator('#adresse')).toContainText(donnees.adresseVoie.toUpperCase());
    await expect(this.page.locator('#villePNDPostal')).toContainText(`${donnees.codePostal} ${donnees.localite}`);
    await expect(this.page.locator('#portable')).toContainText(donnees.telephone);
    await expect(this.page.locator('#mailTxt')).toContainText(donnees.email);
    
    await expect(this.page.locator('#texteFieldset')).toContainText('Client N°');
    
    logger.info('✅ Données du client vérifiées');
  }

  public async verifierHistorique(): Promise<void> {
    logger.debug('Vérification de l\'historique');
    
    await expect(this.page.getByRole('cell', { name: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/ })).toBeVisible();
    await expect(this.page.getByRole('cell', { name: 'Evènement', exact: true })).toBeVisible();
    await expect(this.page.getByRole('cell', { name: 'Emetteur VINCI Autoroutes', exact: true })).toBeVisible();
    
    await expect(this.page.locator('#gvHistorique_tccell0_4')).toBeVisible();
    
    logger.info('✅ Historique vérifié');
  }

  public async extraireNumeroClient(): Promise<string | null> {
    logger.debug('Extraction du numéro de client');
    
    try {
      const numeroClientElement = this.page.locator('#texteFieldset');
      
      await numeroClientElement.waitFor({ state: 'attached', timeout: 5000 });
      
      const texteComplet = await numeroClientElement.textContent();
      if (texteComplet) {
        const match = texteComplet.match(/Client N°\s*(\d+)/);
        if (match && match[1]) {
          const numeroClient = match[1];
          logger.info(`✅ Numéro de client extrait: ${numeroClient}`);
          return numeroClient;
        }
      }
      
      logger.warn('Impossible d\'extraire le numéro de client');
      return null;
    } catch (error) {
      logger.error(`Erreur lors de l'extraction du numéro de client: ${error.message}`);
      return null;
    }
  }

  public async sauvegarderClientEnBase(donnees: DonneesClientParticulier): Promise<void> {
    logger.debug('Sauvegarde du client en base de données');
    
    try {
      const numeroClient = await this.extraireNumeroClient();
      
      const db = openDbForWrite();
      
      createClientsTable(db);
      
      const clientData: ClientData = {
        email: donnees.email,
        qualite: donnees.qualite,
        nom: donnees.nom,
        prenom: donnees.prenom,
        adresseVoie: donnees.adresseVoie,
        codePostal: donnees.codePostal,
        localite: donnees.localite,
        telephone: donnees.telephone,
        interlocuteurVA: donnees.interlocuteurVA,
        dateNaissance: donnees.dateNaissance,
        numeroClient: numeroClient
      };
      
      saveClientData(db, clientData);
      
      closeDb(db);
      
      logger.info('✅ Client sauvegardé en base de données avec succès');
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde en base: ${error.message}`);
      throw error;
    }
  }

  public static async genererEmailUnique(): Promise<string> {
    logger.debug('Génération d\'un email unique');
    
    try {
      const db = openDbForWrite();
      
      createClientsTable(db);
      
      const emailUnique = generateUniqueEmail(db);
      
      closeDb(db);
      
      logger.info(`✅ Email unique généré: ${emailUnique}`);
      return emailUnique;
    } catch (error) {
      logger.error(`Erreur lors de la génération d'un email unique: ${error.message}`);
      throw error;
    }
  }
}

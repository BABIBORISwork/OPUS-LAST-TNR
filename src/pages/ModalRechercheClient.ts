import { expect, Page } from '@playwright/test';

export class ModalRechercheClient {
  constructor(private readonly page: Page) {}

  private get modal() { return this.page.locator('#popupRechercheClient_PWH-1T'); }
  private get boutonValider() { return this.page.locator('#btValidatePopupRechercheClient_CD'); }
  private get boutonRechercheClient() { return this.page.locator('#btnRechercheClientGlobal_CD'); }
  private get lienNouvelleRecherche() { return this.page.getByRole('link', { name: 'Nouvelle recherche' }); }

  async verifierModalVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.modal).toContainText('Rechercher un client');
  }

  async ouvrirModalRecherche(): Promise<void> {
    await this.boutonRechercheClient.click();
    await this.lienNouvelleRecherche.click();
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
    await this.verifierModalVisible();
  }

  async validerRecherche(): Promise<void> {
    await this.boutonValider.click();
  }

  async rechercherParNEva(nEva: string): Promise<void> {
    await this.page.locator('[id="Client\\.NumeroClient_I"]').fill(nEva);
  }
  async rechercherParReferenceAbonne(codeSociete: string, nAbonnee: string): Promise<void> {
    await this.selectionnerSocieteGestionnaire(codeSociete);
    await this.page.locator('[id="Client\\.NumeroCIP_I"]').fill(nAbonnee);
  }
  async rechercherParNom(nom: string, codePostal?: string): Promise<void> {
    await this.page.locator('input[name="Client\\.Nom"]').fill(nom);
    if (codePostal) await this.page.locator('[id="Client\\.CPParNom_I"]').fill(codePostal);
  }
  async rechercherParCoordonnees(codePostal: string, adresse: string, pays = 'FRANCE'): Promise<void> {
    await this.page.locator('[id="Client\\.Adresse\\.CodePostal_I"]').fill(codePostal);
    await this.page.locator('[id="Client\\.Adresse\\.Voie_I"]').fill(adresse);
    if (pays !== 'FRANCE') await this.selectionnerPays(pays);
  }
  async rechercherParEmail(email: string): Promise<void> {
    await this.page.locator('[id="Client\\.Email_I"]').fill(email);
  }
  async rechercherParIBAN(iban: string): Promise<void> {
    await this.page.locator('[id="Client\\.IBAN_I"]').fill(iban);
  }
  async rechercherParNomExact(nomExact: string): Promise<void> {
    await this.page.locator('[id="Client\\.NomExact_I"]').fill(nomExact);
  }
  async rechercherParBadge(numeroSerie: string): Promise<void> {
    await this.page.locator('[id="Badge\\.NumeroSerie_I"]').fill(numeroSerie);
  }
  async rechercherParTelephone(telephone: string): Promise<void> {
    await this.page.locator('[id="Client\\.TelephonePortable_I"]').fill(telephone);
  }
  async rechercherParFacture(numeroFacture: string): Promise<void> {
    await this.page.locator('[id="Client\\.NumeroFacture_I"]').fill(numeroFacture);
  }
  async rechercherParVehicule(immatriculation: string): Promise<void> {
    await this.page.locator('[id="Client\\.Immatriculation_I"]').fill(immatriculation);
  }
  async rechercherParPan(pan: string): Promise<void> {
    await this.page.locator('input[name="Client\\.Pan"]').fill(pan);
  }

  private async selectionnerSocieteGestionnaire(codeSociete: string): Promise<void> {
    const champ = this.page.locator('[id="Client\\.SocieteGestionnaire_I"]');
    await champ.click();
    await champ.fill(codeSociete);
    await expect(champ).toHaveValue(codeSociete, { timeout: 5000});
  }

  private async selectionnerPays(pays: string): Promise<void> {
    const champ = this.page.locator('input[name="Client\\.Adresse\\.Pays\\.Code"]');
    await champ.click();
    await this.page.getByRole('row', { name: pays, exact: true }).getByRole('cell').click();
  }

  async verifierResultatsRecherche(clientData: any): Promise<void> {
    await this.page.locator('#ResultatClientView').waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.page.locator('#ResultatClientView_col0')).toContainText('N° Client / N° Badge');
    await expect(this.page.locator('#ResultatClientView_col1')).toContainText('Référence Abonné / IBAN');
    await expect(this.page.locator('#ResultatClientView_col2')).toContainText('Formule(s)');
    await expect(this.page.locator('#ResultatClientView_col4')).toContainText('Dénomination');
    await expect(this.page.locator('#ResultatClientView_col5')).toContainText('Adresse');
    await expect(this.page.locator('#ResultatClientView_col6')).toContainText('CP');
    await expect(this.page.locator('#ResultatClientView_col7')).toContainText('Ville');

    await expect(this.page.locator('#ResultatClientView_tccell0_0')).toContainText(String(clientData.NEva));

    const referenceAbonne = (await this.page.locator('#ResultatClientView_tccell0_1').textContent()) || '';
    const expectedReference = `250${clientData.CodeSociete}${clientData.NAbonnee}${clientData.IBAN}`.replace(/\s+/g, '');
    expect(referenceAbonne.replace(/\s+/g, '')).toBe(expectedReference);

    await expect(this.page.locator('#ResultatClientView_tccell0_2')).toContainText(clientData.Formules);
    const denomination = `${clientData.Nom || ''} ${clientData.Prenom || ''}`.trim();
    await expect(this.page.locator('#ResultatClientView_tccell0_4')).toContainText(denomination);
    await expect(this.page.locator('#ResultatClientView_tccell0_5')).toContainText(clientData.Adresse || '');
    await expect(this.page.locator('#ResultatClientView_tccell0_6')).toContainText(clientData.CodePostal || '');
    await expect(this.page.locator('#ResultatClientView_tccell0_7')).toContainText(clientData.Ville || '');

    await this.page.getByRole('link', { name: String(clientData.NEva) }).click();
    await this.page.waitForURL('**/GRC/Historique', { timeout: 10000 });
  }
}



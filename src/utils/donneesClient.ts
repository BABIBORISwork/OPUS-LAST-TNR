import { DonneesClientParticulier } from '../pages/CreationClientParticulierPage';
import { logger } from './logger';

export class GestionnaireDonneesClient {
  private static instance: GestionnaireDonneesClient;
  private donneesTest: DonneesClientParticulier[] = [];

  private constructor() {
    this.initialiserDonneesTest();
  }

  public static getInstance(): GestionnaireDonneesClient {
    if (!GestionnaireDonneesClient.instance) {
      GestionnaireDonneesClient.instance = new GestionnaireDonneesClient();
    }
    return GestionnaireDonneesClient.instance;
  }

  private initialiserDonneesTest(): void {
    this.donneesTest = [
      {
        email: 'test.opustnrauto@ulys.com',
        qualite: 'MONSIEUR',
        nom: 'nom',
        prenom: 'prenom',
        adresseVoie: '3 rue grande',
        codePostal: '13410',
        localite: 'LAMBESC',
        telephone: '07 54 54 94 11',
        interlocuteurVA: 'BALLY Karine',
        dateNaissance: '25/03/2003'
      },
      {
        email: 'test.madame@ulys.com',
        qualite: 'MADAME',
        nom: 'Dupont',
        prenom: 'Marie',
        adresseVoie: '15 avenue des Champs',
        codePostal: '75008',
        localite: 'PARIS',
        telephone: '01 23 45 67 89',
        interlocuteurVA: 'BALLY Karine',
        dateNaissance: '15/06/1985'
      },
      {
        email: 'smoke.test@ulys.com',
        qualite: 'MONSIEUR',
        nom: 'Test',
        prenom: 'Smoke',
        adresseVoie: '1 rue test',
        codePostal: '13001',
        localite: 'MARSEILLE',
        telephone: '04 12 34 56 78',
        interlocuteurVA: 'BALLY Karine',
        dateNaissance: '01/01/1990'
      }
    ];
  }

  public obtenirDonneesClient(nomTest: string): DonneesClientParticulier | null {
    const donnees = this.donneesTest.find(d => 
      d.email.includes(nomTest.toLowerCase()) || 
      d.nom.toLowerCase() === nomTest.toLowerCase()
    );

    if (donnees) {
      logger.debug(`Données trouvées pour le test: ${nomTest}`);
      return donnees;
    }

    logger.warn(`Aucune donnée trouvée pour le test: ${nomTest}`);
    return null;
  }

  public obtenirDonneesParEmail(email: string): DonneesClientParticulier | null {
    const donnees = this.donneesTest.find(d => d.email === email);
    
    if (donnees) {
      logger.debug(`Données trouvées pour l'email: ${email}`);
      return donnees;
    }

    logger.warn(`Aucune donnée trouvée pour l'email: ${email}`);
    return null;
  }

  public genererDonneesAleatoires(): DonneesClientParticulier {
    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const qualites: ('MADAME' | 'MONSIEUR')[] = ['MADAME', 'MONSIEUR'];
    const qualite = qualites[Math.floor(Math.random() * qualites.length)];
    
    // Génération d'une date de naissance en 1969
    const jour = Math.floor(Math.random() * 28) + 1; // 1-28 pour éviter les problèmes de mois
    const mois = Math.floor(Math.random() * 12) + 1; // 1-12
    const dateNaissance = `${jour.toString().padStart(2, '0')}/${mois.toString().padStart(2, '0')}/1969`;
    
    const donnees: DonneesClientParticulier = {
      email: `automatisationtnr.afo${randomNumber}@ulys.com`,
      qualite: qualite,
      nom: 'FOUFA',
      prenom: 'Amine',
      adresseVoie: '3 rue grande',
      codePostal: '13410',
      localite: 'LAMBESC',
      telephone: '07 54 54 94 11',
      interlocuteurVA: 'BALLY Karine',
      dateNaissance: dateNaissance
    };

    logger.debug(`Données aléatoires générées: ${donnees.email}`);
    return donnees;
  }

  public ajouterDonneesClient(donnees: DonneesClientParticulier): void {
    // Vérifier si l'email existe déjà
    const existe = this.donneesTest.some(d => d.email === donnees.email);
    
    if (existe) {
      logger.warn(`Les données pour l'email ${donnees.email} existent déjà`);
      return;
    }

    this.donneesTest.push(donnees);
    logger.info(`Nouvelles données ajoutées pour: ${donnees.email}`);
  }

  public obtenirToutesLesDonnees(): DonneesClientParticulier[] {
    return [...this.donneesTest];
  }

  public nettoyerDonnees(): void {
    this.donneesTest = [];
    this.initialiserDonneesTest();
    logger.info('Données de test nettoyées et réinitialisées');
  }

  public validerDonnees(donnees: DonneesClientParticulier): boolean {
    const champsObligatoires = [
      'email', 'qualite', 'nom', 'prenom', 
      'adresseVoie', 'codePostal', 'localite', 
      'telephone', 'interlocuteurVA', 'dateNaissance'
    ];

    for (const champ of champsObligatoires) {
      if (!donnees[champ as keyof DonneesClientParticulier]) {
        logger.error(`Champ obligatoire manquant: ${champ}`);
        return false;
      }
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donnees.email)) {
      logger.error(`Format d'email invalide: ${donnees.email}`);
      return false;
    }

    // Validation du code postal
    const codePostalRegex = /^\d{5}$/;
    if (!codePostalRegex.test(donnees.codePostal)) {
      logger.error(`Format de code postal invalide: ${donnees.codePostal}`);
      return false;
    }

    // Validation du téléphone
    const telephoneRegex = /^0[1-9](?:[0-9]{8})$/;
    if (!telephoneRegex.test(donnees.telephone.replace(/\s/g, ''))) {
      logger.error(`Format de téléphone invalide: ${donnees.telephone}`);
      return false;
    }

    // Validation de la date de naissance
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(donnees.dateNaissance)) {
      logger.error(`Format de date invalide: ${donnees.dateNaissance}`);
      return false;
    }

    logger.debug('Validation des données réussie');
    return true;
  }
}

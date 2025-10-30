import { test } from '@playwright/test';
import { MainPage } from '../pages/MainPage';
import { ModalRechercheClient } from '../pages/ModalRechercheClient';
import { openDb } from '../utils/sqlite';
import { config } from '../config';

async function getRandomParticulier() {
  const db = openDb();
  
  try {
    const particuliers = db.prepare(`
      SELECT * FROM JDD WHERE Nom IS NOT NULL AND (Siret IS NULL OR Siret = '')
    `).all();
    
    if (!particuliers.length) {
      throw new Error('Aucun particulier trouvé dans la base de données.');
    }
    
    const index = Math.floor(Math.random() * particuliers.length);
    return particuliers[index];
  } finally {
    db.close();
  }
}

async function executeSearchTest(page, searchAction: (clientData: any) => Promise<void>) {
  const clientData = await getRandomParticulier();
  const main = new MainPage(page);
  const modal = new ModalRechercheClient(page);

  await main.naviguerVersOpus();
  await modal.ouvrirModalRecherche();
  await searchAction(clientData);
  await modal.validerRecherche();
  await modal.verifierResultatsRecherche(clientData);
}

test.describe('Recherche Client', () => {
  test.setTimeout(config.timeoutMs * 2);

  test('ouvrir modal', async ({ page }) => {
    const main = new MainPage(page);
    const modal = new ModalRechercheClient(page);
    await main.naviguerVersOpus();
    await modal.ouvrirModalRecherche();
  });

  test('Par NEva', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParNEva(String(clientData.NEva));
    });
  });

  test('Par Référence Abonné', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParReferenceAbonne(clientData.CodeSociete, clientData.NAbonnee);
    });
  });

  test('Par Nom', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParNom(clientData.Nom || '', clientData.CodePostal || undefined);
    });
  });

  test('Par Coordonnées', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParCoordonnees(clientData.CodePostal || '', clientData.Adresse || '');
    });
  });

  test('Par Email', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParEmail(clientData.Email || '');
    });
  });

  test('Par IBAN', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParIBAN(clientData.IBAN);
    });
  });

  test('Par Nom exact', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParNomExact(clientData.Nom || '');
    });
  });

  test('Par Téléphone', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParTelephone(clientData.Telephone || '');
    });
  });

  test('Par Véhicule', async ({ page }) => {
    await executeSearchTest(page, async (clientData) => {
      await new ModalRechercheClient(page).rechercherParVehicule(clientData.Immatriculation || '');
    });
  });
});



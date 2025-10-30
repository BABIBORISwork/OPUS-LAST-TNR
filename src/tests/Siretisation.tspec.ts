import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/MainPage';
import { ModalRechercheClient } from '../pages/ModalRechercheClient';
import { getClientProPourSiretisation } from '../utils/datasets';
import { openDbForWrite, ajouterColonneLastSiretisation, mettreAJourLastSiretisation } from '../utils/sqlite';
import { logger } from '../utils/logger';
import { config } from '../config';

test('Test de sirétisation du client', async ({ page }) => {
  test.setTimeout(config.timeoutMs * 3);

  // ============================================================================
  // ÉTAPE 1: Initialisation de la base de données
  // ============================================================================
  logger.info('📊 [ÉTAPE 1/8] Initialisation de la colonne lastSiretisation dans la table JDD...');
  const dbWrite = openDbForWrite();
  try {
    ajouterColonneLastSiretisation(dbWrite);
    logger.info('✅ Colonne lastSiretisation initialisée avec succès');
  } finally {
    dbWrite.close();
  }

  // ============================================================================
  // ÉTAPE 2: Sélection d'un client professionnel éligible
  // ============================================================================
  logger.info('🔍 [ÉTAPE 2/8] Recherche d\'un client professionnel éligible pour sirétisation...');
  logger.info('   Critères: SIRET non vide, lastSiretisation NULL ou >= 24h');
  const clientPro = await getClientProPourSiretisation();
  logger.info(`✅ Client sélectionné - NEva: ${clientPro.NEva}, SIRET: ${clientPro.Siret}`);

  // ============================================================================
  // ÉTAPE 3: Navigation et recherche du client
  // ============================================================================
  logger.info('🌐 [ÉTAPE 3/8] Navigation vers Opus et recherche du client par NEva...');
  const main = new MainPage(page);
  const modal = new ModalRechercheClient(page);

  await main.naviguerVersOpus();
  await modal.ouvrirModalRecherche();
  await modal.rechercherParNEva(String(clientPro.NEva));
  await modal.validerRecherche();
  await modal.verifierResultatsRecherche(clientPro);
  logger.info('✅ Client trouvé et historique chargé');

  // ============================================================================
  // ÉTAPE 4: Vérification de l'historique initial
  // ============================================================================
  logger.info('📋 [ÉTAPE 4/8] Vérification de l\'état initial de l\'historique...');
  const historique = page.locator('#gvHistorique');
  await historique.waitFor({ state: 'visible', timeout: 10000 });

  // Sélectionner la première ligne de données (en ciblant les lignes avec une date)
  // La structure de la table peut avoir plusieurs tbody, on cherche la première ligne avec une date
  const datePattern = /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/;
  
  // Attendre qu'au moins une ligne de données soit présente
  await page.waitForFunction(
    ({ selector, pattern }) => {
      const table = document.querySelector(selector);
      if (!table) return false;
      const rows = table.querySelectorAll('tbody tr');
      for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent || '';
        if (pattern.test(text) && !text.includes('Date (Décroissant)')) {
          return true;
        }
      }
      return false;
    },
    { selector: '#gvHistorique', pattern: datePattern },
    { timeout: 10000 }
  );

  // Récupérer toutes les lignes de données (qui contiennent une date)
  const toutesLesLignes = historique.locator('tbody tr');
  const nombreLignes = await toutesLesLignes.count();
  logger.info(`   📊 Nombre de lignes dans l'historique: ${nombreLignes}`);

  // Trouver la première ligne de données (pas un header)
  let premiereLigneInitiale = null;
  let texteInitiale = '';
  
  for (let i = 0; i < nombreLignes; i++) {
    const ligne = toutesLesLignes.nth(i);
    const texte = await ligne.textContent();
    if (texte && datePattern.test(texte) && !texte.includes('Date (Décroissant)')) {
      premiereLigneInitiale = ligne;
      texteInitiale = texte.trim();
      break;
    }
  }

  if (!premiereLigneInitiale) {
    throw new Error('Aucune ligne de données trouvée dans l\'historique initial');
  }

  // Extraire la date et le détail de la première ligne initiale
  const matchInitial = texteInitiale.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
  const detailInitial = texteInitiale.match(/Sirétisation du client|Création|Mise à jour|[\w\s]+/)?.[0]?.substring(0, 50) || 'Non déterminé';
  
  logger.info(`   📝 Première ligne de données initiale:`);
  logger.info(`      Date: ${matchInitial ? matchInitial[1] : 'Non trouvée'}`);
  logger.info(`      Détail: ${detailInitial}...`);

  // ============================================================================
  // ÉTAPE 5: Déclencher la sirétisation
  // ============================================================================
  logger.info('⚙️  [ÉTAPE 5/8] Déclenchement de la sirétisation via "Gestion des Abonnements"...');
  await page.getByTitle('Gestion des Abonnements').click();
  await page.waitForURL('**/GCO', { timeout: 15000 });
  logger.info('✅ Navigation vers GCO réussie - La sirétisation a été déclenchée');

  // ============================================================================
  // ÉTAPE 6: Mise à jour de lastSiretisation dans la base de données
  // ============================================================================
  logger.info(`💾 [ÉTAPE 6/8] Mise à jour de lastSiretisation pour le client ${clientPro.NEva}...`);
  mettreAJourLastSiretisation(clientPro.NEva);
  logger.info('✅ Base de données mise à jour avec succès');

  // ============================================================================
  // ÉTAPE 7: Retour sur l'historique
  // ============================================================================
  logger.info('🔄 [ÉTAPE 7/8] Retour sur la page Historique...');
  await page.getByTitle('Gestion de la Relation Client').click();
  await page.waitForURL('**/GRC/Historique', { timeout: 10000 });
  
  // Attendre que l'historique se recharge avec le nouvel événement
  await historique.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(3000); // Attente pour la mise à jour de l'historique
  logger.info('✅ Historique rechargé');

  // ============================================================================
  // ÉTAPE 8: Vérification de l'événement de sirétisation
  // ============================================================================
  logger.info('✅ [ÉTAPE 8/8] Vérification de l\'ajout de l\'événement de sirétisation...');
  
  // Trouver la nouvelle première ligne de données
  await page.waitForFunction(
    ({ selector, pattern }) => {
      const table = document.querySelector(selector);
      if (!table) return false;
      const rows = table.querySelectorAll('tbody tr');
      for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent || '';
        if (pattern.test(text) && text.includes('Sirétisation du client')) {
          return true;
        }
      }
      return false;
    },
    { selector: '#gvHistorique', pattern: datePattern },
    { timeout: 10000 }
  );

  // Trouver la première ligne qui contient "Sirétisation du client"
  let premiereLigneApresSiretisation = null;
  let texteApresSiretisation = '';
  
  const toutesLesLignesApres = historique.locator('tbody tr');
  const nombreLignesApres = await toutesLesLignesApres.count();
  logger.info(`   📊 Nombre de lignes après sirétisation: ${nombreLignesApres}`);

  for (let i = 0; i < nombreLignesApres; i++) {
    const ligne = toutesLesLignesApres.nth(i);
    const texte = await ligne.textContent();
    if (texte && datePattern.test(texte) && texte.includes('Sirétisation du client')) {
      premiereLigneApresSiretisation = ligne;
      texteApresSiretisation = texte.trim();
      break;
    }
  }

  if (!premiereLigneApresSiretisation) {
    throw new Error('Événement "Sirétisation du client" non trouvé dans l\'historique');
  }

  logger.info(`   📝 Événement de sirétisation trouvé:`);
  logger.info(`      Contenu: ${texteApresSiretisation.substring(0, 150)}...`);

  // Vérifier que "Sirétisation du client" est présent
  expect(texteApresSiretisation).toContain('Sirétisation du client');
  logger.info('   ✅ Vérification: "Sirétisation du client" présent dans l\'événement');

  // Vérifier que la date est récente (à l'heure près)
  const matchDate = texteApresSiretisation.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  
  if (!matchDate) {
    throw new Error('❌ Impossible d\'extraire la date de l\'événement de sirétisation');
  }

  const [, dateStr, timeStr] = matchDate;
  logger.info(`   📅 Date de l'événement: ${dateStr} ${timeStr}`);
  
  // Extraire la date et l'heure
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hour, minute, second] = timeStr.split(':').map(Number);
  const dateEvenement = new Date(year, month - 1, day, hour, minute, second);
  const maintenant = new Date();
  
  // Vérifier que l'événement date d'il y a moins de 5 minutes (tolérance)
  const differenceMilliseconds = Math.abs(maintenant.getTime() - dateEvenement.getTime());
  const differenceMinutes = differenceMilliseconds / (1000 * 60);
  const differenceSecondes = differenceMilliseconds / 1000;
  
  expect(differenceMinutes).toBeLessThan(5);
  logger.info(`   ⏱️  Temps écoulé depuis l'événement: ${differenceSecondes.toFixed(1)} secondes (${differenceMinutes.toFixed(2)} minutes)`);
  logger.info(`   ✅ Vérification: La date est récente (tolérance: 5 minutes)`);

  // Vérifier que l'historique a changé
  expect(texteApresSiretisation).not.toBe(texteInitiale);
  logger.info('   ✅ Vérification: L\'historique a bien été mis à jour');

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🎉 TEST TERMINÉ AVEC SUCCÈS');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});


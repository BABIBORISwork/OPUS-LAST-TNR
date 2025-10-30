import Database from 'better-sqlite3';
import { config } from '../config';
import { logger } from './logger';
import { Formule, Option, Promo } from '../types/models';


export function getFormulesTestCasesSync(): Array<{
  societeName: string;
  formule: Formule;
  isPro: boolean;
  usePromo: boolean;
  testName: string;
}> {
  const db = new Database(config.database.path, { readonly: true });
  const testCases: Array<{
    societeName: string;
    formule: Formule;
    isPro: boolean;
    usePromo: boolean;
    testName: string;
  }> = [];

  try {
    const formulesParticulieres = db.prepare(`
      SELECT f.*, s.Nom as SocieteNom
      FROM Formules f
      JOIN Societes s ON f.SocieteId = s.Id
      WHERE f.IsPro = 0
    `).all() as Array<Formule & { SocieteNom: string }>;

    const formulesPro = db.prepare(`
      SELECT f.*, s.Nom as SocieteNom
      FROM Formules f
      JOIN Societes s ON f.SocieteId = s.Id
      WHERE f.IsPro = 1
    `).all() as Array<Formule & { SocieteNom: string }>;

    const getOptionsForFormule = (formuleId: number): Option[] => {
      try {
        return db.prepare(`SELECT * FROM Options WHERE FormuleId = ?`).all(formuleId) as Option[];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Erreur lors de la récupération des options pour la formule ${formuleId}: ${errorMessage}`);
        return [];
      }
    };

    const getPromosForFormule = (formuleId: number): Promo[] => {
      try {
        return db.prepare(`SELECT * FROM Promos WHERE FormuleId = ?`).all(formuleId) as Promo[];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Erreur lors de la récupération des promos pour la formule ${formuleId}: ${errorMessage}`);
        return [];
      }
    };

    for (const formule of formulesParticulieres) {
      const options = getOptionsForFormule(formule.Id);
      const promos = getPromosForFormule(formule.Id);

      const formuleComplete: Formule = {
        ...formule,
        Societe: { Id: formule.SocieteId, Nom: formule.SocieteNom },
        Options: options,
        Promos: promos
      };

      if (formule.HasPromos && promos.length > 0) {
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: false,
          usePromo: true,
          testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_AVEC_Promo`
        });
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: false,
          usePromo: false,
          testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_SANS_Promo`
        });
      } else {
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: false,
          usePromo: false,
          testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}`
        });
      }
    }

    for (const formule of formulesPro) {
      const options = getOptionsForFormule(formule.Id);
      const promos = getPromosForFormule(formule.Id);

      const formuleComplete: Formule = {
        ...formule,
        Societe: { Id: formule.SocieteId, Nom: formule.SocieteNom },
        Options: options,
        Promos: promos
      };

      if (formule.HasPromos && promos.length > 0) {
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: true,
          usePromo: true,
          testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_AVEC_Promo`
        });
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: true,
          usePromo: false,
          testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_SANS_Promo`
        });
      } else {
        testCases.push({
          societeName: formule.SocieteNom,
          formule: formuleComplete,
          isPro: true,
          usePromo: false,
          testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}`
        });
      }
    }

    logger.info(`✅ ${testCases.length} cas de test générés (sync)`);
    return testCases;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Erreur lors de la génération des cas de test (sync): ${errorMessage}`);
    throw error;
  } finally {
    db.close();
  }
}
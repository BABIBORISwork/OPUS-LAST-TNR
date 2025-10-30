import Database from 'better-sqlite3';
import { config } from '../config';
import { logger } from './logger';
import { Formule, Societe, Option, Promo } from '../types/models';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initializeDatabase(): Promise<void> {
    try {
      this.db = new Database(config.database.path);
      logger.info('✅ Base de données initialisée');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Erreur lors de l'initialisation de la base de données: ${errorMessage}`);
      throw error;
    }
  }

  public async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('✅ Base de données fermée');
    }
  }

  public async getFormulesTestCases(): Promise<Array<{
    societeName: string;
    formule: Formule;
    isPro: boolean;
    usePromo: boolean;
    testName: string;
  }>> {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }

    const testCases: Array<{
      societeName: string;
      formule: Formule;
      isPro: boolean;
      usePromo: boolean;
      testName: string;
    }> = [];

    try {
      // Récupérer les formules particulières
      const formulesParticulieres = this.db.prepare(`
        SELECT f.*, s.Nom as SocieteNom
        FROM Formules f
        JOIN Societes s ON f.SocieteId = s.Id
        WHERE f.IsPro = 0
      `).all() as Array<Formule & { SocieteNom: string }>;

      // Récupérer les formules professionnelles
      const formulesPro = this.db.prepare(`
        SELECT f.*, s.Nom as SocieteNom
        FROM Formules f
        JOIN Societes s ON f.SocieteId = s.Id
        WHERE f.IsPro = 1
      `).all() as Array<Formule & { SocieteNom: string }>;

      // Traiter les formules particulières
      for (const formule of formulesParticulieres) {
        const options = this.getOptionsForFormule(formule.Id);
        const promos = this.getPromosForFormule(formule.Id);
        
        const formuleComplete: Formule = {
          ...formule,
          Societe: { Id: formule.SocieteId, Nom: formule.SocieteNom },
          Options: options,
          Promos: promos
        };

        if (formule.HasPromos && promos.length > 0) {
          // Test AVEC promo
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: false,
            usePromo: true,
            testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_AVEC_Promo`
          });

          // Test SANS promo
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: false,
            usePromo: false,
            testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_SANS_Promo`
          });
        } else {
          // Test normal (sans promo car la formule n'en a pas)
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: false,
            usePromo: false,
            testName: `Test_Part_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}`
          });
        }
      }

      // Traiter les formules professionnelles
      for (const formule of formulesPro) {
        const options = this.getOptionsForFormule(formule.Id);
        const promos = this.getPromosForFormule(formule.Id);
        
        const formuleComplete: Formule = {
          ...formule,
          Societe: { Id: formule.SocieteId, Nom: formule.SocieteNom },
          Options: options,
          Promos: promos
        };

        if (formule.HasPromos && promos.length > 0) {
          // Test AVEC promo
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: true,
            usePromo: true,
            testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_AVEC_Promo`
          });

          // Test SANS promo
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: true,
            usePromo: false,
            testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}_SANS_Promo`
          });
        } else {
          // Test normal (sans promo car la formule n'en a pas)
          testCases.push({
            societeName: formule.SocieteNom,
            formule: formuleComplete,
            isPro: true,
            usePromo: false,
            testName: `Test_Pro_${formule.SocieteNom.replace(/[ ()]/g, '_')}_${formule.Nom}`
          });
        }
      }

      logger.info(`✅ ${testCases.length} cas de test générés depuis la base de données`);
      return testCases;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Erreur lors de la récupération des cas de test: ${errorMessage}`);
      throw error;
    }
  }

  private getOptionsForFormule(formuleId: number): Option[] {
    if (!this.db) return [];
    
    try {
      return this.db.prepare(`
        SELECT * FROM Options 
        WHERE FormuleId = ?
      `).all(formuleId) as Option[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Erreur lors de la récupération des options pour la formule ${formuleId}: ${errorMessage}`);
      return [];
    }
  }

  private getPromosForFormule(formuleId: number): Promo[] {
    if (!this.db) return [];
    
    try {
      return this.db.prepare(`
        SELECT * FROM Promos 
        WHERE FormuleId = ?
      `).all(formuleId) as Promo[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Erreur lors de la récupération des promos pour la formule ${formuleId}: ${errorMessage}`);
      return [];
    }
  }

  public async getAllSocietes(): Promise<Societe[]> {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }

    try {
      return this.db.prepare('SELECT * FROM Societes').all() as Societe[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Erreur lors de la récupération des sociétés: ${errorMessage}`);
      throw error;
    }
  }

  public async getAllFormules(): Promise<Formule[]> {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }

    try {
      const formules = this.db.prepare(`
        SELECT f.*, s.Nom as SocieteNom
        FROM Formules f
        JOIN Societes s ON f.SocieteId = s.Id
      `).all() as Array<Formule & { SocieteNom: string }>;

      return formules.map(formule => ({
        ...formule,
        Societe: { Id: formule.SocieteId, Nom: formule.SocieteNom }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Erreur lors de la récupération des formules: ${errorMessage}`);
      throw error;
    }
  }
}

// Chargement synchrone des cas de tests depuis SQLite pour génération de tests au chargement du fichier
// Évite toute asynchronie afin que Playwright puisse définir un test par jeu de données comme en .NET
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
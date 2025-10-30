import { openDb, closeDb, openDbForWrite } from './sqlite';
import { TestCase, Formule, Option, Promo, Societe, JDD } from '../types/models';
import { logger } from './logger';

export async function getFormuleTestCases(): Promise<TestCase[]> {
  const db = openDb();
  const testCases: TestCase[] = [];
  
  try {
    // Récupérer les formules particuliers
    const formulesPart = db.prepare(`
      SELECT f.*, s.Nom as societeNom
      FROM Formules f
      JOIN Societes s ON s.Id = f.SocieteId
      WHERE f.IsPro = 0
    `).all();
    
    // Récupérer les formules pro
    const formulesPro = db.prepare(`
      SELECT f.*, s.Nom as societeNom
      FROM Formules f
      JOIN Societes s ON s.Id = f.SocieteId
      WHERE f.IsPro = 1
    `).all();
    
    const buildTestCases = (formules: any[], isPro: boolean): TestCase[] => {
      const cases: TestCase[] = [];
      
      for (const f of formules) {
        // Récupérer options et promos pour cette formule
        const options = db.prepare('SELECT * FROM Options WHERE FormuleId = ?').all(f.Id) as Option[];
        const promos = db.prepare('SELECT * FROM Promos WHERE FormuleId = ?').all(f.Id) as Promo[];
        
        const formule: Formule = {
          Id: f.Id,
          Nom: f.Nom,
          Code: f.Code,
          RadioId: f.RadioId,
          CellName: f.CellName,
          HasOptions: Boolean(f.HasOptions),
          HasPromos: Boolean(f.HasPromos),
          IsPro: Boolean(f.IsPro),
          SocieteId: f.SocieteId,
          Options: options,
          Promos: promos
        };
        
        const societeName = f.societeNom || 'Societe_Inconnue';
        const baseName = `Test_${isPro ? 'Pro' : 'Part'}_${societeName.replace(/\s+/g, '_').replace(/[()]/g, '')}_${f.Nom}`;
        
        // Test SANS promo
        cases.push({
          name: `${baseName}_SANS_Promo`,
          societeName,
          formule,
          isPro,
          selectedOption: null,
          selectedPromo: null,
          usePromo: false
        });
        
        // Test AVEC promo si la formule en a
        if (formule.HasPromos && promos.length > 0) {
          cases.push({
            name: `${baseName}_AVEC_Promo`,
            societeName,
            formule,
            isPro,
            selectedOption: null,
            selectedPromo: null,
            usePromo: true
          });
        }
      }
      
      return cases;
    };
    
    // Construire les cas de test pour particuliers et pro
    const casesPart = buildTestCases(formulesPart || [], false);
    const casesPro = buildTestCases(formulesPro || [], true);
    
    const allCases = [...casesPart, ...casesPro];
    logger.info(`Généré ${allCases.length} cas de test`, { 
      particuliers: casesPart.length, 
      pro: casesPro.length 
    });
    
    closeDb(db);
    return allCases;
  } catch (error) {
    logger.error('Erreur lors de la construction des cas de test', { error: (error as Error).message });
    closeDb(db);
    throw error;
  }
}

export async function getRandomParticulier(): Promise<JDD> {
  const db = openDb();
  
  try {
    const rows = db.prepare('SELECT * FROM JDD ORDER BY RANDOM() LIMIT 1').all();
    
    if (!rows || rows.length === 0) {
      const error = new Error('Aucun particulier trouvé dans la base de données');
      logger.error(error.message);
      closeDb(db);
      throw error;
    }
    
    const particulier = rows[0] as JDD;
    logger.debug('Particulier aléatoire sélectionné', { neva: particulier.NEva, nom: particulier.Nom });
    closeDb(db);
    return particulier;
  } catch (error) {
    logger.error('Erreur lors de la récupération d\'un particulier aléatoire', { error: (error as Error).message });
    closeDb(db);
    throw error;
  }
}

export async function getFormuleById(id: number): Promise<Formule | null> {
  const db = openDb();
  
  try {
    const formule = db.prepare(`
      SELECT f.*, s.Nom as societeNom
      FROM Formules f
      JOIN Societes s ON s.Id = f.SocieteId
      WHERE f.Id = ?
    `).get(id);
    
    if (!formule) {
      closeDb(db);
      return null;
    }
    
    // Récupérer options et promos
    const options = db.prepare('SELECT * FROM Options WHERE FormuleId = ?').all(id) as Option[];
    const promos = db.prepare('SELECT * FROM Promos WHERE FormuleId = ?').all(id) as Promo[];
    
    const formuleComplete: Formule = {
      Id: formule.Id,
      Nom: formule.Nom,
      Code: formule.Code,
      RadioId: formule.RadioId,
      CellName: formule.CellName,
      HasOptions: Boolean(formule.HasOptions),
      HasPromos: Boolean(formule.HasPromos),
      IsPro: Boolean(formule.IsPro),
      SocieteId: formule.SocieteId,
      Options: options,
      Promos: promos
    };
    
    closeDb(db);
    return formuleComplete;
  } catch (error) {
    logger.error('Erreur lors de la récupération de la formule', { error: (error as Error).message, id });
    closeDb(db);
    throw error;
  }
}

export async function getClientProPourSiretisation(): Promise<JDD> {
  const db = openDbForWrite();
  
  try {
    // Calculer la date limite (24h avant maintenant)
    const dateLimite = new Date();
    dateLimite.setHours(dateLimite.getHours() - 24);
    
    const rows = db.prepare(`
      SELECT * FROM JDD 
      WHERE Siret IS NOT NULL 
        AND Siret != ''
        AND (lastSiretisation IS NULL 
             OR datetime(lastSiretisation) < datetime(?))
      ORDER BY RANDOM() 
      LIMIT 1
    `).all(dateLimite.toISOString());
    
    if (!rows || rows.length === 0) {
      const error = new Error('Aucun client professionnel éligible pour la sirétisation trouvé');
      logger.error(error.message);
      throw error;
    }
    
    const clientPro = rows[0] as JDD;
    logger.info('Client pro éligible sélectionné pour sirétisation', { 
      neva: clientPro.NEva, 
      siret: clientPro.Siret 
    });
    
    return clientPro;
  } catch (error) {
    logger.error('Erreur lors de la récupération d\'un client pro pour sirétisation', { 
      error: (error as Error).message 
    });
    throw error;
  } finally {
    db.close();
  }
}
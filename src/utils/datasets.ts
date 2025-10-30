import { openDb, closeDb, openDbForWrite } from './sqlite';
import { Formule, Option, Promo, JDD } from '../types/models';
import { logger } from './logger';

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
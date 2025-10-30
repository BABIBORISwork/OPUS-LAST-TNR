import Database from 'better-sqlite3';
import path from 'node:path';
import { config } from '../config';
import { logger } from './logger';

export function openDb(): Database.Database {
  const dbPath = path.resolve(__dirname, '../../', config.database.path);
  logger.debug(`Ouverture de la base de données: ${dbPath}`);
  
  try {
    const db = new Database(dbPath, { readonly: true });
    logger.debug('✅ Base de données ouverte avec succès');
    return db;
  } catch (error) {
    logger.error('Erreur lors de l\'ouverture de la base de données', { 
      error: (error as Error).message, 
      path: dbPath 
    });
    throw error;
  }
}

export function closeDb(db: Database.Database): void {
  try {
    db.close();
    logger.debug('✅ Base de données fermée');
  } catch (error) {
    logger.error('Erreur lors de la fermeture de la base de données', { error: error.message });
  }
}

export function openDbForWrite(): Database.Database {
  const dbPath = path.resolve(__dirname, '../../', config.database.path);
  logger.debug(`Ouverture de la base de données en écriture: ${dbPath}`);
  
  try {
    const db = new Database(dbPath, { readonly: false });
    logger.debug('✅ Base de données ouverte en écriture avec succès');
    return db;
  } catch (error) {
    logger.error('Erreur lors de l\'ouverture de la base de données en écriture', { 
      error: error.message, 
      path: dbPath 
    });
    throw error;
  }
}

export function createClientsTable(db: Database.Database): void {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS clients_crees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      qualite TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      adresse_voie TEXT NOT NULL,
      code_postal TEXT NOT NULL,
      localite TEXT NOT NULL,
      telephone TEXT NOT NULL,
      interlocuteur_va TEXT NOT NULL,
      date_naissance TEXT NOT NULL,
      numero_client TEXT,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    db.exec(createTableSQL);
    logger.debug('✅ Table clients_crees créée ou vérifiée');
  } catch (error) {
    logger.error('Erreur lors de la création de la table clients_crees', { error: error.message });
    throw error;
  }
}

export interface ClientData {
  email: string;
  qualite: string;
  nom: string;
  prenom: string;
  adresseVoie: string;
  codePostal: string;
  localite: string;
  telephone: string;
  interlocuteurVA: string;
  dateNaissance: string;
  numeroClient?: string;
}

export function checkEmailExists(db: Database.Database, email: string): boolean {
  const selectSQL = `SELECT COUNT(*) as count FROM clients_crees WHERE email = ?`;
  
  try {
    const stmt = db.prepare(selectSQL);
    const row = stmt.get(email) as { count: number };
    const exists = row.count > 0;
    logger.debug(`Email ${email} existe: ${exists}`);
    return exists;
  } catch (error) {
    logger.error('Erreur lors de la vérification de l\'email', { error: error.message });
    throw error;
  }
}

export function generateUniqueEmail(db: Database.Database): string {
  let email: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  try {
    do {
      const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      email = `automatisationtnr.afo${randomNumber}@ulys.com`;
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error(`Impossible de générer un email unique après ${maxAttempts} tentatives`);
      }
    } while (checkEmailExists(db, email));
    
    logger.info(`✅ Email unique généré: ${email}`);
    return email;
  } catch (error) {
    logger.error('Erreur lors de la génération d\'un email unique', { error: error.message });
    throw error;
  }
}

export function checkAddressExists(db: Database.Database, adresseVoie: string, codePostal: string, localite: string): boolean {
  const selectSQL = `SELECT COUNT(*) as count FROM clients_crees WHERE LOWER(TRIM(adresse_voie)) = LOWER(TRIM(?)) AND code_postal = ? AND LOWER(TRIM(localite)) = LOWER(TRIM(?))`;
  
  try {
    const stmt = db.prepare(selectSQL);
    const row = stmt.get(adresseVoie, codePostal, localite) as { count: number };
    const exists = row.count > 0;
    logger.debug(`Adresse ${adresseVoie}, ${codePostal} ${localite} existe: ${exists}`);
    return exists;
  } catch (error) {
    logger.error('Erreur lors de la vérification de l\'adresse', { error: error.message });
    throw error;
  }
}

export function generateUniqueRueGrandeAddress(db: Database.Database): string {
  const codePostal = '13410';
  const localite = 'LAMBESC';
  const voieBase = 'rue grande';
  let numeroRue: number;
  let adresseVoie: string;
  let attempts = 0;
  const maxAttempts = 2000; 
  
  try {
    do {
      // Générer un numéro aléatoire entre 1 et 1600
      numeroRue = Math.floor(Math.random() * 1600) + 1;
      adresseVoie = `${numeroRue} ${voieBase}`;
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error(`Impossible de générer une adresse unique après ${maxAttempts} tentatives pour ${voieBase}`);
      }
    } while (checkAddressExists(db, adresseVoie, codePostal, localite));
    
    logger.info(`✅ Adresse unique générée: ${adresseVoie}, ${codePostal} ${localite}`);
    return adresseVoie;
  } catch (error) {
    logger.error('Erreur lors de la génération d\'une adresse unique', { error: error.message });
    throw error;
  }
}

export function saveClientData(db: Database.Database, clientData: ClientData): void {
  const insertSQL = `
    INSERT INTO clients_crees (
      email, qualite, nom, prenom, adresse_voie, code_postal, 
      localite, telephone, interlocuteur_va, date_naissance, numero_client
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    clientData.email,
    clientData.qualite,
    clientData.nom,
    clientData.prenom,
    clientData.adresseVoie,
    clientData.codePostal,
    clientData.localite,
    clientData.telephone,
    clientData.interlocuteurVA,
    clientData.dateNaissance,
    clientData.numeroClient || null
  ];
  
  try {
    const stmt = db.prepare(insertSQL);
    const info = stmt.run(...params);
    logger.info(`✅ Client sauvegardé en base avec l'ID: ${info.lastInsertRowid}`);
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du client', { error: error.message });
    throw error;
  }
}

export function ajouterColonneLastSiretisation(db: Database.Database): void {
  try {
    // Vérifier si la colonne existe déjà
    const tableInfo = db.prepare("PRAGMA table_info(JDD)").all() as Array<{ name: string }>;
    const colonneExiste = tableInfo.some((col) => col.name === 'lastSiretisation');
    
    if (!colonneExiste) {
      db.exec(`ALTER TABLE JDD ADD COLUMN lastSiretisation DATETIME`);
      logger.info('✅ Colonne lastSiretisation ajoutée à la table JDD');
    } else {
      logger.debug('Colonne lastSiretisation existe déjà dans la table JDD');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erreur lors de l\'ajout de la colonne lastSiretisation', { error: errorMessage });
    throw error;
  }
}

export function mettreAJourLastSiretisation(neva: number): void {
  const db = openDbForWrite();
  try {
    db.prepare(`
      UPDATE JDD 
      SET lastSiretisation = datetime('now') 
      WHERE NEva = ?
    `).run(neva);
    logger.info(`✅ lastSiretisation mis à jour pour le client ${neva}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erreur lors de la mise à jour de lastSiretisation', { 
      error: errorMessage, 
      neva 
    });
    throw error;
  } finally {
    db.close();
  }
}
export interface Societe {
  Id: number;
  Nom: string;
  Formules?: Formule[];
}

export interface Formule {
  Id: number;
  Nom: string;
  Code: string;
  RadioId: string;
  CellName: string;
  HasOptions: boolean;
  HasPromos: boolean;
  IsPro: boolean;
  SocieteId: number;
  Societe?: Societe;
  Options?: Option[];
  Promos?: Promo[];
}

export interface Option {
  Id: number;
  Nom: string;
  Code: string;
  RadioId: string;
  FormuleId: number;
  Formule?: Formule;
}

export interface Promo {
  Id: number;
  Nom: string;
  Code: string;
  FormuleId: number;
  Formule?: Formule;
}

export interface JDD {
  Id: number;
  NEva: number;
  CodeSociete: string;
  NAbonnee: string;
  IBAN: string;
  Formules: string;
  Nom?: string;
  Prenom?: string;
  DateNaissance?: string;
  Qualite?: string;
  Adresse?: string;
  CodePostal?: string;
  Ville?: string;
  Email?: string;
  Telephone?: string;
  Siret?: string;
  NumeroCommande?: string;
  NumeroSerieBadge?: string;
  NumeroFacture?: string;
  Immatriculation?: string;
  Pan?: string;
  lastSiretisation?: string;
}

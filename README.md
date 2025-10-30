# OPUS E2E (Playwright)

## Prérequis
- Node.js 18+
- Navigateurs Playwright installés: `npx playwright install --with-deps`
- Accès local uniquement (pas de CI)

## Installation
```bash
npm install
npx playwright install --with-deps
```

## Configuration (.env)
Créez un fichier `.env` à partir de `.env.example` et adaptez les valeurs.
- Ne committez jamais de secrets. Utilisez `.env` localement uniquement.

## Lancer les tests
- Headless (par défaut):
```bash
npm test
```
- Visible:
```bash
npm run test:headed
```

## Rapport de test
- Rapport HTML Playwright (généré après exécution):
```bash
npm run report:open
```

## Structure du projet
```
src/
  config.ts                # Lecture de la config (dotenv)
  pages/                   # Page Objects
  tests/                   # Suites de tests Playwright
  types/                   # Types/Models
  utils/                   # Helpers (db, logger, retry, etc.)
playwright.config.ts       # Configuration Playwright
```

## Scripts utiles
- `npm test` – exécute tous les tests
- `npm run test:headed` – exécution avec navigateur visible
- `npm run report:open` – ouvre le rapport HTML Playwright
- `npm run lint` – lint TypeScript
- `npm run format` – formatage Prettier

## Bonnes pratiques
- Garder `.env` hors du contrôle de version (voir `.gitignore`).
- Privilégier les Page Objects (`src/pages`) pour la maintenabilité.
- Utiliser des sélecteurs stables (data-testid) quand c’est possible.

## Dépannage
- Si les navigateurs manquent: `npx playwright install --with-deps`
- Augmenter `TIMEOUT` dans `.env` si besoin.

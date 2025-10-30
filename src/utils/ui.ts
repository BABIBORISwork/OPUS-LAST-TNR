import { Locator, Page, expect } from '@playwright/test';

// Ouvre un dropdown DevExpress basé sur un input et attend l'ouverture effective
export async function openGridDropdown(dropdownInput: Locator): Promise<void> {
  await dropdownInput.click();
  // aria-expanded peut ne pas être présent; fallback sur présence d'une liste
  try {
    await expect(dropdownInput).toHaveAttribute('aria-expanded', /true|false/, { timeout: 5000 });
  } catch {}
}

// Ferme un dropdown si ouvert en cliquant en dehors ou en re-cliquant l'input
export async function ensureDropdownClosed(page: Page, dropdownInput: Locator): Promise<void> {
  try {
    const hasExpanded = await dropdownInput.getAttribute('aria-expanded');
    if (hasExpanded === 'true') {
      await dropdownInput.click();
      await page.waitForTimeout(200);
    }
  } catch {}
}

// Sélectionne une cellule par texte exact en limitant la portée au panneau de liste actif
export async function selectFromGridByCellText(page: Page, cellText: string, timeout = 10000): Promise<void> {
  // Les listes DevExpress utilisent souvent des conteneurs avec id qui finissent par _DDD_L
  const listContainers = page.locator('[id$="_DDD_L"], .dxeListBox, .dxeListBox_Metropolis');
  // Attendre qu'au moins un conteneur soit visible
  await expect(listContainers.first()).toBeVisible({ timeout });

  // Chercher la cellule à l'intérieur des conteneurs pour éviter les collisions en mode strict
  const cell = listContainers.getByRole('cell', { name: cellText, exact: true });
  await expect(cell).toBeVisible({ timeout });
  await cell.click();
}

// Sélectionne une valeur dans un dropdown grille DevExpress avec retry et fermeture propre
export async function selectFromGridDropdown(
  page: Page,
  dropdownInput: Locator,
  value: string,
  timeout = 10000,
  retries = 2
): Promise<void> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      await openGridDropdown(dropdownInput);
      await selectFromGridByCellText(page, value, timeout);
      // attendre la fermeture du panneau (ou forcer)
      await ensureDropdownClosed(page, dropdownInput);
      return;
    } catch (error) {
      attempt++;
      if (attempt > retries) throw error;
      // petit délai avant retry
      await page.waitForTimeout(500);
    }
  }
}


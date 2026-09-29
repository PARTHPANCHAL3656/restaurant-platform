// Shared helpers for the guest menu flow (category grid, item list, search).
// Pure functions only - no React, no context - so the counts on the grid and
// the sections in the list are computed by the exact same code and can never
// disagree.

export const DIET = { ALL: 'all', VEG: 'veg', NONVEG: 'nonveg' };

// Veg = Vegetarian or Vegan. Anything else (including a missing value) counts
// as non-veg, so a dish is never shown as veg by mistake.
export const isVeg = (item) => {
  const t = String(item.foodType || '').toLowerCase();
  return t.includes('veg') && !t.includes('non');
};

export const foodTypeLabel = (item) => {
  const t = String(item.foodType || '').toLowerCase();
  if (t.includes('vegan')) return 'Vegan';
  return isVeg(item) ? 'Veg' : 'Non-Veg';
};

export const matchesDiet = (item, diet) => {
  if (diet === DIET.VEG) return isVeg(item);
  if (diet === DIET.NONVEG) return !isVeg(item);
  return true;
};

export const normalizeQuery = (q) => String(q || '').trim().toLowerCase();

export const matchesQuery = (item, query) => {
  const q = normalizeQuery(query);
  if (!q) return true;
  return [item.name, item.description, item.tag, item.category].some((field) =>
    String(field || '').toLowerCase().includes(q)
  );
};

// Staff can switch a dish off ("available" checkbox in Menu Management).
// Guests never see those dishes, and they never count towards totals.
export const isGuestVisible = (item) => item.available !== false;

// Returns one entry per category, in the order staff arranged them:
//   [{ name: 'Starters', items: [...] }, ...]
// Categories with no matching dish come back with items: [] - the caller
// decides whether to hide or dim them.
export function buildSections(menuItems, categoryNames, options = {}) {
  const { diet = DIET.ALL, specialOnly = false, query = '' } = options;
  const visible = menuItems.filter(
    (item) =>
      isGuestVisible(item) &&
      matchesDiet(item, diet) &&
      (!specialOnly || item.special === true) &&
      matchesQuery(item, query)
  );
  return categoryNames.map((name) => ({
    name,
    items: visible.filter((item) => item.category === name),
  }));
}

export const countLabel = (n, one = 'dish', many = 'dishes') =>
  `${n} ${n === 1 ? one : many}`;

// Splits text into [{ text, match }] so the UI can underline the searched word.
export function splitByQuery(text, query) {
  const q = normalizeQuery(query);
  const str = String(text || '');
  if (!q) return [{ text: str, match: false }];
  const lower = str.toLowerCase();
  const parts = [];
  let i = 0;
  while (i < str.length) {
    const hit = lower.indexOf(q, i);
    if (hit === -1) {
      parts.push({ text: str.slice(i), match: false });
      break;
    }
    if (hit > i) parts.push({ text: str.slice(i, hit), match: false });
    parts.push({ text: str.slice(hit, hit + q.length), match: true });
    i = hit + q.length;
  }
  return parts;
}
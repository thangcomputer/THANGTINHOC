export const ROLES = { ADMIN: 'admin', EDITOR: 'editor', STAFF: 'staff' };

/** Menu keys restricted to admin only (orders, settings, cache purge). */
export const ADMIN_ONLY_KEYS = new Set(['orders', 'settings', 'cache']);

export function canAccessMenu(role, permKey) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  if (ADMIN_ONLY_KEYS.has(permKey)) return false;
  return true;
}

export function filterMenuSections(sections, role) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permKey || canAccessMenu(role, item.permKey)),
    }))
    .filter((section) => section.items.length > 0);
}
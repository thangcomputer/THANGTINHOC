const LABELS = {
  '/': 'T\u1ed5ng quan',
  '/courses': 'Kh\u00f3a h\u1ecdc',
  '/courses/new': 'Th\u00eam kh\u00f3a h\u1ecdc',
  '/posts': 'B\u00e0i vi\u1ebft',
  '/posts/new': 'Vi\u1ebft b\u00e0i m\u1edbi',
  '/users': 'Ng\u01b0\u1eddi d\u00f9ng',
  '/orders': '\u0110\u01a1n h\u00e0ng',
  '/categories': 'Danh m\u1ee5c',
  '/home-cms': 'Trang ch\u1ee7 CMS',
  '/settings': 'C\u00e0i \u0111\u1eb7t chung',
  '/qa': 'H\u1ecfi \u0111\u00e1p',
  '/inquiries': 'Tin nh\u1eafn t\u01b0 v\u1ea5n',
  '/registrations': 'Ghi danh',
  '/recruitment': 'Tuy\u1ec3n d\u1ee5ng GV',
  '/submissions': 'B\u00e0i t\u1eadp',
  '/media': 'Qu\u1ea3n l\u00fd \u1ea3nh',
};

export function getBreadcrumbLabel(pathname) {
  if (!pathname || pathname === '/') return LABELS['/'];
  if (pathname.startsWith('/courses/edit/')) return 'S\u1eeda kh\u00f3a h\u1ecdc';
  if (/^\/courses\/[^/]+\/lessons/.test(pathname)) return 'Qu\u1ea3n l\u00fd b\u00e0i h\u1ecdc';
  if (pathname.startsWith('/posts/edit/')) return 'S\u1eeda b\u00e0i vi\u1ebft';
  const keys = Object.keys(LABELS).sort((a, b) => b.length - a.length);
  for (const prefix of keys) {
    if (prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return LABELS[prefix];
    }
  }
  return '';
}
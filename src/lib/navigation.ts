export const normalizePath = (path: string) => (
  path.endsWith('/') ? path : `${path}/`
);

export function isNavigationItemActive(
  itemHref: string,
  currentPath: string,
): boolean {
  const normalizedItemHref = normalizePath(itemHref);
  const normalizedCurrentPath = normalizePath(currentPath);

  if (normalizedItemHref === '/') {
    return normalizedCurrentPath === '/';
  }

  return normalizedCurrentPath === normalizedItemHref
    || normalizedCurrentPath.startsWith(normalizedItemHref);
}

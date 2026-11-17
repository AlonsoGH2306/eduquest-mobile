export type RoleName = 'ROLE_USER' | 'ROLE_MANAGER' | 'ROLE_ADMIN';

export const ROLE_OPTIONS: { value: RoleName; label: string; icon: string; description: string }[] = [
  { value: 'ROLE_USER', label: 'Estudiante', icon: 'school-outline', description: 'Usa la biblioteca, grupos y planes' },
  { value: 'ROLE_MANAGER', label: 'Gestor', icon: 'account-tie-outline', description: 'Además puede ver la lista de usuarios' },
  { value: 'ROLE_ADMIN', label: 'Administrador', icon: 'shield-crown-outline', description: 'Control total, incluido cambiar roles' },
];

const ROLE_PRIORITY: RoleName[] = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'];

export const roleLabel = (role: string) => ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

export const primaryRole = (roles: string[]): RoleName =>
  ROLE_PRIORITY.find((role) => roles.includes(role)) ?? 'ROLE_USER';

export const isAdmin = (roles: string[] = []) => roles.includes('ROLE_ADMIN');

export const canSeeUsers = (roles: string[] = []) =>
  roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER');

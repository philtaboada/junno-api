import type { TeamAccessRole } from '@pm/contracts';

export const TEAM_ACCESS_ROLE_OPTIONS: ReadonlyArray<{
  value: TeamAccessRole;
  label: string;
  description: string;
}> = [
  {
    value: 'editor',
    label: 'Editor',
    description: 'Puede crear y editar contenido del equipo',
  },
  {
    value: 'commenter',
    label: 'Comentador',
    description: 'Puede ver y comentar, sin editar',
  },
  {
    value: 'viewer',
    label: 'Solo lectura',
    description: 'Puede ver, sin editar ni comentar',
  },
];

export function getTeamAccessRoleLabel(role: TeamAccessRole): string {
  return TEAM_ACCESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

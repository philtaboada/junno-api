import type { ProjectAccessRole } from '@pm/contracts';

export const PROJECT_ACCESS_ROLE_OPTIONS: ReadonlyArray<{
  value: ProjectAccessRole;
  label: string;
  description: string;
}> = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Control total del proyecto',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Puede editar tareas y secciones',
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

export function getProjectAccessRoleLabel(role: ProjectAccessRole): string {
  return (
    PROJECT_ACCESS_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
  );
}

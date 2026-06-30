import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  Columns3,
  GitBranch,
  Layers,
  LayoutGrid,
  MessageSquare,
  Radio,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

export type LandingFeature = {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly className?: string;
};

export type LandingView = {
  readonly id: string;
  readonly label: string;
  readonly headline: string;
  readonly description: string;
};

export type LandingWorkflowStep = {
  readonly step: string;
  readonly title: string;
  readonly description: string;
};

export const landingStats = [
  { value: '5+', label: 'Vistas de proyecto' },
  { value: 'Real-time', label: 'Sincronización en vivo' },
  { value: 'Multi-home', label: 'Tareas en N proyectos' },
  { value: '100%', label: 'Enfocado en equipos' },
] as const;

export const landingFeatures: readonly LandingFeature[] = [
  {
    title: 'Mis tareas inteligentes',
    description:
      'Hoy, próximas y más tarde en un solo lugar. Prioriza sin perder el foco.',
    icon: Sparkles,
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    title: 'Multi-homing',
    description: 'Una tarea, varios proyectos. Sin duplicar trabajo.',
    icon: Layers,
  },
  {
    title: 'Bandeja de actividad',
    description: 'Asignaciones, comentarios y cambios en tiempo real.',
    icon: Bell,
  },
  {
    title: 'Vistas flexibles',
    description: 'Lista, tablero, calendario y más según cómo trabajes.',
    icon: LayoutGrid,
    className: 'md:col-span-2',
  },
  {
    title: 'Campos personalizados',
    description: 'Texto, números, fechas, selectores y timers por proyecto.',
    icon: Columns3,
  },
  {
    title: 'Equipos y permisos',
    description: 'Roles por proyecto: admin, editor, comentarista o lector.',
    icon: Shield,
  },
  {
    title: 'Comentarios y adjuntos',
    description: 'Contexto completo en cada tarea, sin salir del flujo.',
    icon: MessageSquare,
  },
  {
    title: 'Dependencias',
    description: 'Encadena tareas y evita bloqueos antes de que ocurran.',
    icon: GitBranch,
  },
  {
    title: 'Workspaces',
    description: 'Separa clientes, departamentos o iniciativas con claridad.',
    icon: Users,
  },
  {
    title: 'Sincronización en vivo',
    description: 'Cambios visibles al instante para todo el equipo.',
    icon: Radio,
    className: 'md:col-span-2',
  },
];

export const landingViews: readonly LandingView[] = [
  {
    id: 'list',
    label: 'Lista',
    headline: 'Detalle cuando lo necesitas',
    description:
      'Columnas personalizables, edición inline y filtros para equipos que viven en los datos.',
  },
  {
    id: 'board',
    label: 'Tablero',
    headline: 'Flujo visual, sin fricción',
    description:
      'Arrastra tareas entre secciones. Ideal para sprints, pipelines y seguimiento ágil.',
  },
  {
    id: 'calendar',
    label: 'Calendario',
    headline: 'Plazos que se ven claros',
    description:
      'Visualiza entregas por fecha. Arrastra para reprogramar sin abrir cada tarea.',
  },
  {
    id: 'my-tasks',
    label: 'Mis tareas',
    headline: 'Tu día, organizado',
    description:
      'Secciones Today, Upcoming y Later para decidir qué importa ahora.',
  },
];

export const landingWorkflowSteps: readonly LandingWorkflowStep[] = [
  {
    step: '01',
    title: 'Crea tu workspace',
    description: 'Regístrate en segundos y configura el espacio de tu equipo.',
  },
  {
    step: '02',
    title: 'Organiza proyectos',
    description: 'Equipos, secciones y tareas con la estructura que ya conoces.',
  },
  {
    step: '03',
    title: 'Colabora en vivo',
    description: 'Comentarios, asignaciones y cambios sincronizados al instante.',
  },
];

export const landingNavLinks = [
  { href: '#features', label: 'Funciones' },
  { href: '#views', label: 'Vistas' },
  { href: '#workflow', label: 'Cómo funciona' },
] as const;

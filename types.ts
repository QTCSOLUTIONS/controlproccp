
export type AuditStatus = 'Planning' | 'Execution' | 'Reporting' | 'Completed';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Person {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string;
  email: string;
  visible_in_team?: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string;
}

export interface Phase {
  id: string;
  name: string;
  objectives: string[];
  start_week: number;
  duration_weeks: number;
  status: AuditStatus;
  alert_note?: string;
}

export interface AuditEntity {
  id: string;
  name: string;
  responsible_id: string;
  scope: string;
  status: AuditStatus;
  progress: number;
  last_updated: string;
  start_date: string;
  tasks?: Task[];
  phases?: Phase[];
}

export interface RiskControl {
  id: string;
  audit_id: string;
  entity_name?: string;
  audit_scope?: string;
  tasks?: string;
  process: string;
  area: string;
  risk_description: string;
  impact: number;
  probability: number;
  inherent_risk: number;
  existing_controls: string;
  control_effectiveness: number;
  residual_risk: number;
  traffic_light_level: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  status: 'Completado' | 'En curso' | 'Pendiente';
  responsible: string;
  implementation_date: string;
  recommendation: string;
}

export interface CLACriterion {
  id: string;
  audit_id: string;
  entity_name?: string;
  area: string;
  criterion: string;
  description: string;
  source: string;
  complies: 'Sí' | 'No' | 'N/A';
}

export interface TaskPlannerEntry {
  id: string;
  scope: string;
  task: string;
  phase: string;
}

export type ViewType = 'dashboard' | 'schedule' | 'matrix' | 'entidades' | 'personas' | 'planner' | 'cla' | 'areas' | 'users';

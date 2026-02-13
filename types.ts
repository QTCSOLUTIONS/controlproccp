
export type AuditStatus = 'Planning' | 'Execution' | 'Reporting' | 'Completed';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Person {
  id: string;
  full_name: string; // Changed from name
  role: string;
  avatar_url: string; // Changed from avatar
  email: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string; // Changed from assignedTo (ID)
}

export interface Phase {
  id: string;
  name: string;
  objectives: string[];
  start_week: number; // Changed from startWeek
  duration_weeks: number; // Changed from durationWeeks
  status: AuditStatus;
  alert_note?: string; // Changed from alertNote
}

export interface AuditEntity {
  id: string;
  name: string;
  responsible_id: string; // Changed from responsibleId
  scope: string;
  status: AuditStatus;
  progress: number;
  last_updated: string; // Changed from lastUpdated
  start_date: string; // Changed from startDate
  tasks?: Task[]; // Populated via join
  phases?: Phase[]; // Populated via join
}

export interface RiskControl {
  id: string;
  audit_id: string; // New
  entity_name?: string; // Optional/Virtual
  audit_scope?: string; // Optional/Virtual
  tasks?: string; // Description of tasks
  process: string;
  area: string;
  risk_description: string; // Changed from riskDescription
  impact: number;
  probability: number;
  inherent_risk: number; // Changed from inherentRisk
  existing_controls: string; // Changed from existingControls
  control_effectiveness: number; // Changed from controlEffectiveness
  residual_risk: number; // Changed from residualRisk
  traffic_light_level: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'; // Changed from trafficLightLevel
  status: 'Completado' | 'En curso' | 'Pendiente';
  responsible: string;
  implementation_date: string; // Changed from implementationDate
  recommendation: string;
}

export interface CLACriterion {
  id: string;
  audit_id: string; // New
  entity_name?: string; // Optional/Virtual
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

export type ViewType = 'dashboard' | 'schedule' | 'matrix' | 'entidades' | 'personas' | 'planner' | 'cla' | 'areas';

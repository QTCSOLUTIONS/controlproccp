import { AuditEntity, Person, RiskControl, Phase, TaskPlannerEntry, CLACriterion, Task } from './types';

export const SCOPE_OPTIONS = [
  'Planeación de la auditoría',
  'Levantamiento del proceso de compras',
  'Revisión de políticas y procedimientos',
  'Revisión de proveedores',
  'Evaluación del control interno',
  'Selección de muestras',
  'Ejecución de pruebas de auditoría',
  'Analisis de hallazgos',
  'Informe',
  'Cierre',
  'Seguimiento'
];

export const PHASE_OPTIONS = [
  'Fase I - Planificación',
  'Fase II - Levantamiento de información',
  'Fase III - Evaluación y Pruebas',
  'Fase IV - Análisis de Hallazgos',
  'Fase V - Informe y Cierre'
];

export const INITIAL_AREAS = [
  'Compras',
  'Licitación',
  'Almacén',
  'Finanzas',
  'RRHH'
];

export const PEOPLE: Person[] = [
  { id: 'p1', full_name: 'Bladimir Felix', role: 'Audit Manager', avatar_url: 'https://picsum.photos/seed/bladimir/100', email: 'b.felix@controlpro.com' },
  { id: 'p2', full_name: 'Danerys Martinez', role: 'Lead Auditor', avatar_url: 'https://picsum.photos/seed/danerys/100', email: 'd.martinez@controlpro.com' },
  { id: 'p3', full_name: 'Yosmaira Reyes', role: 'Senior Staff', avatar_url: 'https://picsum.photos/seed/yosmaira/100', email: 'y.reyes@controlpro.com' },
  { id: 'p4', full_name: 'Natalia Batista', role: 'Auditor', avatar_url: 'https://picsum.photos/seed/natalia/100', email: 'n.batista@controlpro.com' },
];

export const STANDARD_PHASES: Phase[] = [
  {
    id: 'p1',
    name: 'Fase I - Planificación',
    objectives: ['Definir alcance, metodología y riesgos iniciales.'],
    start_week: 1,
    duration_weeks: 2,
    status: 'Completed'
  },
  {
    id: 'p2',
    name: 'Fase II - Levantamiento de información',
    objectives: ['Recopilar evidencia y comprender procesos.'],
    start_week: 3,
    duration_weeks: 2,
    status: 'Execution'
  },
  {
    id: 'p3',
    name: 'Fase III - Evaluación y Pruebas',
    objectives: ['Validar controles y medir riesgos.'],
    start_week: 5,
    duration_weeks: 3,
    status: 'Planning'
  },
  {
    id: 'p4',
    name: 'Fase IV - Análisis de Hallazgos',
    objectives: ['Consolidar resultados.'],
    start_week: 8,
    duration_weeks: 2,
    status: 'Planning'
  },
  {
    id: 'p5',
    name: 'Fase V - Informe y Cierre',
    objectives: ['Presentar resultados y formalizar cierre.'],
    start_week: 10,
    duration_weeks: 2,
    status: 'Planning'
  }
];

const generateMockTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  const statuses: ('Pending' | 'In Progress' | 'Completed')[] = ['Pending', 'In Progress', 'Completed'];
  for (let i = 0; i < count; i++) {
    tasks.push({
      id: `task-${i}-${Math.random()}`,
      title: `Tarea de auditoría operativa #${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assigned_to: `p${Math.floor(Math.random() * 4) + 1}`
    });
  }
  return tasks;
};

export const MOCK_ENTITIES: AuditEntity[] = [
  {
    id: 'e1',
    name: 'Islacana Investments',
    responsible_id: 'p1',
    scope: 'Auditoría Financiera Anual 2024',
    status: 'Completed',
    progress: 100,
    last_updated: '2024-03-24',
    start_date: '2026-02-16',
    tasks: generateMockTasks(12).map(t => ({ ...t, status: 'Completed' })),
    phases: STANDARD_PHASES.map(p => ({ ...p, status: 'Completed' }))
  },
  {
    id: 'e3',
    name: 'Atlantida (Urbanización)',
    responsible_id: 'p2',
    scope: 'Auditoría de Procesos Urbanísticos y Licencias',
    status: 'Execution',
    progress: 45,
    last_updated: '2024-03-25',
    start_date: '2026-02-16',
    tasks: [
      { id: 't6', title: 'Revisión de Licencias de Obra', status: 'In Progress', assigned_to: 'p2' },
      { id: 't7', title: 'Cotejo de Planos Maestros', status: 'Completed', assigned_to: 'p3' },
      { id: 't8', title: 'Entrevistas de campo', status: 'Pending', assigned_to: 'p3' },
      { id: 't9', title: 'Validación de presupuestos', status: 'In Progress', assigned_to: 'p2' },
    ],
    phases: JSON.parse(JSON.stringify(STANDARD_PHASES))
  },
  {
    id: 'e4',
    name: 'Atlantida (River Island)',
    responsible_id: 'p3',
    scope: 'Auditoría de Control Interno - Desarrollo River Island',
    status: 'Planning',
    progress: 15,
    last_updated: '2024-03-26',
    start_date: '2026-03-02',
    tasks: generateMockTasks(8),
    phases: JSON.parse(JSON.stringify(STANDARD_PHASES))
  },
  {
    id: 'e5',
    name: 'Noval Cortecito (Oceana)',
    responsible_id: 'p4',
    scope: 'Auditoría de Control Interno - Complejo Oceana',
    status: 'Planning',
    progress: 0,
    last_updated: '2024-03-26',
    start_date: '2026-03-16',
    tasks: generateMockTasks(10),
    phases: JSON.parse(JSON.stringify(STANDARD_PHASES))
  }
];

export const RISK_MATRIX: RiskControl[] = [
  {
    id: 'RC-001',
    audit_id: 'e1',
    entity_name: 'Islacana Investments',
    audit_scope: 'Analisis de hallazgos',
    tasks: 'Consolidación de hallazgos preliminares (Reunir todas las observaciones)',
    process: 'Procure-to-Pay',
    area: 'Finanzas',
    risk_description: 'Pagos duplicados a proveedores externos.',
    impact: 4,
    probability: 3,
    inherent_risk: 12,
    existing_controls: 'Conciliación bancaria mensual',
    control_effectiveness: 3,
    residual_risk: 4,
    traffic_light_level: 'Medio',
    status: 'Completado',
    responsible: 'Bladimir Felix',
    implementation_date: '2026-05-15',
    recommendation: 'Implementar software de detección automática de duplicados.'
  },
  {
    id: 'RC-002',
    audit_id: 'e4',
    entity_name: 'Atlantida (River Island)',
    audit_scope: 'Evaluación del control interno',
    tasks: 'Evaluación de segregación de funciones (Solicita vs Aprueba vs Paga)',
    process: 'Nómina',
    area: 'RRHH',
    risk_description: 'Cálculo incorrecto de beneficios por errores manuales.',
    impact: 5,
    probability: 4,
    inherent_risk: 20,
    existing_controls: 'Revisión por par antes de pago',
    control_effectiveness: 2,
    residual_risk: 10,
    traffic_light_level: 'Alto',
    status: 'En curso',
    responsible: 'Danerys Martinez',
    implementation_date: '2026-06-01',
    recommendation: 'Automatizar el cálculo de bonificaciones en el sistema ERP.'
  }
];

export const INITIAL_CLA_DATA: CLACriterion[] = [
  {
    id: 'CLA-001',
    audit_id: 'e1',
    entity_name: 'Islacana Investments',
    area: 'Finanzas',
    criterion: 'C-01',
    description: 'Existencia de manual de políticas contables actualizado.',
    source: 'Manual de Políticas V2.0',
    complies: 'Sí'
  },
  {
    id: 'CLA-002',
    audit_id: 'e4',
    entity_name: 'Atlantida (River Island)',
    area: 'Operaciones',
    criterion: 'C-02',
    description: 'Segregación de funciones en la aprobación de pagos.',
    source: 'Estructura Organizativa',
    complies: 'No'
  }
];

export const INITIAL_PLANNER_DATA: TaskPlannerEntry[] = [
  { id: 'tp1', scope: 'Planeación de la auditoría', task: 'Identificación del marco normativo aplicable (Políticas internas y leyes)', phase: 'Fase I - Planificación' },
  { id: 'tp2', scope: 'Planeación de la auditoría', task: 'Conocimiento del proceso (Levantamiento de información)', phase: 'Fase I - Planificación' },
  { id: 'tp3', scope: 'Planeación de la auditoría', task: 'Identificación de controles existentes (Controles preventivos y detectivos)', phase: 'Fase I - Planificación' },
  { id: 'tp4', scope: 'Levantamiento del proceso de compras', task: 'Identificación del responsable del proceso (Quién autoriza, quién ejecuta)', phase: 'Fase II - Levantamiento de información' },
  { id: 'tp5', scope: 'Levantamiento del proceso de compras', task: 'Entrevista inicial con el área de compras (Entender cómo funciona)', phase: 'Fase II - Levantamiento de información' },
  { id: 'tp6', scope: 'Levantamiento del proceso de compras', task: 'Solicitud del manual o políticas de compras (Validar si están formalizadas)', phase: 'Fase II - Levantamiento de información' },
  { id: 'tp_rev_prov', scope: 'Revisión de proveedores', task: 'Validación de existencia de expediente por proveedor (Documentación legal)', phase: 'Fase II - Levantamiento de información' },
  { id: 'tp7', scope: 'Evaluación del control interno', task: 'Identificación de controles preventivos (Autorizaciones previas)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: 'tp8', scope: 'Evaluación del control interno', task: 'Evaluación de segregación de funciones (Solicita vs Aprueba vs Paga)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: 'tp_riesgo_res', scope: 'Evaluación del control interno', task: 'Determinación del nivel de riesgo residual (Después de aplicar controles)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: 'tp_muestreo', scope: 'Selección de muestras', task: 'Definición del método de muestreo (Aleatorio, dirigido, por juicio)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: 'tp_pruebas', scope: 'Ejecución de pruebas de auditoría', task: 'Verificación de factura vs orden de compra (Coincidencia en montos y descripción)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: 'tp10', scope: 'Analisis de hallazgos', task: 'Consolidación de hallazgos preliminares (Reunir todas las observaciones)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: 'tp11', scope: 'Analisis de hallazgos', task: 'Determinación de la causa raíz (Por qué ocurrió la falla)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: 'tp_informe_draft', scope: 'Informe', task: 'Redacción del borrador del informe (Estructura formal y técnica)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: 'tp_conclusiones', scope: 'Informe', task: 'Elaboración de conclusiones generales (Evaluación global del control)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: 'tp13', scope: 'Cierre', task: 'Presentación de hallazgos finales (Explicación técnica de riesgos)', phase: 'Fase V - Informe y Cierre' },
  { id: 'tp_plan_accion', scope: 'Cierre', task: 'Elaboración del plan de acción definitivo (Con responsables y fechas)', phase: 'Fase V - Informe y Cierre' },
  { id: 'tp_archivo', scope: 'Cierre', task: 'Archivo digital y físico de papeles de trabajo (Organización para consulta)', phase: 'Fase V - Informe y Cierre' },
];

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
    duration_weeks: 3,
    status: 'Execution'
  },
  {
    id: 'p3',
    name: 'Fase III - Evaluación y Pruebas',
    objectives: ['Validar controles y medir riesgos.'],
    start_week: 6,
    duration_weeks: 3,
    status: 'Planning'
  },
  {
    id: 'p4',
    name: 'Fase IV - Análisis de Hallazgos',
    objectives: ['Consolidar resultados.'],
    start_week: 9,
    duration_weeks: 2,
    status: 'Planning'
  },
  {
    id: 'p5',
    name: 'Fase V - Informe y Cierre',
    objectives: ['Presentar resultados y formalizar cierre.'],
    start_week: 11,
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
  { id: '1', scope: 'Planeación de la auditoría', task: 'Identificación del marco normativo aplicable (Políticas internas, manual de compras, ley de contrataciones, reglamentos internos.)', phase: 'Fase I - Planificación' },
  { id: '2', scope: 'Planeación de la auditoría', task: 'Conocimiento del proceso (levantamiento de información)', phase: 'Fase I - Planificación' },
  { id: '3', scope: 'Planeación de la auditoría', task: 'Identificación de controles existentes (Controles preventivos y detectivos.)', phase: 'Fase I - Planificación' },
  { id: '4', scope: 'Levantamiento del proceso de compras', task: 'Identificación del responsable del proceso (Quién autoriza, quién solicita y quién ejecuta)', phase: 'Fase II - Levantamiento de información' },
  { id: '5', scope: 'Levantamiento del proceso de compras', task: 'Entrevista inicial con el área de compras (Entender cómo funciona el proceso en la práctica.)', phase: 'Fase II - Levantamiento de información' },
  { id: '6', scope: 'Levantamiento del proceso de compras', task: 'Solicitud del manual o políticas de compras (Validar si están formalmente documentadas.)', phase: 'Fase II - Levantamiento de información' },
  { id: '7', scope: 'Levantamiento del proceso de compras', task: 'Identificación del flujo del proceso (Desde la requisición hasta el pago)', phase: 'Fase II - Levantamiento de información' },
  { id: '8', scope: 'Levantamiento del proceso de compras', task: 'Levantamiento del flujograma (Documentar gráficamente el proceso actual.)', phase: 'Fase II - Levantamiento de información' },
  { id: '9', scope: 'Levantamiento del proceso de compras', task: 'Identificación de puntos de autorización (Quién aprueba compras menores, mayores y licitaciones.)', phase: 'Fase II - Levantamiento de información' },
  { id: '10', scope: 'Levantamiento del proceso de compras', task: 'Validación del proceso de cotización (Cantidad de cotizaciones requeridas.)', phase: 'Fase II - Levantamiento de información' },
  { id: '11', scope: 'Levantamiento del proceso de compras', task: 'Revisión del sistema utilizado (Software o registros manuales.)', phase: 'Fase II - Levantamiento de información' },
  { id: '12', scope: 'Levantamiento del proceso de compras', task: 'Verificación de segregación de funciones (Solicita ≠ Aprueba ≠ Paga ≠ Recibe.)', phase: 'Fase II - Levantamiento de información' },
  { id: '13', scope: 'Levantamiento del proceso de compras', task: 'Identificación de riesgos preliminares (Fraude, conflicto de interés, sobrevaloración, compras directas.)', phase: 'Fase II - Levantamiento de información' },
  { id: '14', scope: 'Levantamiento del proceso de compras', task: 'Revisión del archivo documental (Expedientes físicos o digitales.)', phase: 'Fase II - Levantamiento de información' },
  { id: '15', scope: 'Levantamiento del proceso de compras', task: 'Documentación de debilidades observadas (Notas preliminares para la matriz de riesgos.)', phase: 'Fase II - Levantamiento de información' },
  { id: '16', scope: 'Revisión de políticas y procedimientos', task: 'Solicitud formal de políticas vigentes (Manual de compras, licitaciones y almacén.)', phase: 'Fase II - Levantamiento de información' },
  { id: '17', scope: 'Revisión de políticas y procedimientos', task: 'Verificación de fecha de actualización (Confirmar si están vigentes o desactualizadas)', phase: 'Fase II - Levantamiento de información' },
  { id: '18', scope: 'Revisión de políticas y procedimientos', task: 'Validación de aprobación formal (Revisar si fueron aprobadas por la autoridad competente)', phase: 'Fase II - Levantamiento de información' },
  { id: '19', scope: 'Revisión de políticas y procedimientos', task: 'Revisión de alineación con normativa aplicable (Ley de contrataciones, reglamentos internos, controles financieros)', phase: 'Fase II - Levantamiento de información' },
  { id: '20', scope: 'Revisión de políticas y procedimientos', task: 'Análisis de claridad y estructura del documento (Si están bien redactadas y no son ambiguas)', phase: 'Fase II - Levantamiento de información' },
  { id: '21', scope: 'Revisión de políticas y procedimientos', task: 'Validación de definición de responsabilidades (Roles claramente establecidos)', phase: 'Fase II - Levantamiento de información' },
  { id: '22', scope: 'Revisión de políticas y procedimientos', task: 'Evaluación de límites de aprobación (Montos autorizados por nivel jerárquico)', phase: 'Fase II - Levantamiento de información' },
  { id: '23', scope: 'Revisión de políticas y procedimientos', task: 'Validación de procedimientos de licitación (Requisitos, tiempos y documentación)', phase: 'Fase II - Levantamiento de información' },
  { id: '24', scope: 'Revisión de políticas y procedimientos', task: 'Revisión de controles establecidos (Controles preventivos y detectivos documentados)', phase: 'Fase II - Levantamiento de información' },
  { id: '25', scope: 'Revisión de políticas y procedimientos', task: 'Evaluación de sanciones o consecuencias (Si existen medidas disciplinarias por incumplimiento.)', phase: 'Fase II - Levantamiento de información' },
  { id: '26', scope: 'Revisión de políticas y procedimientos', task: 'Identificación de brechas entre política y práctica (Comparar lo escrito vs lo observado en levantamiento)', phase: 'Fase II - Levantamiento de información' },
  { id: '27', scope: 'Revisión de proveedores', task: 'Solicitud del listado actualizado de proveedores (Base de datos oficial)', phase: 'Fase II - Levantamiento de información' },
  { id: '28', scope: 'Revisión de proveedores', task: 'Validación de existencia de expediente por proveedor (Documentación física o digital)', phase: 'Fase II - Levantamiento de información' },
  { id: '29', scope: 'Revisión de proveedores', task: 'Verificación de documentos legales (RNC, Registro Mercantil, certificación DGII, etc.)', phase: 'Fase II - Levantamiento de información' },
  { id: '30', scope: 'Revisión de proveedores', task: 'Confirmación de vigencia documental (Confirmación de vigencia documental)', phase: 'Fase II - Levantamiento de información' },
  { id: '31', scope: 'Revisión de proveedores', task: 'Revisión del proceso de registro y aprobación (Quién autoriza su incorporación)', phase: 'Fase II - Levantamiento de información' },
  { id: '32', scope: 'Revisión de proveedores', task: 'Validación de criterios de selección (Si existen parámetros técnicos y financieros definidos.)', phase: 'Fase II - Levantamiento de información' },
  { id: '33', scope: 'Revisión de proveedores', task: 'Evaluación de concentración de compras (Identificar dependencia excesiva de un proveedor.)', phase: 'Fase II - Levantamiento de información' },
  { id: '34', scope: 'Revisión de proveedores', task: 'Revisión de historial de contrataciones (Frecuencia y montos adjudicados.)', phase: 'Fase II - Levantamiento de información' },
  { id: '35', scope: 'Revisión de proveedores', task: 'Verificación de cumplimiento contractual (Entrega, calidad y tiempos.)', phase: 'Fase II - Levantamiento de información' },
  { id: '36', scope: 'Revisión de proveedores', task: 'Evaluación de cotizaciones comparativas (Si se cumplen las tres cotizaciones (cuando aplica).', phase: 'Fase II - Levantamiento de información' },
  { id: '37', scope: 'Revisión de proveedores', task: 'Identificación de posibles conflictos de interés (Vínculos entre empleados y proveedores.)', phase: 'Fase II - Levantamiento de información' },
  { id: '38', scope: 'Revisión de proveedores', task: 'Análisis de variación de precios (Comparación con mercado o períodos anteriores.)', phase: 'Fase II - Levantamiento de información' },
  { id: '39', scope: 'Revisión de proveedores', task: 'Revisión de proveedores recurrentes sin licitación (Justificación documentada.)', phase: 'Fase II - Levantamiento de información' },
  { id: '40', scope: 'Revisión de proveedores', task: 'Evaluación de proveedores inactivos (Depuración de la base de datos)', phase: 'Fase II - Levantamiento de información' },
  { id: '41', scope: 'Revisión de proveedores', task: 'Documentación de hallazgos preliminares (Para incluir en la matriz de riesgos.)', phase: 'Fase II - Levantamiento de información' },
  { id: '42', scope: 'Evaluación del control interno', task: 'Identificación de controles preventivos (Autorizaciones previas, límites de aprobación)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '43', scope: 'Evaluación del control interno', task: 'Identificación de controles detectivos (Revisiones posteriores, conciliaciones, supervisión.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '44', scope: 'Evaluación del control interno', task: 'Evaluación de segregación de funciones (Solicita ≠ Aprueba ≠ Recibe ≠ Registra ≠ Paga.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '45', scope: 'Evaluación del control interno', task: 'Validación de controles en compras menores (Revisión de límites y aprobaciones.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '46', scope: 'Evaluación del control interno', task: 'Evaluación de controles en licitaciones (Comités, actas, criterios formales.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '47', scope: 'Evaluación del control interno', task: 'Verificación de controles en recepción de mercancía (Actas de recepción y validación física.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '48', scope: 'Evaluación del control interno', task: 'Revisión de control de inventarios (Conteos físicos vs registros.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '49', scope: 'Evaluación del control interno', task: 'Evaluación de control presupuestario (Compras vs presupuesto aprobado.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '50', scope: 'Evaluación del control interno', task: 'Pruebas selectivas de cumplimiento (Muestreo de expedientes.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '51', scope: 'Evaluación del control interno', task: 'Validación de controles en el sistema (Permisos y perfiles de usuario.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '52', scope: 'Evaluación del control interno', task: 'Identificación de debilidades de supervisión (Falta de revisión gerencial.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '53', scope: 'Evaluación del control interno', task: 'Evaluación del ambiente de control (Cultura de cumplimiento y ética.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '54', scope: 'Evaluación del control interno', task: 'Determinación del nivel de riesgo residual (Después de aplicar controles existentes.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '55', scope: 'Evaluación del control interno', task: 'Clasificación del nivel de control (Fuerte / Moderado / Débil.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '56', scope: 'Selección de muestras', task: 'Definición del universo a evaluar (Total de compras, licitaciones o movimientos del período.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '57', scope: 'Selección de muestras', task: 'Clasificación del universo por tipo (Compras menores, mayores, licitaciones, urgencias.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '58', scope: 'Selección de muestras', task: 'Determinación del período de análisis (Meses o trimestre a evaluar.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '59', scope: 'Selección de muestras', task: 'Identificación de montos relevantes (Transacciones de alto impacto.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '60', scope: 'Selección de muestras', task: 'Análisis preliminar de riesgos (Áreas con mayor probabilidad de error o fraude.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '61', scope: 'Selección de muestras', task: 'Definición del método de muestreo (Aleatorio, dirigido, por juicio profesional o combinado.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '62', scope: 'Selección de muestras', task: 'Cálculo del tamaño de la muestra (Según volumen y nivel de riesgo.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '63', scope: 'Selección de muestras', task: 'Selección formal de expedientes (Listado documentado de los seleccionados)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '64', scope: 'Selección de muestras', task: 'Validación de representatividad (Que cubra distintos montos y tipos de compra.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '65', scope: 'Selección de muestras', task: 'Documentación del criterio utilizado (Justificación técnica del método aplicado.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '66', scope: 'Selección de muestras', task: 'Registro de la muestra en papeles de trabajo (Para trazabilidad y evidencia.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '67', scope: 'Ejecución de pruebas de auditoría', task: 'Solicitud formal de expedientes seleccionados (Según la muestra definida.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '68', scope: 'Ejecución de pruebas de auditoría', task: 'Verificación de requisición formal (Que exista solicitud debidamente autorizada)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '69', scope: 'Ejecución de pruebas de auditoría', task: 'Validación de cotizaciones requeridas (Cantidad mínima exigida por política.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '70', scope: 'Ejecución de pruebas de auditoría', task: 'Confirmación de evaluación comparativa (Cuadro comparativo documentado.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '71', scope: 'Ejecución de pruebas de auditoría', task: 'Revisión de aprobación jerárquica (Firmas y niveles de autorización.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '72', scope: 'Ejecución de pruebas de auditoría', task: 'Validación de contrato u orden de compra (Existencia y formalidad del documento.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '73', scope: 'Ejecución de pruebas de auditoría', task: 'Verificación de recepción de bienes/servicios (Acta o evidencia de recepción.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '74', scope: 'Ejecución de pruebas de auditoría', task: 'Revisión de factura vs orden de compra (Coincidencia en monto, cantidad y concepto.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '75', scope: 'Ejecución de pruebas de auditoría', task: 'Validación de registro contable (Correcta imputación de cuentas.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '76', scope: 'Ejecución de pruebas de auditoría', task: 'Confirmación de pago realizado (Transferencia, cheque o comprobante)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '77', scope: 'Ejecución de pruebas de auditoría', task: 'Verificación de cumplimiento presupuestario (Si la compra estaba dentro del presupuesto aprobado.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '78', scope: 'Ejecución de pruebas de auditoría', task: 'Evaluación de tiempos del proceso (Desde solicitud hasta pago.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '79', scope: 'Ejecución de pruebas de auditoría', task: 'Identificación de desviaciones (Compras directas injustificadas, fraccionamiento, sobrevaloración)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '80', scope: 'Ejecución de pruebas de auditoría', task: 'Documentación de evidencia en papeles de trabajo (Soporte físico o digital.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '81', scope: 'Ejecución de pruebas de auditoría', task: 'Registro formal de hallazgos preliminares (Para matriz de hallazgos.)', phase: 'Fase III - Evaluación y Pruebas' },
  { id: '82', scope: 'Analisis de hallazgos', task: 'Consolidación de hallazgos preliminares (Reunir todas las observaciones detectadas en ejecución.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '83', scope: 'Analisis de hallazgos', task: 'Clasificación por tipo (Operativo, financiero, normativo o de control interno)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '84', scope: 'Analisis de hallazgos', task: 'Validación de evidencia suficiente y competente (Confirmar que cada hallazgo tiene soporte documental.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '85', scope: 'Analisis de hallazgos', task: 'Redacción técnica de la condición (Qué ocurrió exactamente.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '86', scope: 'Analisis de hallazgos', task: 'Identificación del criterio incumplido (Política, norma o procedimiento vulnerado.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '87', scope: 'Analisis de hallazgos', task: 'Determinación de la causa raíz (Por qué ocurrió (falta de supervisión, desconocimiento, debilidad del sistema).', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '88', scope: 'Analisis de hallazgos', task: 'Clasificación del nivel de riesgo (Bajo / Medio / Alto (o escala numérica).)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '89', scope: 'Analisis de hallazgos', task: 'Agrupación de hallazgos similares (Evitar duplicidad y mejorar claridad.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '90', scope: 'Analisis de hallazgos', task: 'Formulación de recomendaciones preliminares (Acciones correctivas sugeridas.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '91', scope: 'Analisis de hallazgos', task: 'Validación interna con el equipo auditor (Revisión antes de emitir informe formal.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '92', scope: 'Informe', task: 'Consolidación final de hallazgos (Revisión definitiva de todos los hallazgos aprobados.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '93', scope: 'Informe', task: 'Validación de evidencia documental (Confirmar que cada hallazgo tiene soporte suficiente.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '94', scope: 'Informe', task: 'Redacción del borrador del informe (Estructura formal y técnica.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '95', scope: 'Informe', task: 'Elaboración del resumen ejecutivo (Principales riesgos y conclusiones estratégicas.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '96', scope: 'Informe', task: 'Redacción de la introducción (Objetivo, alcance y metodología aplicada.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '97', scope: 'Informe', task: 'Presentación detallada de hallazgos (Condición, criterio, causa, efecto y recomendación.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '98', scope: 'Informe', task: 'Inclusión de matriz de hallazgos (Tabla resumen con nivel de riesgo y responsables.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '99', scope: 'Informe', task: 'Elaboración de conclusiones generales (Evaluación global del proceso CLA.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '100', scope: 'Informe', task: 'Incorporación de anexos (Evidencias, tablas, gráficos, flujogramas.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '101', scope: 'Informe', task: 'Revisión interna del informe (Validación por la Coordinación de Auditoría.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '102', scope: 'Informe', task: 'Envío del borrador al área auditada (Para comentarios o descargos (si aplica).', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '103', scope: 'Informe', task: 'Emisión del informe final (Versión firmada y formal.)', phase: 'Fase IV - Análisis de Hallazgos' },
  { id: '104', scope: 'Cierre', task: 'Reunión de cierre con el área auditada (Presentación formal de resultados.)', phase: 'Fase V - Informe y Cierre' },
  { id: '105', scope: 'Cierre', task: 'Presentación de hallazgos finales (Explicación técnica de riesgos y recomendaciones.)', phase: 'Fase V - Informe y Cierre' },
  { id: '106', scope: 'Cierre', task: 'Recepción de comentarios o descargos (Documentar respuestas del área auditada.)', phase: 'Fase V - Informe y Cierre' },
  { id: '107', scope: 'Cierre', task: 'Ajustes finales al informe (Incorporar aclaraciones válidas.)', phase: 'Fase V - Informe y Cierre' },
  { id: '108', scope: 'Cierre', task: 'Aprobación formal del informe (Firma de Coordinación o Dirección.)', phase: 'Fase V - Informe y Cierre' },
  { id: '109', scope: 'Cierre', task: 'Emisión y distribución oficial (Envío a gerencia y partes interesadas.)', phase: 'Fase V - Informe y Cierre' },
  { id: '110', scope: 'Cierre', task: 'Elaboración del plan de acción definitivo (Con responsables y fechas compromiso.)', phase: 'Fase V - Informe y Cierre' },
  { id: '111', scope: 'Cierre', task: 'Registro en matriz de seguimiento (Ingreso de hallazgos en sistema de control.)', phase: 'Fase V - Informe y Cierre' },
  { id: '112', scope: 'Cierre', task: 'Archivo digital y físico de papeles de trabajo (Organización formal de expediente.)', phase: 'Fase V - Informe y Cierre' },
  { id: '113', scope: 'Cierre', task: 'Programación de auditoría de seguimiento (Definir fecha para verificación futura.)', phase: 'Fase V - Informe y Cierre' },
  { id: '114', scope: 'Seguimiento', task: 'Elaboración del cronograma de seguimiento (Definir fechas de verificación.)', phase: 'Fase V - Informe y Cierre' },
  { id: '115', scope: 'Seguimiento', task: 'Solicitud formal de avances al área auditada (Requerir evidencia de implementación.)', phase: 'Fase V - Informe y Cierre' },
  { id: '116', scope: 'Seguimiento', task: 'Recepción y revisión de evidencias (Documentos, procedimientos actualizados, controles aplicados.)', phase: 'Fase V - Informe y Cierre' },
  { id: '117', scope: 'Seguimiento', task: 'Validación de implementación real (Confirmar que no sea solo documental.)', phase: 'Fase V - Informe y Cierre' },
  { id: '118', scope: 'Seguimiento', task: 'Verificación de cumplimiento de fechas compromiso (Comparar vs plan de acción aprobado.)', phase: 'Fase V - Informe y Cierre' },
  { id: '119', scope: 'Seguimiento', task: 'Evaluación de efectividad de la acción correctiva (Determinar si realmente mitigó el riesgo.)', phase: 'Fase V - Informe y Cierre' },
  { id: '120', scope: 'Seguimiento', task: 'Reaplicación de pruebas (si aplica) (Para confirmar corrección.)', phase: 'Fase V - Informe y Cierre' },
  { id: '121', scope: 'Seguimiento', task: 'Actualización del estado del hallazgo (Abierto / En proceso / Cerrado.)', phase: 'Fase V - Informe y Cierre' },
  { id: '122', scope: 'Seguimiento', task: 'Reclasificación del nivel de riesgo (Si disminuyó o permanece.)', phase: 'Fase V - Informe y Cierre' },
  { id: '123', scope: 'Seguimiento', task: 'Identificación de hallazgos recurrentes (Detectar incumplimientos repetitivos.)', phase: 'Fase V - Informe y Cierre' },
  { id: '124', scope: 'Seguimiento', task: 'Elaboración de informe de seguimiento (Resumen de avances y pendientes.)', phase: 'Fase V - Informe y Cierre' },
  { id: '125', scope: 'Seguimiento', task: 'Comunicación formal a gerencia (Reporte del estado general de cumplimiento.)', phase: 'Fase V - Informe y Cierre' },
];

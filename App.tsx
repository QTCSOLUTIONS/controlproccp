import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, AuditEntity, Person, AuditStatus, Phase, TaskPlannerEntry, RiskControl, CLACriterion } from './types';
import { STANDARD_PHASES, INITIAL_AREAS } from './constants';
import Dashboard from './components/DashboardComp';
import Schedule from './components/ScheduleComp';
import RiskMatrix from './components/RiskMatrixComp';
import EntityList from './components/EntityListComp';
import PeopleList from './components/PeopleListComp';
import TaskPlanner from './components/TaskPlannerComp';
import CLACriteria from './components/CLACriteriaComp';
import AreasConfig from './components/AreasConfigComp';
import Sidebar from './components/SidebarComp';
import Header from './components/HeaderComp';
import NewEntityModal from './components/NewEntityModal';
import EditEntityModal from './components/EditEntityModal';
import NewPersonModal from './components/NewPersonModal';
import EditPersonModal from './components/EditPersonModal';
import LoginComp from './components/LoginComp';
import UserManagement from './components/UserManagementComp';
import { api } from './src/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster, toast } from 'sonner';

const ControlProApp: React.FC = () => {
  const { session, loading: authLoading, dbUser } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State for data
  const [entities, setEntities] = useState<AuditEntity[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [plannerData, setPlannerData] = useState<TaskPlannerEntry[]>([]);
  const [risks, setRisks] = useState<RiskControl[]>([]);
  const [claCriteria, setClaCriteria] = useState<CLACriterion[]>([]);
  const [areas, setAreas] = useState<string[]>(INITIAL_AREAS);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState<AuditEntity | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  // Determine Role (Normalized for case-sensitivity)
  const userEmail = session?.user?.email?.toLowerCase();
  const isMaster = userEmail === 'ccp@qtc-solutions.com' || userEmail === 'ccp@qtc-soluitons.com' || dbUser?.role === 'MASTER';
  const isPlanificadora = dbUser?.role === 'Planificadora';
  const isAuditor = dbUser?.role === 'Auditor';

  // Fetch initial data
  useEffect(() => {
    if (!session) return; // Don't fetch if not logged in

    const fetchData = async () => {
      setLoading(true);
      try {
        const [peopleData, auditsData, areasData, plannerData, risksData, claData] = await Promise.all([
          api.getPeople(),
          api.getAudits(),
          api.getAreas(),
          api.getPlannerEntries(),
          api.getRisks(),
          api.getClaCriteria()
        ]);

        setPeople(peopleData || []);
        setEntities(auditsData || []);
        if (areasData && areasData.length > 0) setAreas(areasData);
        setPlannerData(plannerData || []);
        setRisks(risksData || []);
        setClaCriteria(claData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const entityNames = useMemo(() => entities.map(e => e.name), [entities]);

  // Filter Entities based on Role AND Search
  const filteredEntities = useMemo(() => {
    let result = entities;

    // RBAC Filtering
    if (isAuditor && dbUser) {
      result = result.filter(e => e.responsible_id === dbUser.id);
    }
    // Planificadora and Master see all

    // Search Filtering
    return result.filter(e => searchTerm === '' || e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [entities, searchTerm, isAuditor, dbUser]);

  // Filter Risks based on Visible Entities AND Search
  const filteredRisks = useMemo(() => {
    // Only show risks for visible entities
    const visibleEntityIds = new Set(filteredEntities.map(e => e.id));

    return risks.filter(r => {
      const matchesEntity = visibleEntityIds.has(r.audit_id);
      const matchesSearch = searchTerm === '' ||
        (r.entity_name && r.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.risk_description && r.risk_description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesEntity && matchesSearch;
    });
  }, [risks, filteredEntities, searchTerm]);

  // Filter CLA Criteria based on Visible Entities AND Search
  const filteredClaCriteria = useMemo(() => {
    // Only show criteria for visible entities
    const visibleEntityIds = new Set(filteredEntities.map(e => e.id));

    return claCriteria.filter(c => {
      const matchesEntity = visibleEntityIds.has(c.audit_id);
      const matchesSearch = searchTerm === '' ||
        (c.entity_name && c.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.criterion && c.criterion.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesEntity && matchesSearch;
    });
  }, [claCriteria, filteredEntities, searchTerm]);

  const filteredPeople = useMemo(() => {
    if (searchTerm === '') return people;
    // Search people by name or if they are responsible for the searched entity
    const assignedId = entities.find(e => e.name.toLowerCase() === searchTerm.toLowerCase())?.responsible_id;
    return people.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id === assignedId);
  }, [people, entities, searchTerm]);

  const handleAddEntity = async (newEntity: Partial<AuditEntity>) => {
    // Strip fake ID if present so Supabase generates a real UUID
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...entityData } = newEntity;

    try {
      const created = await api.createAudit(entityData);
      setEntities([...entities, created]);
      setIsEntityModalOpen(false);
      toast.success('Auditoría creada correctamente');
    } catch (e: any) {
      console.error("Error creating audit", e);
      toast.error(`Error creating audit: ${e.message}`);
    }
  };

  const handleUpdateEntity = async (updatedEntity: AuditEntity) => {
    try {
      console.log("Starting entity update for ID:", updatedEntity.id, updatedEntity);
      const updated = await api.updateAudit(updatedEntity.id, updatedEntity);
      // Replace the entire object to ensure we get real IDs from the DB
      setEntities(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEntityToEdit(null);
      toast.success('Auditoría actualizada y sincronizada correctamente');
    } catch (e: any) {
      console.error("Error updating audit:", e);
      toast.error(`Error al actualizar auditoría: ${e.message}`);
    }
  };

  const refreshPeople = async () => {
    const data = await api.getPeople();
    setPeople(data || []);
  };

  const handleAddPerson = async (newPerson: Person) => {
    // Strip the fake ID generated by the modal locally
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...personData } = newPerson;

    try {
      const created = await api.createPerson(personData);
      setPeople([...people, created]);
      setIsPersonModalOpen(false);
      toast.success('Persona creada correctamente');
    } catch (e: any) {
      console.error("Error creating person", e);
      toast.error(`Error al crear persona: ${e.message}`);
    }
  };

  const handleUpdatePerson = async (updatedPerson: Person) => {
    try {
      const updated = await api.updatePerson(updatedPerson.id, updatedPerson);
      setPeople(people.map(p => p.id === updated.id ? updated : p));
      setPersonToEdit(null);
      toast.success('Persona actualizada correctamente');
    } catch (e: any) {
      console.error("Error updating person", e);
      toast.error(`Error al actualizar persona: ${e.message}`);
    }
  };

  const handleDeletePerson = async (id: string) => {
    try {
      await api.deletePerson(id);
      setPeople(people.filter(p => p.id !== id));
      toast.success('Usuario eliminado correctamente');
    } catch (e: any) {
      console.error("Error deleting person", e);
      toast.error(`Error al eliminar usuario: ${e.message}`);
    }
  };

  const handleAddArea = async (newArea: string) => {
    if (newArea && !areas.includes(newArea)) {
      try {
        await api.createArea(newArea);
        setAreas([...areas, newArea]);
        toast.success('Área creada correctamente');
      } catch (e: any) {
        console.error("Error creating area", e);
        toast.error(`Error al crear área: ${e.message}`);
      }
    }
  };

  const handleUpdatePhase = async (entityId: string, updatedPhase: Phase) => {
    // 1. Calculate new phases state locally to update UI immediately and determine what to save
    const currentEntity = entities.find(e => e.id === entityId);
    if (!currentEntity) return;

    // Sort phases by Name (Fase I, II, III...) to ensure correct waterfall sequence regardless of current weeks.
    // This prevents issues if the 'start_week' data is currently desynchronized.
    const sortedPhases = [...(currentEntity.phases || [])].sort((a, b) => a.name.localeCompare(b.name));

    let currentStartWeek = 1;
    let hasChanges = false;

    const calculatedPhases = sortedPhases.map(p => {
      const isTarget = p.id === updatedPhase.id;
      // If it's the target, use the new duration, otherwise keep existing
      const duration_weeks = isTarget ? updatedPhase.duration_weeks : p.duration_weeks;

      // Check for standard deviation
      const standard = STANDARD_PHASES.find(sp => sp.name === p.name);
      // Use null instead of undefined for clearing to ensure it sends to Supabase
      let alert_note: string | null | undefined = isTarget ? updatedPhase.alert_note : p.alert_note;

      if (standard && duration_weeks !== standard.duration_weeks) {
        alert_note = `ALERTA: Duración modificada de ${standard.duration_weeks} a ${duration_weeks} semanas. Planificado original: ${standard.duration_weeks}.`;
      } else if (standard && duration_weeks === standard.duration_weeks) {
        alert_note = null; // Explicitly set to null to clear in DB
      }

      // Calculate new start_week based on cumulative progress
      const new_start_week = currentStartWeek;

      // Update accumulator for next phase
      currentStartWeek += duration_weeks;

      // Determine if this specific phase has changed from what is in the DB/State
      const isAlertChanged = (p.alert_note || null) !== (alert_note || null);

      if (
        p.start_week !== new_start_week ||
        p.duration_weeks !== duration_weeks ||
        isAlertChanged ||
        (isTarget && p.status !== updatedPhase.status)
      ) {
        hasChanges = true;
      }

      return {
        ...p,
        ...(isTarget ? updatedPhase : {}), // Apply any other target updates
        start_week: new_start_week,
        duration_weeks,
        alert_note: alert_note as string | undefined // Cast back for state, but payload will handle null
      };
    });

    if (!hasChanges) return;

    // Guardar estado anterior para rollback
    const previousEntities = [...entities];

    // 2. Optimistic Update
    setEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity;
      return {
        ...entity,
        phases: calculatedPhases
      };
    }));

    // 3. Persist to Backend
    try {
      const updatePromises = calculatedPhases.map(p => {
        // Find original to check if update is needed
        const original = sortedPhases.find(op => op.id === p.id);

        // Update if:
        // 1. It is the target phase
        // 2. Its start_week key changed
        // 3. Its alert_note changed
        const needsUpdate =
          p.id === updatedPhase.id ||
          (original && original.start_week !== p.start_week) ||
          (original && (original.alert_note || null) !== (p.alert_note || null));

        if (needsUpdate) {
          // Guard: Ensure we have a real UUID. Fake IDs usually start with 'p' or are very short.
          if (!p.id || p.id.startsWith('p') || p.id.length < 20) {
            console.error("Refusing to update phase with fake ID:", p.id);
            throw new Error(`La fase "${p.name}" aún no tiene un ID de base de datos válido. Por favor, recargue la página o guarde los cambios de la entidad primero.`);
          }

          // Ensure we send null for alert_note if it was cleared
          const payload = {
            audit_id: entityId, // Restore audit_id for UPSERT compatibility
            start_week: p.start_week,
            duration_weeks: p.duration_weeks,
            alert_note: p.alert_note === undefined ? null : p.alert_note,
            status: p.status
          };
          console.log(`Sending update for phase ${p.id} (Entity: ${entityId}):`, payload);
          return api.updatePhase(p.id, payload as any);
        }
        return Promise.resolve(p);
      });

      await Promise.all(updatePromises);

      // 4. SYNC: Fetch the individual entity again to get the final DB state
      // This is crucial if DB triggers modified anything or if we need to confirm persistence.
      const freshAudits = await api.getAudits();
      setEntities(freshAudits);

      toast.success('Cronograma recalculado y guardado');
    } catch (e: any) {
      console.error("Error updating phases sequence", e);
      // Revert optimistic update
      setEntities(previousEntities);

      const errorMessage = e.message || e.error_description || 'Error desconocido';
      toast.error(`Error al guardar el calendario: ${errorMessage}`, {
        duration: 5000,
      });
    }
  };

  const handleUpdatePhaseStatus = async (entityId: string, phaseId: string, nextStatus: AuditStatus) => {
    try {
      await api.updatePhase(phaseId, { status: nextStatus });
      setEntities(prev => prev.map(entity => {
        if (entity.id !== entityId) return entity;
        return {
          ...entity,
          phases: entity.phases?.map(phase =>
            phase.id === phaseId ? { ...phase, status: nextStatus } : phase
          ) || []
        };
      }));
    } catch (e) {
      console.error("Error updating phase status", e);
    }
  };

  const getTitle = (view: ViewType) => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'schedule': return 'Calendario';
      case 'planner': return 'Planificador de Tareas';
      case 'matrix': return 'Matriz de Riesgos';
      case 'entidades': return 'Entidades';
      case 'personas': return 'Equipo';
      case 'cla': return 'Criterios de CLA';
      case 'areas': return 'Configuración de Áreas';
      case 'users': return 'Gestión de Usuarios';
      default: return 'ControlPro';
    }
  };

  const handleViewEntityDetails = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      setSearchTerm(entity.name);
      setActiveView('matrix');
    }
  };

  // Auth Protection Logic
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#0a192f] text-white">
      <div className="flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Verificando sesión...</p>
      </div>
    </div>;
  }

  if (!session) {
    return <LoginComp />;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0a192f] text-white">
      <div className="flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Cargando Sistema...</p>
      </div>
    </div>;
  }

  // View Access Control
  // If activeView is 'users' but not master, redirect to dashboard
  if (activeView === 'users' && !isMaster) {
    setActiveView('dashboard');
  }
  // If activeView is 'areas' but not master/planificadora, redirect to dashboard
  if (activeView === 'areas' && !(isMaster || isPlanificadora)) {
    setActiveView('dashboard');
  }


  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Toaster richColors position="top-right" />
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewTitle={getTitle(activeView)}
          onNewAudit={() => setIsEntityModalOpen(true)}
          showCreateButton={
            (activeView === 'entidades' && (isMaster || isPlanificadora)) || // Only Master/Planificadora can add entities
            (activeView === 'personas' && (isMaster || isPlanificadora)) || // Only Master/Planificadora can add people
            (activeView !== 'dashboard' && activeView !== 'personas' && activeView !== 'planner' && activeView !== 'matrix' && activeView !== 'cla' && activeView !== 'areas' && activeView !== 'users')
          }
          showNotifications={
            activeView !== 'dashboard' &&
            activeView !== 'personas' &&
            activeView !== 'entidades' &&
            activeView !== 'schedule' &&
            activeView !== 'planner' &&
            activeView !== 'areas' &&
            activeView !== 'users'
          }
          entities={entityNames}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeView === 'dashboard' && <Dashboard entities={filteredEntities} risks={filteredRisks} />}
          {activeView === 'schedule' && (
            <Schedule
              entities={filteredEntities}
              onUpdatePhaseStatus={handleUpdatePhaseStatus}
              onUpdatePhase={handleUpdatePhase}
              onEditEntity={isMaster || isPlanificadora ? setEntityToEdit : undefined} // Auditors cannot edit entities directly here
            />
          )}
          {activeView === 'planner' && <TaskPlanner data={plannerData} onUpdate={setPlannerData} />}
          {activeView === 'matrix' && (
            <RiskMatrix
              entities={entities.filter(e => filteredEntities.some(fe => fe.id === e.id))} // Ensure dropdowns only show allowed entities
              risks={filteredRisks}
              onUpdate={setRisks}
              areas={areas}
              onAddArea={handleAddArea}
              plannerData={plannerData}
              filterEntityName={searchTerm !== '' ? searchTerm : null}
              onClearFilter={() => setSearchTerm('')}
              people={people}
            />
          )}
          {activeView === 'cla' && (
            <CLACriteria
              criteria={filteredClaCriteria}
              entities={entities.filter(e => filteredEntities.some(fe => fe.id === e.id))}
              areas={areas}
              onAddArea={handleAddArea}
              onUpdate={setClaCriteria}
              filterEntityName={searchTerm !== '' ? searchTerm : null}
              onClearFilter={() => setSearchTerm('')}
            />
          )}
          {activeView === 'areas' && (isMaster || isPlanificadora) && <AreasConfig areas={areas} onUpdateAreas={setAreas} />}
          {activeView === 'entidades' && (
            <EntityList
              entities={filteredEntities}
              onAddClick={isMaster || isPlanificadora ? () => setIsEntityModalOpen(true) : undefined}
              people={people}
              onViewDetails={handleViewEntityDetails}
              onEditClick={(entity) => (isMaster || isPlanificadora) ? setEntityToEdit(entity) : null}
            />
          )}
          {activeView === 'personas' && (
            <PeopleList
              people={filteredPeople}
              entities={entities}
              onAddPersonClick={isMaster ? () => setIsPersonModalOpen(true) : undefined}
              onEditPerson={isMaster ? setPersonToEdit : undefined}
            />
          )}
          {activeView === 'users' && isMaster && (
            <UserManagement
              users={people}
              onUserUpdated={refreshPeople}
              onDeleteUser={handleDeletePerson}
            />
          )}
        </main>
      </div>

      {isEntityModalOpen && (
        <NewEntityModal
          onClose={() => setIsEntityModalOpen(false)}
          onSave={handleAddEntity}
          people={people}
        />
      )}

      {entityToEdit && (
        <EditEntityModal
          entity={entityToEdit}
          onClose={() => setEntityToEdit(null)}
          onSave={handleUpdateEntity}
          people={people}
        />
      )}

      {isPersonModalOpen && (
        <NewPersonModal
          onClose={() => setIsPersonModalOpen(false)}
          onSave={handleAddPerson}
        />
      )}

      {personToEdit && (
        <EditPersonModal
          person={personToEdit}
          onClose={() => setPersonToEdit(null)}
          onSave={handleUpdatePerson}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ControlProApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

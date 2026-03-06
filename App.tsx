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
      console.log("[App] Starting entity update for ID:", updatedEntity.id);
      console.log("[App] Payload received from Modal:", updatedEntity);

      const updated = await api.updateAudit(updatedEntity.id, updatedEntity);

      console.log("[App] Entity updated successfully. API Response:", updated);

      // Replace the entire object to ensure we get real IDs from the DB
      setEntities(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEntityToEdit(null);
      toast.success('Auditoría actualizada y sincronizada correctamente');
    } catch (e: any) {
      console.error("[App] Error updating audit:", e);
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

  const handleUpdateClaCriteria = async (newCriteria: CLACriterion[]) => {
    setLoading(true);
    try {
      // 1. Find deleted items
      const deletedIds = claCriteria
        .filter(old => !newCriteria.find(nw => nw.id === old.id))
        .map(old => old.id);

      // 2. Identify new and modified items
      const createdItems = newCriteria.filter(item => item.id.startsWith('CLA-'));
      const updatedItems = newCriteria.filter(item => {
        if (item.id.startsWith('CLA-')) return false;
        const original = claCriteria.find(old => old.id === item.id);
        if (!original) return false;
        // Compare relevant fields to detect changes
        return (
          original.area !== item.area ||
          original.criterion !== item.criterion ||
          original.description !== item.description ||
          original.complies !== item.complies ||
          original.source !== item.source ||
          original.audit_id !== item.audit_id
        );
      });

      console.log(`[CLA Sync] Submitting: ${createdItems.length} new, ${updatedItems.length} updated, ${deletedIds.length} deleted.`);

      await Promise.all([
        ...deletedIds.map(id => api.deleteCla(id)),
        ...createdItems.map(item => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, entity_name, ...data } = item;
          return api.createCla(data);
        }),
        ...updatedItems.map(item => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, entity_name, ...data } = item;
          return api.updateCla(id, data);
        })
      ]);

      const freshCla = await api.getClaCriteria();
      setClaCriteria(freshCla);
      toast.success('Criterios de CLA guardados correctamente');
    } catch (error: any) {
      console.error("Error saving CLA criteria:", error);
      toast.error(`Error al guardar criterios de CLA: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRisks = async (newRisks: RiskControl[]) => {
    setLoading(true);
    try {
      // 1. Identify items to delete
      // We should only delete items that were ALREADY in the filtered view but are now missing
      // If no filter is active, we can compare against all risks
      const currentViewIds = searchTerm === ''
        ? risks.map(r => r.id)
        : risks.filter(risk =>
          risk.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          risk.risk_description?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(r => r.id);

      // 2. Identify new items (starting with RC-)
      const createdItems = newRisks.filter(item => item.id.startsWith('RC-'));
      const deletedIds = currentViewIds
        .filter(oldId => !newRisks.find(item => item.id === oldId));

      const updatedItems = newRisks.filter(item => {
        if (item.id.startsWith('RC-')) return false;
        const original = risks.find(old => old.id === item.id);
        if (!original) return false;

        // Compare relevant fields to detect changes
        const hasChanged = (
          original.entity_name !== item.entity_name ||
          original.audit_id !== item.audit_id ||
          original.audit_scope !== item.audit_scope ||
          original.tasks !== item.tasks ||
          original.process !== item.process ||
          original.area !== item.area ||
          original.risk_description !== item.risk_description ||
          original.impact !== item.impact ||
          original.probability !== item.probability ||
          original.existing_controls !== item.existing_controls ||
          original.control_effectiveness !== item.control_effectiveness ||
          original.status !== item.status ||
          original.responsible !== item.responsible ||
          original.implementation_date !== item.implementation_date ||
          original.recommendation !== item.recommendation
        );
        return hasChanged;
      });

      console.log(`[Risk Sync] Submitting: ${createdItems.length} new, ${updatedItems.length} updated, ${deletedIds.length} deleted.`);

      if (createdItems.length > 0) console.log('[Risk Sync] Creating:', createdItems);
      if (updatedItems.length > 0) console.log('[Risk Sync] Updating:', updatedItems);
      if (deletedIds.length > 0) console.log('[Risk Sync] Deleting IDs:', deletedIds);

      await Promise.all([
        ...deletedIds.map(async (id) => {
          try {
            await api.deleteRisk(id);
          } catch (err) {
            console.error(`[Risk Sync] Error deleting risk ${id}:`, err);
            throw err;
          }
        }),
        ...createdItems.map(async (item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, entity_name, audit, tasks, ...data } = item as any;
          // Sanitize numeric fields for DB (integers)
          const sanitizedData = {
            ...data,
            impact: Math.max(1, Math.round(Number(data.impact) || 1)),
            probability: Math.max(1, Math.round(Number(data.probability) || 1)),
            inherent_risk: Math.round(Number(data.inherent_risk) || 1),
            control_effectiveness: Math.max(1, Math.round(Number(data.control_effectiveness) || 1)),
            residual_risk: Number(data.residual_risk) || 0
          };
          console.log('[Risk Sync] Sending Create Payload:', sanitizedData);
          try {
            const result = await api.createRisk(sanitizedData);
            console.log('[Risk Sync] Create Success:', result);
            return result;
          } catch (err) {
            console.error('[Risk Sync] Create Error:', err);
            throw err;
          }
        }),
        ...updatedItems.map(async (item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, entity_name, audit, tasks, ...data } = item as any;
          // Sanitize numeric fields for DB (integers)
          const sanitizedData = {
            ...data,
            impact: Math.max(1, Math.round(Number(data.impact) || 1)),
            probability: Math.max(1, Math.round(Number(data.probability) || 1)),
            inherent_risk: Math.round(Number(data.inherent_risk) || 1),
            control_effectiveness: Math.max(1, Math.round(Number(data.control_effectiveness) || 1)),
            residual_risk: Number(data.residual_risk) || 0
          };
          console.log(`[Risk Sync] Sending Update Payload for ${id}:`, sanitizedData);
          try {
            const result = await api.updateRisk(id, sanitizedData);
            console.log(`[Risk Sync] Update Success for ${id}:`, result);
            return result;
          } catch (err) {
            console.error(`[Risk Sync] Update Error for ${id}:`, err);
            throw err;
          }
        })
      ]);

      const freshRisks = await api.getRisks();
      setRisks(freshRisks);
      toast.success('Matriz de riesgos guardada correctamente');
    } catch (error: any) {
      console.error('[Risk Sync] Overall Sync Error:', error);
      toast.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhase = async (entityId: string, updatedPhase: Phase) => {
    // 1. Calculate new phases state locally to update UI immediately and determine what to save
    const currentEntity = entities.find(e => e.id === entityId);
    if (!currentEntity) return;

    const sortedPhases = [...(currentEntity.phases || [])].sort((a, b) => a.name.localeCompare(b.name));

    let currentStartWeek = 1;
    let hasChanges = false;

    const calculatedPhases = sortedPhases.map(p => {
      const isTarget = p.id === updatedPhase.id;
      const duration_weeks = isTarget ? updatedPhase.duration_weeks : p.duration_weeks;

      const standard = STANDARD_PHASES.find(sp => sp.name === p.name);
      let alert_note: string | null | undefined = isTarget ? updatedPhase.alert_note : p.alert_note;

      if (standard && duration_weeks !== standard.duration_weeks) {
        alert_note = `ALERTA: Duración modificada de ${standard.duration_weeks} a ${duration_weeks} semanas. Planificado original: ${standard.duration_weeks}.`;
      } else if (standard && duration_weeks === standard.duration_weeks) {
        alert_note = null;
      }

      const new_start_week = currentStartWeek;
      currentStartWeek += duration_weeks;

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
        ...(isTarget ? updatedPhase : {}),
        start_week: new_start_week,
        duration_weeks,
        alert_note: alert_note as string | undefined
      };
    });

    if (!hasChanges) return;

    // Guardar estado anterior para rollback
    const previousEntities = [...entities];

    // 2. Optimistic Update
    setEntities(prev => prev.map(entity => {
      if (entity.id !== entityId) return entity;
      return { ...entity, phases: calculatedPhases };
    }));

    // 3. Persist to Backend
    try {
      // Instead of updating all at once and then fetching, let's update and capture results to maintain consistency
      const results = await Promise.all(calculatedPhases.map(async (p) => {
        const original = sortedPhases.find(op => op.id === p.id);
        const needsUpdate =
          p.id === updatedPhase.id ||
          (original && original.start_week !== p.start_week) ||
          (original && (original.alert_note || null) !== (p.alert_note || null));

        if (needsUpdate) {
          if (!p.id || p.id.startsWith('p') || p.id.length < 20) {
            throw new Error(`La fase "${p.name}" aún no tiene un ID de base de datos válido.`);
          }

          const payload = {
            start_week: p.start_week,
            duration_weeks: p.duration_weeks,
            status: p.status,
            alert_note: p.alert_note || null
          };

          return await api.updatePhase(p.id, payload as any);
        }
        return p;
      }));

      // 4. Update the specific entity in state with the confirmed results from the DB
      setEntities(prev => prev.map(entity => {
        if (entity.id !== entityId) return entity;
        return { ...entity, phases: results };
      }));

      // 5. Final Background Sync (Crucial)
      const freshAudits = await api.getAudits();
      setEntities(freshAudits);

      toast.success('Cronograma recalculado y guardado');
    } catch (e: any) {
      console.error("Error updating phases sequence", e);
      setEntities(previousEntities);
      toast.error(`Error al guardar: ${e.message || 'Error desconocido'}`);
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
          {activeView === 'dashboard' && (
            <Dashboard
              entities={filteredEntities}
              risks={filteredRisks}
              claCriteria={claCriteria}
            />
          )}
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
              onUpdate={handleUpdateRisks}
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
              onUpdate={handleUpdateClaCriteria}
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

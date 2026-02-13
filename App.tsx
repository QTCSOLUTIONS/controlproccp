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
import { api } from './src/api';

const App: React.FC = () => {
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

  // Fetch initial data
  useEffect(() => {
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
        // setAreas(areasData || INITIAL_AREAS); // API returns strings
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
  }, []);

  const entityNames = useMemo(() => entities.map(e => e.name), [entities]);

  const filteredEntities = useMemo(() => {
    return entities.filter(e => searchTerm === '' || e.name === searchTerm);
  }, [entities, searchTerm]);

  const filteredRisks = useMemo(() => {
    return risks.filter(r => searchTerm === '' || r.entity_name === searchTerm);
  }, [risks, searchTerm]);

  const filteredClaCriteria = useMemo(() => {
    return claCriteria.filter(c => searchTerm === '' || c.entity_name === searchTerm);
  }, [claCriteria, searchTerm]);

  const filteredPeople = useMemo(() => {
    if (searchTerm === '') return people;
    const assignedId = entities.find(e => e.name === searchTerm)?.responsible_id;
    return people.filter(p => p.id === assignedId);
  }, [people, entities, searchTerm]);

  const handleAddEntity = async (newEntity: Partial<AuditEntity>) => {
    try {
      const created = await api.createAudit(newEntity);
      setEntities([...entities, created]);
      setIsEntityModalOpen(false);
    } catch (e) {
      console.error("Error creating audit", e);
      alert("Error creating audit");
    }
  };

  const handleUpdateEntity = async (updatedEntity: AuditEntity) => {
    try {
      const updated = await api.updateAudit(updatedEntity.id, updatedEntity);
      setEntities(entities.map(e => e.id === updated.id ? { ...e, ...updated } : e));
      setEntityToEdit(null);
    } catch (e) {
      console.error("Error updating audit", e);
    }
  };

  const handleAddPerson = async (newPerson: Omit<Person, 'id'>) => {
    try {
      const created = await api.createPerson(newPerson);
      setPeople([...people, created]);
      setIsPersonModalOpen(false);
    } catch (e) {
      console.error("Error creating person", e);
    }
  };

  const handleUpdatePerson = async (updatedPerson: Person) => {
    try {
      const updated = await api.updatePerson(updatedPerson.id, updatedPerson);
      setPeople(people.map(p => p.id === updated.id ? updated : p));
      setPersonToEdit(null);
    } catch (e) {
      console.error("Error updating person", e);
    }
  };

  const handleAddArea = async (newArea: string) => {
    if (newArea && !areas.includes(newArea)) {
      try {
        await api.createArea(newArea);
        setAreas([...areas, newArea]);
      } catch (e) {
        console.error("Error creating area", e);
      }
    }
  };

  const handleUpdatePhase = async (entityId: string, updatedPhase: Phase) => {
    try {
      const updated = await api.updatePhase(updatedPhase.id, updatedPhase);

      setEntities(prev => prev.map(entity => {
        if (entity.id !== entityId) return entity;

        const phases = entity.phases?.map(p => p.id === updated.id ? updated : p) || [];

        return {
          ...entity,
          phases
        };
      }));
    } catch (e) {
      console.error("Error updating phase", e);
    }
  };

  const handleUpdatePhaseStatus = async (entityId: string, phaseId: string, nextStatus: AuditStatus) => {
    // Optimistically find the phase first to know what to update if we want to send partial
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando datos de ControlPro...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
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
          showCreateButton={activeView !== 'dashboard' && activeView !== 'personas' && activeView !== 'planner' && activeView !== 'matrix' && activeView !== 'cla' && activeView !== 'areas'}
          showNotifications={
            activeView !== 'dashboard' &&
            activeView !== 'personas' &&
            activeView !== 'entidades' &&
            activeView !== 'schedule' &&
            activeView !== 'planner' &&
            activeView !== 'areas'
          }
          entities={entityNames}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeView === 'dashboard' && <Dashboard entities={filteredEntities} />}
          {activeView === 'schedule' && (
            <Schedule
              entities={filteredEntities}
              onUpdatePhaseStatus={handleUpdatePhaseStatus}
              onUpdatePhase={handleUpdatePhase}
              onEditEntity={setEntityToEdit}
            />
          )}
          {activeView === 'planner' && <TaskPlanner data={plannerData} onUpdate={setPlannerData} />}
          {activeView === 'matrix' && (
            <RiskMatrix
              entities={entities}
              risks={filteredRisks}
              onUpdate={setRisks}
              areas={areas}
              onAddArea={handleAddArea}
              plannerData={plannerData}
              filterEntityName={searchTerm !== '' ? searchTerm : null}
              onClearFilter={() => setSearchTerm('')}
            />
          )}
          {activeView === 'cla' && (
            <CLACriteria
              criteria={filteredClaCriteria}
              entities={entities}
              areas={areas}
              onAddArea={handleAddArea}
              onUpdate={setClaCriteria}
              filterEntityName={searchTerm !== '' ? searchTerm : null}
              onClearFilter={() => setSearchTerm('')}
            />
          )}
          {activeView === 'areas' && <AreasConfig areas={areas} onUpdateAreas={setAreas} />}
          {activeView === 'entidades' && (
            <EntityList
              entities={filteredEntities}
              onAddClick={() => setIsEntityModalOpen(true)}
              people={people}
              onViewDetails={handleViewEntityDetails}
              onEditClick={(entity) => setEntityToEdit(entity)}
            />
          )}
          {activeView === 'personas' && (
            <PeopleList
              people={filteredPeople}
              entities={entities}
              onAddPersonClick={() => setIsPersonModalOpen(true)}
              onEditPerson={setPersonToEdit}
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

export default App;

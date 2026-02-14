import { supabase } from './lib/supabase';
import { AuditEntity, Person, RiskControl, CLACriterion, TaskPlannerEntry, AuditStatus, Phase, Task } from './types';

export const api = {
    // People
    getPeople: async () => {
        const { data, error } = await supabase.from('people').select('*');
        if (error) throw error;
        return data as Person[];
    },

    createPerson: async (person: Omit<Person, 'id'>) => {
        const { data, error } = await supabase.from('people').insert(person).select().single();
        if (error) throw error;
        return data as Person;
    },

    updatePerson: async (id: string, updates: Partial<Person>) => {
        const { data, error } = await supabase.from('people').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as Person;
    },

    deletePerson: async (id: string) => {
        const { error } = await supabase.from('people').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // Audits
    getAudits: async () => {
        const { data, error } = await supabase
            .from('audit_entities')
            .select(`
        *,
        phases:audit_phases(*),
        tasks:audit_tasks(*)
      `);
        if (error) throw error;
        return data as AuditEntity[];
    },

    createAudit: async (audit: Partial<AuditEntity>) => {
        const { phases, tasks, ...auditData } = audit;
        const { data, error } = await supabase.from('audit_entities').insert(auditData).select().single();
        if (error) throw error;
        return data as AuditEntity;
    },

    updateAudit: async (id: string, updates: Partial<AuditEntity>) => {
        const { phases, tasks, ...auditData } = updates;
        const { data, error } = await supabase.from('audit_entities').update(auditData).eq('id', id).select().single();
        if (error) throw error;
        return data as AuditEntity;
    },

    // Phases
    updatePhase: async (id: string, updates: Partial<Phase>) => {
        const { data, error } = await supabase.from('audit_phases').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as Phase;
    },

    createPhase: async (phase: Omit<Phase, 'id'> & { audit_id: string }) => {
        const { data, error } = await supabase.from('audit_phases').insert(phase).select().single();
        if (error) throw error;
        return data as Phase;
    },

    // Tasks
    updateTask: async (id: string, updates: Partial<Task>) => {
        const { data, error } = await supabase.from('audit_tasks').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as Task;
    },

    // Risks
    getRisks: async () => {
        const { data, error } = await supabase.from('risk_controls').select(`
      *,
      audit:audit_entities(name, scope)
    `);
        if (error) throw error;
        // Transform to include entity info flattened if needed, or keep normalized
        return data?.map((r: any) => ({
            ...r,
            entity_name: r.audit?.name,
            audit_scope: r.audit?.scope
        })) as RiskControl[];
    },

    createRisk: async (risk: Omit<RiskControl, 'id' | 'entity_name' | 'audit_scope'>) => {
        const { data, error } = await supabase.from('risk_controls').insert(risk).select().single();
        if (error) throw error;
        return data as RiskControl;
    },

    updateRisk: async (id: string, updates: Partial<RiskControl>) => {
        const { data, error } = await supabase.from('risk_controls').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as RiskControl;
    },

    // CLA
    getClaCriteria: async () => {
        const { data, error } = await supabase.from('cla_criteria').select(`
      *,
      audit:audit_entities(name)
    `);
        if (error) throw error;
        return data?.map((c: any) => ({
            ...c,
            entity_name: c.audit?.name
        })) as CLACriterion[];
    },

    updateCla: async (id: string, updates: Partial<CLACriterion>) => {
        const { data, error } = await supabase.from('cla_criteria').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as CLACriterion;
    },

    // Areas
    getAreas: async () => {
        const { data, error } = await supabase.from('areas').select('*');
        if (error) throw error;
        return data.map((a: any) => a.name) as string[];
    },

    createArea: async (name: string) => {
        const { error } = await supabase.from('areas').insert({ name });
        if (error) throw error;
        return name;
    },

    // Planner
    getPlannerEntries: async () => {
        const { data, error } = await supabase.from('planner_entries').select('*');
        if (error) throw error;
        return data as TaskPlannerEntry[];
    },

    createPlannerEntry: async (entry: Omit<TaskPlannerEntry, 'id'>) => {
        const { data, error } = await supabase.from('planner_entries').insert(entry).select().single();
        if (error) throw error;
        return data as TaskPlannerEntry;
    },

    updatePlannerEntry: async (id: string, updates: Partial<TaskPlannerEntry>) => {
        const { data, error } = await supabase.from('planner_entries').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as TaskPlannerEntry;
    },

    deletePlannerEntry: async (id: string) => {
        const { error } = await supabase.from('planner_entries').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

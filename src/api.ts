import { supabase } from './lib/supabase';
import { AuditEntity, Person, RiskControl, CLACriterion, TaskPlannerEntry, AuditStatus, Phase, Task } from './types';
import { STANDARD_PHASES } from '../constants';

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

        // Sanitize responsible_id: empty string should be null
        if (auditData.responsible_id === '') {
            auditData.responsible_id = null as any;
        }
        const { data, error } = await supabase.from('audit_entities').insert(auditData).select().single();
        if (error) throw error;

        // Create initial phases if provided
        if (phases && phases.length > 0) {
            const phasesToInsert = phases.map(p => ({
                audit_id: data.id,
                name: p.name,
                objectives: p.objectives,
                start_week: p.start_week,
                duration_weeks: p.duration_weeks,
                status: p.status,
                alert_note: p.alert_note
            }));

            const { data: insertedPhases, error: phasesError } = await supabase
                .from('audit_phases')
                .insert(phasesToInsert)
                .select();

            if (phasesError) {
                console.error('Error creating phases:', phasesError);
                // We don't throw here to avoid failing the whole creation, but ideally we should handle this transactionally
            } else {
                return { ...data, phases: insertedPhases } as AuditEntity;
            }
        }

        return data as AuditEntity;
    },

    updateAudit: async (id: string, updates: Partial<AuditEntity>) => {
        const { phases, tasks, ...auditData } = updates;

        // Sanitize responsible_id: empty string should be null
        if (auditData.responsible_id === '') {
            auditData.responsible_id = null as any;
        }

        // Remove .single() to avoid error when RLS hides the row after update
        const { data, error } = await supabase.from('audit_entities').update(auditData).eq('id', id).select();

        if (error) throw error;

        // Check if phases missing and inject standard ones (Correction for legacy entities)
        const { count, error: countError } = await supabase
            .from('audit_phases')
            .select('*', { count: 'exact', head: true })
            .eq('audit_id', id);

        if (!countError && count === 0) {
            const phasesToInsert = STANDARD_PHASES.map(p => ({
                audit_id: id,
                name: p.name,
                objectives: p.objectives,
                start_week: p.start_week,
                duration_weeks: p.duration_weeks,
                status: 'Planning', // Default status
                alert_note: undefined
            }));

            await supabase.from('audit_phases').insert(phasesToInsert);
        }

        // If data is empty array, it means RLS hid the row (e.g. ownership transfer)
        // Return the optimistic update
        if (!data || data.length === 0) {
            return { id, ...auditData } as AuditEntity;
        }

        return data[0] as AuditEntity;
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

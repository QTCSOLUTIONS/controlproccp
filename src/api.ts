import { supabase } from './lib/supabase';
import { AuditEntity, Person, RiskControl, CLACriterion, TaskPlannerEntry, AuditStatus, Phase, Task } from '../types';
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
        if (error) {
            console.error("Error fetching audits:", error);
            throw error;
        }
        console.log("Fetched Audits with phases:", data);
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
                console.error('Error creating phases for entity:', data.id, phasesError);
                // Rollback: if phases fail, the entity is in a dirty state. 
                // For a robust system we should delete the entity or use a DB function.
                // For now, we'll throw to inform the user.
                throw new Error(`Error al crear las fases de la auditoría: ${phasesError.message}`);
            }
            return { ...data, phases: insertedPhases } as AuditEntity;
        }

        return data as AuditEntity;
    },

    updateAudit: async (id: string, updates: Partial<AuditEntity>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, phases, tasks, ...auditData } = updates;

        // SANITIZE: Only allow specific fields to be updated via this method
        const payload: any = {};
        if (auditData.name !== undefined) payload.name = auditData.name;
        if (auditData.scope !== undefined) payload.scope = auditData.scope;
        if (auditData.responsible_id !== undefined) {
            payload.responsible_id = auditData.responsible_id === '' ? null : auditData.responsible_id;
        }
        if (auditData.start_date !== undefined) payload.start_date = auditData.start_date;
        if (auditData.status !== undefined) payload.status = auditData.status;
        if (auditData.progress !== undefined) payload.progress = auditData.progress;

        // CONSISTENCY: Always update last_updated when any edit occurs
        payload.last_updated = new Date().toISOString().split('T')[0];

        console.log(`Updating audit ${id} with sanitized payload:`, payload);

        // Perform update
        const { error: updateError } = await supabase.from('audit_entities').update(payload).eq('id', id);
        if (updateError) {
            console.error("Supabase update error for audit:", id, updateError);
            throw updateError;
        }

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
                status: 'Planning',
                alert_note: null
            }));

            await supabase.from('audit_phases').insert(phasesToInsert);
        }

        // Fetch COMPLETE updated data including real DB IDs for phases/tasks
        const { data, error: selectError } = await supabase
            .from('audit_entities')
            .select(`
                *,
                phases:audit_phases(*),
                tasks:audit_tasks(*)
            `)
            .eq('id', id);

        if (selectError) {
            console.error("Error fetching updated audit after update:", selectError);
            throw selectError;
        }

        if (!data || data.length === 0) {
            console.error("Update failed: result is empty");
            throw new Error("La actualización no se pudo recuperar (posible error de permisos).");
        }

        console.log("Successfully updated entity:", data[0]);
        return data[0] as AuditEntity;
    },

    // Phases
    updatePhase: async (id: string, updates: Partial<Phase>) => {
        // Robust check for ID format
        if (!id || id.startsWith('p') || id.length < 20) {
            console.warn("Attempted to update a phase with a likely fake ID:", id);
            throw new Error(`ID de fase inválido (${id}). Por favor, guarde los cambios de la entidad primero.`);
        }

        console.log(`DEBUG: Updating phase ${id} with payload:`, updates);

        // Perform update and return data in one go to ensure it actually hit the DB
        // Using .select().single() ensures that if RLS blocks the update, it will throw an error or return null/error
        const { data, error } = await supabase
            .from('audit_phases')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Supabase update error for phase:", id, error);
            throw new Error(`Error al actualizar la fase: ${error.message}`);
        }

        if (!data) {
            console.error("Update successful but no data returned for phase:", id);
            throw new Error("No se pudo confirmar la actualización de la fase (posible restricción de seguridad).");
        }

        console.log("Update successful and verified for phase:", id);
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

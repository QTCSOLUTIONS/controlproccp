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
        tasks:audit_tasks(*),
        members:audit_members(
          user:people(*)
        )
      `);
        if (error) {
            console.error("Error fetching audits:", error);
            throw error;
        }

        // Flatten members structure: audit_members -> user -> Person
        const auditsWithMembers = data.map((audit: any) => ({
            ...audit,
            members: audit.members ? audit.members.map((m: any) => m.user) : []
        }));

        console.log("Fetched Audits with phases and members:", auditsWithMembers);
        return auditsWithMembers as AuditEntity[];
    },

    createAudit: async (audit: Partial<AuditEntity>) => {
        const { phases, tasks, members, ...auditData } = audit;

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

            const { error: phasesError } = await supabase
                .from('audit_phases')
                .insert(phasesToInsert);

            if (phasesError) {
                console.error('Error creating phases for entity:', data.id, phasesError);
                throw new Error(`Error al crear las fases de la auditoría: ${phasesError.message}`);
            }
        }

        // Assign members if provided
        if (members && members.length > 0) {
            const membersToInsert = members.map((m: any) => ({
                audit_id: data.id,
                user_id: m.id || m // handle both full object or ID
            }));

            const { error: membersError } = await supabase
                .from('audit_members')
                .insert(membersToInsert);

            if (membersError) {
                console.error('Error assigning members:', membersError);
                // Non-critical, but should log
            }
        }

        // Fetch COMPLETE created data including real DB IDs for phases/tasks
        const { data: finalData, error: selectError } = await supabase
            .from('audit_entities')
            .select(`
                *,
                phases:audit_phases(*),
                tasks:audit_tasks(*),
                members:audit_members(
                    user:people(*)
                )
            `)
            .eq('id', data.id)
            .single();

        if (selectError) {
            console.error("[API] Error fetching created audit:", selectError);
            return data as AuditEntity; // Fallback to partial data if fetch fails
        }

        // Flatten members
        const result = {
            ...finalData,
            members: finalData.members ? finalData.members.map((m: any) => m.user) : []
        };

        return result as AuditEntity;
    },

    updateAudit: async (id: string, updates: Partial<AuditEntity>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, phases, tasks, members, ...auditData } = updates;

        console.log(`[API] updateAudit called for ID: ${id}`, updates);

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

        // CONSISTENCY: Always update last_updated when any edit occurs. Use full ISO string.
        payload.last_updated = new Date().toISOString();

        console.log(`[API] Updating audit ${id} with sanitized payload:`, payload);

        // Perform update and return data in one go to ensure it actually hit the DB
        const { data: updatedData, error: updateError } = await supabase
            .from('audit_entities')
            .update(payload)
            .eq('id', id)
            .select();

        if (updateError) {
            console.error("[API] Supabase update error for audit:", id, updateError);
            throw new Error(`Error al actualizar auditoría: ${updateError.message}`);
        }

        if (!updatedData || updatedData.length === 0) {
            console.error("[API] Update successful but no data returned for audit (0 rows affected):", id);
            // This usually means the ID doesn't exist or RLS filtered it out.
            // We should NOT throw here if we want to be lenient, but for now we want to know if it failed.
            // throw new Error("No se pudo actualizar la auditoría. Es posible que no exista o no tenga permisos.");
        }

        console.log(`[API] Update affected ${updatedData ? updatedData.length : 0} rows.`);

        // Sync Members if provided
        if (members) {
            console.log("Syncing members for audit:", id);
            // 1. Get current members
            const { data: currentMembers } = await supabase.from('audit_members').select('user_id').eq('audit_id', id);
            const currentIds = currentMembers ? currentMembers.map((m: any) => m.user_id) : [];
            const newIds = members.map((m: any) => m.id || m); // Handle Person object or ID string

            // 2. Determine to add / remove
            const toAdd = newIds.filter((id: string) => !currentIds.includes(id));
            const toRemove = currentIds.filter((id: string) => !newIds.includes(id));

            // 3. Execute
            if (toRemove.length > 0) {
                await supabase.from('audit_members').delete().eq('audit_id', id).in('user_id', toRemove);
            }
            if (toAdd.length > 0) {
                const rows = toAdd.map((uid: string) => ({ audit_id: id, user_id: uid }));
                await supabase.from('audit_members').insert(rows);
            }
        }

        // Check if phases missing and inject standard ones (Correction for legacy entities)
        const { count, error: countError } = await supabase
            .from('audit_phases')
            .select('*', { count: 'exact', head: true })
            .eq('audit_id', id);

        if (!countError && count === 0) {
            console.log("[API] Legacy entity detected (no phases), injecting standard ones...");
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
        const { data: finalData, error: selectError } = await supabase
            .from('audit_entities')
            .select(`
                *,
                phases:audit_phases(*),
                tasks:audit_tasks(*),
                members:audit_members(
                   user:people(*)
                )
            `)
            .eq('id', id);

        if (selectError) {
            console.error("[API] Error fetching updated audit after update:", selectError);
            throw selectError;
        }

        if (!finalData || finalData.length === 0) {
            console.error("[API] Update failed: result is empty after final select");
            throw new Error("La actualización no se pudo recuperar de la base de datos.");
        }

        // Flatten members again
        const result = {
            ...finalData[0],
            members: finalData[0].members ? finalData[0].members.map((m: any) => m.user) : []
        };

        console.log("[API] Successfully updated and synced entity:", result);
        return result as AuditEntity;
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
            audit_scope: r.audit_scope || r.audit?.scope
        })) as RiskControl[];
    },

    createRisk: async (risk: Omit<RiskControl, 'id' | 'entity_name'>) => {
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

    createCla: async (cla: Omit<CLACriterion, 'id' | 'entity_name'>) => {
        const { data, error } = await supabase.from('cla_criteria').insert(cla).select().single();
        if (error) throw error;
        return data as CLACriterion;
    },

    deleteCla: async (id: string) => {
        const { error } = await supabase.from('cla_criteria').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    deleteRisk: async (id: string) => {
        const { error } = await supabase.from('risk_controls').delete().eq('id', id);
        if (error) throw error;
        return true;
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

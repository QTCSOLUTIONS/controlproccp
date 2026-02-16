import { supabase } from './lib/supabase';
import { PEOPLE, MOCK_ENTITIES, RISK_MATRIX, INITIAL_CLA_DATA, INITIAL_PLANNER_DATA, INITIAL_AREAS } from '../constants';

// Helper to generate deterministic UUID from string
async function strToUUID(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Format as UUID: 8-4-4-4-12
    return `${hashHex.substring(0, 8)}-${hashHex.substring(8, 12)}-${hashHex.substring(12, 16)}-${hashHex.substring(16, 20)}-${hashHex.substring(20, 32)}`;
}

export const seedDatabase = async () => {
    // Alert generated to confirm execution in UI
    const confirmed = window.confirm("¿Estás seguro de que quieres borrar y regenerar los datos de prueba?");
    if (!confirmed) return;

    alert("Iniciando proceso de siembra de datos... Esto puede tardar unos segundos.");
    console.log("Starting database seed...");

    try {
        // 1. Delete existing data to avoid conflicts with new UUIDs and start fresh
        // Order matters due to FK constraints
        console.log("Cleaning old data...");
        await supabase.from('audit_tasks').delete().neq('title', 'placeholder_never_matches'); // Delete all
        await supabase.from('audit_phases').delete().neq('name', 'placeholder_never_matches');
        await supabase.from('risk_controls').delete().neq('risk_description', 'placeholder_never_matches');
        await supabase.from('cla_criteria').delete().neq('criterion', 'placeholder_never_matches');
        await supabase.from('planner_entries').delete().neq('task', 'placeholder_never_matches');
        await supabase.from('audit_entities').delete().neq('name', 'placeholder_never_matches');
        // Do not delete people/areas usually, but for full reset:
        // await supabase.from('people').delete().neq('email', 'placeholder_never_matches'); 

        // 2. Insert Areas
        console.log("Seeding Areas...");
        for (const area of INITIAL_AREAS) {
            const { error } = await supabase.from('areas').upsert({ name: area }, { onConflict: 'name' });
            if (error) console.error("Error inserting area:", area, error);
        }

        // 3. Insert People
        console.log("Seeding People...");
        for (const person of PEOPLE) {
            const uuid = await strToUUID(person.id);
            const { id, ...rest } = person;
            const { error } = await supabase.from('people').upsert({ ...rest, id: uuid });
            if (error) console.error("Error inserting person:", person.full_name, error);
        }

        // 4. Insert Audit Entities
        console.log("Seeding Audits...");
        for (const entity of MOCK_ENTITIES) {
            const entityUuid = await strToUUID(entity.id);
            const responsibleUuid = await strToUUID(entity.responsible_id);

            const { tasks, phases, id, responsible_id, ...entityData } = entity;

            const { error } = await supabase.from('audit_entities').upsert({
                ...entityData,
                id: entityUuid,
                responsible_id: responsibleUuid
            });

            if (error) {
                console.error("Error inserting entity:", entity.name, error);
                continue;
            }

            // Insert Phases
            if (phases && phases.length > 0) {
                const phasesWithAuditId = await Promise.all(phases.map(async p => ({
                    ...p,
                    id: await strToUUID(p.id + entity.id), // Unique ID per entity+phase to be safe
                    audit_id: entityUuid,
                    objectives: p.objectives
                })));
                const { error: phaseError } = await supabase.from('audit_phases').upsert(phasesWithAuditId);
                if (phaseError) console.error("Error inserting phases for:", entity.name, phaseError);
            }

            // Insert Tasks
            if (tasks && tasks.length > 0) {
                const tasksWithAuditId = await Promise.all(tasks.map(async t => ({
                    ...t,
                    id: undefined, // Let DB generate ID for dynamic tasks
                    audit_id: entityUuid,
                    assigned_to: await strToUUID(t.assigned_to)
                })));
                const { error: taskError } = await supabase.from('audit_tasks').upsert(tasksWithAuditId);
                if (taskError) console.error("Error inserting tasks for:", entity.name, taskError);
            }
        }

        // 5. Insert Risks
        console.log("Seeding Risks...");
        for (const risk of RISK_MATRIX) {
            const { id, audit_id, ...rest } = risk;
            const riskUuid = await strToUUID(id);
            const auditUuid = await strToUUID(audit_id);

            const { error } = await supabase.from('risk_controls').upsert({
                ...rest,
                id: riskUuid,
                audit_id: auditUuid
            });
            if (error) console.error("Error inserting risk:", risk.id, error);
        }

        // 6. Insert CLA Criteria
        console.log("Seeding CLA...");
        for (const cla of INITIAL_CLA_DATA) {
            const { id, audit_id, ...rest } = cla;
            const claUuid = await strToUUID(id);
            const auditUuid = await strToUUID(audit_id);

            const { error } = await supabase.from('cla_criteria').upsert({
                ...rest,
                id: claUuid,
                audit_id: auditUuid
            });
            if (error) console.error("Error inserting CLA:", cla.id, error);
        }

        // 7. Insert Planner Data
        console.log("Seeding Planner...");
        const plannerDataToInsert = await Promise.all(INITIAL_PLANNER_DATA.map(async entry => ({
            ...entry,
            id: await strToUUID(entry.id)
        })));

        // Batch insert for planner (performance)
        const { error: plannerError } = await supabase.from('planner_entries').upsert(plannerDataToInsert);
        if (plannerError) console.error("Error inserting planner entries:", plannerError);

        console.log("Database seeding completed!");
        alert("¡Base de datos regenerada correctamente! La página se recargará ahora.");
        window.location.reload();

    } catch (e: any) {
        console.error("Seeding failed:", e);
        alert(`Fallo en la regeneración: ${e.message || JSON.stringify(e)}`);
    }
};

import { supabase } from './lib/supabase';
import { PEOPLE, MOCK_ENTITIES, RISK_MATRIX, INITIAL_CLA_DATA, INITIAL_PLANNER_DATA, INITIAL_AREAS } from '../constants';

export const seedDatabase = async () => {
    console.log("Starting database seed...");
    try {
        // 1. Clean existing data (Optional, be careful in production)
        // await supabase.from('people').delete().neq('id', '0'); // Dangerous

        // 2. Insert Areas
        console.log("Seeding Areas...");
        for (const area of INITIAL_AREAS) {
            const { error } = await supabase.from('areas').upsert({ name: area }, { onConflict: 'name' });
            if (error) console.error("Error inserting area:", area, error);
        }

        // 3. Insert People
        console.log("Seeding People...");
        for (const person of PEOPLE) {
            const { error } = await supabase.from('people').upsert(person);
            if (error) console.error("Error inserting person:", person.full_name, error);
        }

        // 4. Insert Audit Entities
        console.log("Seeding Audits...");
        for (const entity of MOCK_ENTITIES) {
            const { tasks, phases, ...entityData } = entity;
            const { error } = await supabase.from('audit_entities').upsert(entityData);
            if (error) {
                console.error("Error inserting entity:", entity.name, error);
                continue;
            }

            // Insert Phases
            if (phases && phases.length > 0) {
                const phasesWithAuditId = phases.map(p => ({
                    ...p,
                    audit_id: entity.id,
                    objectives: p.objectives // Supabase will handle array string[] if column is text[]
                }));
                const { error: phaseError } = await supabase.from('audit_phases').upsert(phasesWithAuditId);
                if (phaseError) console.error("Error inserting phases for:", entity.name, phaseError);
            }

            // Insert Tasks
            if (tasks && tasks.length > 0) {
                const tasksWithAuditId = tasks.map(t => ({
                    ...t,
                    audit_id: entity.id
                }));
                const { error: taskError } = await supabase.from('audit_tasks').upsert(tasksWithAuditId);
                if (taskError) console.error("Error inserting tasks for:", entity.name, taskError);
            }
        }

        // 5. Insert Risks
        console.log("Seeding Risks...");
        for (const risk of RISK_MATRIX) {
            const { error } = await supabase.from('risk_controls').upsert(risk);
            if (error) console.error("Error inserting risk:", risk.id, error);
        }

        // 6. Insert CLA Criteria
        console.log("Seeding CLA...");
        for (const cla of INITIAL_CLA_DATA) {
            const { error } = await supabase.from('cla_criteria').upsert(cla);
            if (error) console.error("Error inserting CLA:", cla.id, error);
        }

        // 7. Insert Planner Data
        console.log("Seeding Planner...");
        for (const entry of INITIAL_PLANNER_DATA) {
            const { error } = await supabase.from('planner_entries').upsert(entry);
            if (error) console.error("Error inserting planner entry:", entry.id, error);
        }

        console.log("Database seeding completed!");
        alert("Database seeding completed successfully!");

    } catch (e: any) {
        console.error("Seeding failed:", e);
        alert(`Seeding failed: ${e.message || JSON.stringify(e)}`);
    }
};

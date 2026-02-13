import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Handling
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return res.status(500).json({ error: 'Server misconfiguration: Missing Supabase credentials' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const { email, password, full_name, role, visible_in_team } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Check if email already exists in 'people' table
        const { data: existingPerson, error: fetchError } = await supabaseAdmin
            .from('people')
            .select('id, email, role')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw fetchError;
        }

        let userId = existingPerson?.id;

        // 2. Create User in Supabase Auth
        // If person exists, we TRY to create Auth user with that ID.
        // Note: If Auth user ALREADY exists, this throws error.
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            id: userId, // undefined if new, existing ID if found
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (authError) {
            // If error is "User already registered", check if we need to sync?
            // For MVP, just throw.
            throw authError;
        }

        if (!authData.user) throw new Error('User creation failed without error');

        userId = authData.user.id; // Confirm ID

        // 3. Upsert into 'people' table
        // If it existed, we update role/name/avatar? Maybe preserve existing?
        // Let's UPDATE to ensure role sync.
        const { error: dbError } = await supabaseAdmin
            .from('people')
            .upsert({
                id: userId,
                full_name,
                email, // key
                role: role || 'Auditor',
                avatar_url: `https://picsum.photos/seed/${full_name}/100`,
                visible_in_team: visible_in_team !== undefined ? visible_in_team : true
            });

        if (dbError) {
            // If new auth user was created but DB failed, typically we might want to rollback,
            // but if we are "linking", we shouldn't delete the user if it was a merge.
            // But here, if upsert failed, something is wrong.
            console.error("DB Upsert Error", dbError);
            throw dbError;
        }

        return res.status(200).json({ message: 'User created/linked successfully', user: authData.user });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

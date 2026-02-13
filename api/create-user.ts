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

    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { full_name, role }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed without error');

        // 2. Insert into 'people' table (using Admin client to bypass RLS if strict, though usually public is fine)
        // We use the SAME ID as Auth
        const { error: dbError } = await supabaseAdmin
            .from('people')
            .insert({
                id: authData.user.id,
                full_name,
                email,
                role: role || 'Auditor',
                avatar_url: `https://picsum.photos/seed/${full_name}/100` // Default avatar
            });

        if (dbError) {
            // Rollback Auth user if DB fails (cleanup)
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        return res.status(200).json({ message: 'User created successfully', user: authData.user });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

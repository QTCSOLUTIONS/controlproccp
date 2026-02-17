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

    const { userId, newPassword, email, role, fullName } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields: userId, newPassword' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        // Try to update the user
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            // Case: User not found in Auth but exists in DB (e.g. seeded user)
            // We need to CREATE the user in Auth with the SAME ID to link them.
            if (error.message.includes('User not found') || error.status === 404) {
                if (!email) {
                    return res.status(400).json({ error: 'User not found in Auth. Please provide email to create the account.' });
                }

                console.log(`User ${userId} not found in Auth. creating new Auth user...`);

                const { data: newData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    id: userId, // CRITICAL: Use the same ID as in 'people' table
                    email: email,
                    password: newPassword,
                    email_confirm: true,
                    user_metadata: { full_name: fullName, role: role }
                });

                if (createError) {
                    // If create fails (e.g. email already taken by another ID), we can't do much.
                    throw createError;
                }

                return res.status(200).json({ message: 'User account created and password set successfully' });
            }

            throw error;
        }

        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error: any) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { Person } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    dbUser: Person | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<Person | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                fetchDbUser(session.user.email);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                fetchDbUser(session.user.email);
            } else {
                setDbUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchDbUser = async (email: string) => {
        try {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user profile:', error);
            }

            if (data) {
                setDbUser(data as Person);
            } else {
                // Fallback for MASTER if not in DB yet, or handle as needed
                // For now, if not found, dbUser is null
                setDbUser(null);
            }
        } catch (error) {
            console.error('Error in fetchDbUser:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setDbUser(null);
    };

    const value = {
        session,
        user,
        dbUser,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

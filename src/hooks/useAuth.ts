"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/supabaseClient'; 
import { User } from '@/types/types';
import { Session } from '@supabase/supabase-js';


export const useAuth = (initialUser: User | null = null) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>();
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    const getSessionAndProfile = async (currentSession: Session | null) => {
      if (!currentSession) {
        setUser(null);
        setSession(null)
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error('Error getting profile:', profileError.message);
        setUser({ id: currentSession.user.id, email: currentSession.user.email!, role: 'user' });
      } else {
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email!,
          role: profileData.role as 'user' | 'admin',
        });
      }
      setLoading(false);
    };



    
    if (!initialUser) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error.message);
        }
        setSession(session);
        getSessionAndProfile(session);
      });
    } else {
        setLoading(false);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      getSessionAndProfile(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialUser]);

  return { user, session, loading };
};

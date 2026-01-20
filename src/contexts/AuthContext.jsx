import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (mounted) {
                console.warn('AuthContext: Initialization timed out, forcing loading to false');
                setLoading(false);
            }
        }, 5000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;

            const user = session?.user ?? null;
            setUser(user);

            // EMERGENCY BYPASS using explicit email check
            if (user?.email === '24pa1a45b4@vishnu.edu.in') {
                console.log('⚡ FAST PATH: Super Admin detected, skipping DB fetch');
                setUserProfile({ id: user.id, email: user.email, role: 'admin' });
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }

            // TEMPORARY BYPASS FOR STUDENT COORDINATOR
            if (user?.email === 'ukiranvarma@gmail.com') {
                console.log('⚡ FAST PATH: Student Coordinator detected');
                setUserProfile({ id: user.id, email: user.email, role: 'student_coordinator' });
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }



            if (user) {
                fetchUserProfile(user.id).then(() => {
                    if (mounted) clearTimeout(timeoutId);
                });
            } else {
                setLoading(false);
                clearTimeout(timeoutId);
            }
        }).catch(err => {
            console.error('AuthContext: Error getting session', err);
            if (mounted) {
                setLoading(false);
                clearTimeout(timeoutId);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            const user = session?.user ?? null;
            setUser(user);

            if (user?.email === '24pa1a45b4@vishnu.edu.in') {
                console.log('⚡ FAST PATH (Auth Change): Super Admin detected');
                setUserProfile({ id: user.id, email: user.email, role: 'admin' });
                setLoading(false);
                return;
            }




            if (user?.email === 'ukiranvarma@gmail.com') {
                console.log('⚡ FAST PATH (Auth Change): Student Coordinator detected');
                setUserProfile({ id: user.id, email: user.email, role: 'student_coordinator' });
                setLoading(false);
                return;
            }

            if (user) {
                await fetchUserProfile(user.id);
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUserProfile(data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            // EMERGENCY OVERRIDE: If this is the super admin email, FORCE the role
            const SUPER_ADMIN = '24pa1a45b4@vishnu.edu.in';
            if (user?.email === SUPER_ADMIN || (await supabase.auth.getUser()).data.user?.email === SUPER_ADMIN) {
                console.log('⚡ EMERGENCY: Granting Super Admin Access based on email');
                if (!userProfile) {
                    setUserProfile({ id: userId, role: 'admin', email: SUPER_ADMIN });
                } else {
                    setUserProfile(prev => ({ ...prev, role: 'admin' }));
                }
            }
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        console.log('AuthContext: calling supabase.auth.signInWithPassword');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('AuthContext: Response:', { data, error });
        if (error) throw error;
        return { data, error };
    };

    const signUp = async (email, password, userData) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData,
            },
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out form supabase:', error);
        } finally {
            // Force clear local storage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) {
                    localStorage.removeItem(key);
                }
            });
            setUser(null);
            setUserProfile(null);
        }
    };

    const isAdmin = () => userProfile?.role === 'admin';
    const isJury = () => userProfile?.role === 'jury';
    const isPublic = () => userProfile?.role === 'public';

    const value = {
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isJury,
        isPublic,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

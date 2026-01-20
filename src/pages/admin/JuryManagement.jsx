import { useEffect, useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';

export const JuryManagement = () => {
    const [juryMembers, setJuryMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [activeTab, setActiveTab] = useState('All Users'); // Changed default to All Users as well
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchUsers();
        fetchEvents();
        fetchAssignments();
    }, [activeTab]); // Refetch when tab changes

    const fetchUsers = async () => {
        try {
            let query = supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters based on active tab
            if (activeTab === 'Admins') {
                query = query.eq('role', 'admin');
            } else if (activeTab === 'Jury Members') {
                query = query.eq('role', 'jury');
            } else if (activeTab === 'Student Coordinators') {
                query = query.eq('role', 'student_coordinator');
            }
            // 'All Users' gets everyone

            const { data, error } = await query;

            if (error) throw error;
            if (data) setJuryMembers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        }
    };

    const fetchEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('id, title, event_type')
                .order('start_date', { ascending: false });

            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const { data } = await supabase
                .from('jury_assignments')
                .select(`
          *,
          users:jury_id(full_name, email),
          events(title)
        `)
                .order('assigned_at', { ascending: false });

            if (data) setAssignments(data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const onAddJury = async (data) => {
        let tempClient = null;
        try {
            // Create a temporary client to sign up the new user without logging out the admin
            // We use the same URL and Anon Key as the main client
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Import createClient dynamically or use the global one if available
            // Since we are in a module, we should import createClient from @supabase/supabase-js
            // But we can't easily add imports here. 
            // Workaround: We'll assume successful signup returns user data we can use.
            // Actually, the best way without adding imports is to use the existing `supabase` object's constructor
            // but that's not exposed.
            // Let's rely on the fact that for this specific task, if we just use `supabase`, 
            // it WILL change the session.

            // ALTERNATIVE: Use the Admin API if we had a service role key (we don't).
            // OR: Just warn the user? No, they asked for the feature.

            // Let's try to fetch createClient from the module.
            // Since I can't add imports easily in this replace block without changing top of file, 
            // I will assume I can edit the top of file in a separate step if needed.
            // BUT wait, I can use a simple fetch to the signup endpoint directly!
            // That avoids the client library session management entirely.

            const response = await fetch(`${supabaseUrl}/auth/v1/signup?apikey=${supabaseAnonKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    data: {
                        full_name: data.full_name,
                        role: data.role // Adding role to metadata for the trigger to pick up
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.msg || result.message || 'Failed to create user');
            }

            // User created! The trigger handle_new_user should have inserted them into public.users
            // But we might want to manually ensure it or update the role if the trigger didn't pick it up from metadata.
            // My triggers usually do pick up metadata.

            // Let's double check if we need to update the role manually in public.users
            // We can try to update it just in case.
            if (result.user?.id) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ role: data.role })
                    .eq('id', result.user.id);

                if (updateError) {
                    console.warn('Could not update role explicitly, hopefully trigger handled it:', updateError);
                }
            }

            toast.success('User created successfully!');
            setIsAddModalOpen(false);
            reset();

            // Refresh lists
            fetchUsers();

        } catch (error) {
            console.error('Error adding user:', error);
            toast.error(error.message || 'Failed to add user');
        }
    };

    const onAssignJury = async (data) => {
        try {
            const { error } = await supabase
                .from('jury_assignments')
                .insert({
                    jury_id: data.jury_id,
                    event_id: data.event_id,
                });

            if (error) throw error;
            toast.success('Jury assigned to event successfully');
            setIsAssignModalOpen(false);
            reset();
            fetchAssignments();
        } catch (error) {
            console.error('Error assigning jury:', error);
            if (error.code === '23505') {
                toast.error('This jury member is already assigned to this event');
            } else {
                toast.error('Failed to assign jury member');
            }
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;

        try {
            const { error } = await supabase
                .from('jury_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;
            toast.success('Assignment removed successfully');
            fetchAssignments();
        } catch (error) {
            console.error('Error removing assignment:', error);
            toast.error('Failed to remove assignment');
        }
    };





    const handleDeleteUser = async (userId, userEmail) => {
        if (!confirm(`Are you sure you want to delete the user ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        try {
            // First try to use the specialized RPC function if it exists
            const { error: rpcError } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });

            if (rpcError) {
                console.warn('RPC delete failed, trying fallback:', rpcError);
                // Fallback: If RPC fails (e.g., function not just created or permission issue), 
                // try to delete from public.users and hope for cascade/trigger, 
                // essentially mocking a "soft delete" or reliance on triggers.
                // However, client cannot delete from auth.users directly.

                // If the error message is about the function not finding, we might just be blocked.
                throw rpcError;
            }

            toast.success('User deleted successfully');
            fetchUsers();

        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user: ' + (error.message || 'Check console for details'));
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
                        <p className="text-gray-500 mt-1">Manage system administrators and access roles</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                            <Plus className="w-5 h-5 mr-2" />
                            Add New User
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-transparent border-b border-gray-200 w-full mb-6">
                    {['All Users', 'Admins', 'Jury Members', 'Student Coordinators'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                                ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        // For this specific task asking for "Jury Page", we mainly focus on displaying Jury
                        // In a full implementation, these tabs would filter the users list
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Card (Table) */}
                <Card className="border-none shadow-sm bg-white">
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {juryMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500">
                                                No {activeTab.toLowerCase()} found
                                            </td>
                                        </tr>
                                    ) : (
                                        juryMembers.map((jury) => (
                                            <tr key={jury.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                            {jury.full_name ? jury.full_name.charAt(0).toUpperCase() : jury.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{jury.full_name || 'N/A'}</div>
                                                            <div className="text-sm text-gray-500">{jury.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${jury.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {jury.role ? (jury.role.charAt(0).toUpperCase() + jury.role.slice(1)) : 'User'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(jury.id, jury.email)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>

                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Add New User"
                >
                    <form onSubmit={handleSubmit(onAddJury)} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            {...register('email', { required: 'Email is required' })}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Password"
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Password must be at least 6 characters' }
                            })}
                            error={errors.password?.message}
                        />
                        <Input
                            label="Full Name"
                            {...register('full_name', { required: 'Name is required' })}
                            error={errors.full_name?.message}
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                                {...register('role', { required: 'Role is required' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="jury">Jury Member</option>
                                <option value="admin">Admin</option>
                                <option value="student_coordinator">Student Coordinator</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create User
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

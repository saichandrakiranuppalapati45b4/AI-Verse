import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Linkedin, Github, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const AdminTeam = () => {
    const [members, setMembers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const imageUrl = watch('image_url');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('team-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('team-photos').getPublicUrl(filePath);
            setValue('image_url', data.publicUrl);
            toast.success('Image uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (editingMember) {
                const { error } = await supabase
                    .from('team_members')
                    .update(data)
                    .eq('id', editingMember.id);
                if (error) throw error;
                toast.success('Member updated successfully');
            } else {
                const { error } = await supabase
                    .from('team_members')
                    .insert(data);
                if (error) throw error;
                toast.success('Member added successfully');
            }
            setIsModalOpen(false);
            fetchMembers();
            reset();
        } catch (error) {
            console.error('Error saving member:', error);
            toast.error('Failed to save member');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('Member deleted successfully');
            fetchMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error('Failed to delete member');
        }
    };

    const openModal = (member = null) => {
        setEditingMember(member);
        if (member) {
            reset(member);
        } else {
            reset({
                name: '',
                role: '',
                position: '',
                email: '',
                image_url: '',
                linkedin_url: '',
                github_url: ''
            });
        }
        setIsModalOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                        <p className="text-gray-500 mt-1">Manage core team members and coordinators</p>
                    </div>
                    <Button onClick={() => openModal()} className="bg-primary-600 hover:bg-primary-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Member
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : members.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <p className="text-gray-600">No team members found. Add your first member!</p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-12">
                        {(() => {
                            const teamOrder = [
                                "Communication team",
                                "Design team",
                                "PR team",
                                "Technical team",
                                "Videography team",
                                "Photography team",
                                "Editing team",
                                "Logistics & Operation team",
                                "Social media handling"
                            ];

                            const groupedMembers = members.reduce((acc, member) => {
                                const teamName = member.role || 'Other';
                                if (!acc[teamName]) {
                                    acc[teamName] = [];
                                }
                                acc[teamName].push(member);
                                return acc;
                            }, {});

                            const dbTeams = Object.keys(groupedMembers);
                            const displayTeams = [
                                ...teamOrder.filter(team => dbTeams.includes(team)),
                                ...dbTeams.filter(team => !teamOrder.includes(team))
                            ];

                            return displayTeams.map((teamName) => (
                                <div key={teamName}>
                                    <div className="flex items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-primary-500 pl-3 capitalize">
                                            {teamName}
                                        </h2>
                                        <div className="h-px bg-gray-200 flex-grow ml-4"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {groupedMembers[teamName].map((member) => (
                                            <Card key={member.id} className="hover:shadow-md transition-shadow">
                                                <CardBody className="p-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            {member.image_url ? (
                                                                <img
                                                                    src={member.image_url}
                                                                    alt={member.name}
                                                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">{member.name}</h3>
                                                                <p className="text-sm text-primary-600">
                                                                    <span className="font-medium">{member.position}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => openModal(member)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(member.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-3 text-xs text-gray-500">
                                                        {member.email && (
                                                            <span className="bg-gray-100 px-2 py-1 rounded inline-flex items-center">
                                                                <span className="mr-1">📧</span> {member.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex gap-3">
                                                        {member.linkedin_url ? (
                                                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600">
                                                                <Linkedin className="w-3 h-3 mr-1" /> Linked
                                                            </a>
                                                        ) : (
                                                            <span className="inline-flex items-center text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded cursor-not-allowed">
                                                                <Linkedin className="w-3 h-3 mr-1" /> Linked
                                                            </span>
                                                        )}
                                                        {member.github_url ? (
                                                            <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 hover:text-black">
                                                                <Github className="w-3 h-3 mr-1" /> Git
                                                            </a>
                                                        ) : (
                                                            <span className="inline-flex items-center text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded cursor-not-allowed">
                                                                <Github className="w-3 h-3 mr-1" /> Git
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingMember ? 'Edit Member' : 'Add New Member'}
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Full Name"
                            {...register('name', { required: 'Name is required' })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            {...register('email')}
                            placeholder="member@example.com"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Team</label>
                                <select
                                    {...register('role', { required: 'Team is required' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Select a team...</option>
                                    <option value="Communication team">Communication team</option>
                                    <option value="Design team">Design team</option>
                                    <option value="PR team">PR team</option>
                                    <option value="Technical team">Technical team</option>
                                    <option value="Videography team">Videography team</option>
                                    <option value="Photography team">Photography team</option>
                                    <option value="Editing team">Editing team</option>
                                    <option value="Logistics & Operation team">Logistics & Operation team</option>
                                    <option value="Social media handling">Social media handling</option>
                                </select>
                                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">Role / Position</label>
                                <select
                                    {...register('position', { required: 'Position is required' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Select a position...</option>
                                    <option value="Lead">Lead</option>
                                    <option value="Co-Lead">Co-Lead</option>
                                    <option value="Supporter">Supporter</option>
                                    <option value="Member">Member</option>
                                </select>
                                {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                            <div className="flex items-center gap-4">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="h-12 w-12 rounded-full object-cover border"
                                    />
                                )}
                                <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                                        {uploading ? (
                                            <span>Uploading...</span>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Upload Photo
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <input type="hidden" {...register('image_url')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="LinkedIn URL"
                                {...register('linkedin_url')}
                                placeholder="https://linkedin.com/in/..."
                            />
                            <Input
                                label="GitHub URL"
                                {...register('github_url')}
                                placeholder="https://github.com/..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={uploading}>
                                {editingMember ? 'Update Member' : 'Add Member'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

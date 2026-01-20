import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export const EventRegistration = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [isTeamRegistration, setIsTeamRegistration] = useState(false);
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();

    const teamSize = watch('teamSize', 1);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setEvent(data);
            setIsTeamRegistration(data.team_size_max > 1);
        } catch (error) {
            console.error('Error fetching event:', error);
            toast.error('Event not found');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (formData) => {
        try {
            const teamMembers = [];
            if (isTeamRegistration && teamSize > 1) {
                for (let i = 2; i <= teamSize; i++) {
                    teamMembers.push({
                        name: formData[`member${i}Name`],
                        email: formData[`member${i}Email`],
                        phone: formData[`member${i}Phone`],
                    });
                }
            }

            const { error } = await supabase.from('registrations').insert({
                event_id: id,
                team_name: isTeamRegistration ? formData.teamName : null,
                is_team_registration: isTeamRegistration,
                team_leader_name: formData.leaderName,
                team_leader_email: formData.leaderEmail,
                team_leader_phone: formData.leaderPhone,
                team_members: teamMembers.length > 0 ? teamMembers : null,
                college: formData.college,
                department: formData.department,
            });

            if (error) throw error;

            toast.success('Registration successful!');
            navigate(`/events/${id}`);
        } catch (error) {
            console.error('Error submitting registration:', error);
            toast.error('Registration failed. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-600">Event not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 px-4 bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Event Details
                </Button>

                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold mb-6">Register for {event.title}</h1>

                        {/* Team Info Section - Shown at top for team events */}
                        {isTeamRegistration && (
                            <div className="space-y-4 pt-4 border-t">
                                <Input
                                    label="Team Name"
                                    {...register('teamName', { required: 'Team name is required' })}
                                    error={errors.teamName?.message}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                                    <select
                                        {...register('teamSize')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {Array.from({ length: event.team_size_max - event.team_size_min + 1 }, (_, i) => event.team_size_min + i).map((size) => (
                                            <option key={size} value={size}>{size} members</option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">Select the number of team members (including leader)</p>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            <h3 className="font-semibold text-gray-900 text-lg pt-4 border-t">
                                {isTeamRegistration ? 'Team Leader Details' : 'Your Details'}
                            </h3>
                            <Input
                                label="Full Name"
                                {...register('leaderName', { required: 'Name is required' })}
                                error={errors.leaderName?.message}
                            />
                            <Input
                                label="Email"
                                type="email"
                                {...register('leaderEmail', { required: 'Email is required' })}
                                error={errors.leaderEmail?.message}
                            />
                            <Input
                                label="Phone"
                                {...register('leaderPhone', { required: 'Phone is required' })}
                                error={errors.leaderPhone?.message}
                            />

                            {isTeamRegistration && teamSize > 1 && (
                                <>
                                    <h3 className="font-semibold text-gray-900 text-lg pt-6 border-t">Team Members</h3>
                                    {Array.from({ length: teamSize - 1 }, (_, i) => i + 2).map((memberNum) => (
                                        <div key={memberNum} className="pt-4 border-t border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-4">Member {memberNum}</h4>
                                            <div className="space-y-4">
                                                <Input
                                                    label="Name"
                                                    {...register(`member${memberNum}Name`, { required: 'Name is required' })}
                                                    error={errors[`member${memberNum}Name`]?.message}
                                                />
                                                <Input
                                                    label="Email"
                                                    type="email"
                                                    {...register(`member${memberNum}Email`, { required: 'Email is required' })}
                                                    error={errors[`member${memberNum}Email`]?.message}
                                                />
                                                <Input
                                                    label="Phone"
                                                    {...register(`member${memberNum}Phone`, { required: 'Phone is required' })}
                                                    error={errors[`member${memberNum}Phone`]?.message}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            <div className="flex gap-4 pt-6">
                                <Button type="button" variant="outline" onClick={() => navigate(`/events/${id}`)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" size="lg">
                                    Complete Registration
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

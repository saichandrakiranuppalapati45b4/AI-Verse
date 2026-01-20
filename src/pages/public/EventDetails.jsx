import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export const EventDetails = () => {
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
            reset();
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

    const now = new Date();
    const isUpcoming = event.status === 'upcoming';
    const hasRegistrationStarted = !event.registration_start_date || new Date(event.registration_start_date) <= now;
    const hasRegistrationEnded = event.registration_deadline && new Date(event.registration_deadline) < now;

    const isRegistrationOpen = isUpcoming && hasRegistrationStarted && !hasRegistrationEnded && event.is_live;

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/events')} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </Button>

                {event.banner_url && (
                    <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-auto object-contain rounded-xl shadow-lg mb-8 bg-gray-900"
                    />
                )}

                {/* Event Details - Full Width */}
                <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">{event.title}</h1>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                            {event.event_type.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${event.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {event.status}
                        </span>
                    </div>

                    <div className="text-lg text-gray-700 mb-8 leading-relaxed whitespace-pre-wrap font-sans">
                        {event.description}
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center text-gray-700">
                            <Calendar className="w-5 h-5 mr-3 text-primary-600" />
                            <span>
                                {(() => {
                                    const start = new Date(event.start_date);
                                    const end = event.end_date ? new Date(event.end_date) : null;
                                    const isSameDay = end && start.toDateString() === end.toDateString();

                                    if (!end) {
                                        return start.toLocaleString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        });
                                    }

                                    if (isSameDay) {
                                        return `${start.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })} | ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                                    } else {
                                        return `${start.toLocaleString('en-US', {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                        })} - ${end.toLocaleString('en-US', {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                        })}`;
                                    }
                                })()}
                            </span>
                        </div>
                        {event.location && (
                            <div className="flex items-center text-gray-700">
                                <MapPin className="w-5 h-5 mr-3 text-primary-600" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.registration_deadline && (
                            <div className="flex items-center text-gray-700">
                                <Clock className="w-5 h-5 mr-3 text-primary-600" />
                                <span>
                                    Registration closes on {new Date(event.registration_deadline).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {event.team_size_max > 1 && (
                            <div className="flex items-center text-gray-700">
                                <Users className="w-5 h-5 mr-3 text-primary-600" />
                                <span>
                                    Team size: {event.team_size_min} - {event.team_size_max} members
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Register Button */}
                    {isRegistrationOpen && (
                        <Button
                            onClick={() => {
                                // Navigate to a dedicated registration page with event ID
                                navigate(`/events/${id}/register`);
                            }}
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            Register for this Event
                        </Button>
                    )}

                    {!isRegistrationOpen && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                            <p className="text-gray-600 font-medium">
                                {!event.is_live
                                    ? 'Registration will open when the event goes live.'
                                    : event.status === 'completed'
                                        ? 'This event has been completed.'
                                        : !hasRegistrationStarted
                                            ? `Registration opens on ${new Date(event.registration_start_date).toLocaleString()}`
                                            : 'Registration for this event is currently closed.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

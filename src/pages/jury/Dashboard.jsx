import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight, LogOut, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const JuryDashboard = () => {
    const navigate = useNavigate();
    const { user, userProfile, signOut } = useAuth();
    const [assignedEvents, setAssignedEvents] = useState([]);

    useEffect(() => {
        if (user) {
            fetchAssignedEvents();
        }
    }, [user]);

    const fetchAssignedEvents = async () => {
        try {
            const { data } = await supabase
                .from('jury_assignments')
                .select(`
          *,
          events(*)
        `)
                .eq('jury_id', user.id);

            if (data) {
                setAssignedEvents(data);
            }
        } catch (error) {
            console.error('Error fetching assigned events:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold gradient-text">AI Verse Jury Portal</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {userProfile?.full_name || userProfile?.email}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                                <HomeIcon className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {userProfile?.full_name || 'Jury Member'}!</h2>
                    <p className="text-gray-600">View and evaluate your assigned events</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardBody className="flex items-center">
                            <div className="bg-purple-500 p-3 rounded-lg mr-4">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Assigned Events</p>
                                <p className="text-3xl font-bold text-gray-900">{assignedEvents.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Assigned Events */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Assigned Events</h3>

                    {assignedEvents.length === 0 ? (
                        <Card>
                            <CardBody className="text-center py-12">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-xl text-gray-600">No events assigned yet</p>
                                <p className="text-gray-500 mt-2">Contact the administrator to get assigned to events</p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedEvents.map(({ events: event }) => (
                                <Card key={event.id} className="hover:shadow-xl transition-shadow">
                                    {event.banner_url && (
                                        <img
                                            src={event.banner_url}
                                            alt={event.title}
                                            className="w-full h-40 object-cover"
                                        />
                                    )}
                                    <CardBody>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h4>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                                        <div className="flex items-center text-sm text-gray-600 mb-4">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(event.start_date).toLocaleDateString()}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                                                    event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {event.status}
                                            </span>

                                            <Link to={`/jury/event/${event.id}`}>
                                                <Button size="sm">
                                                    View Details
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

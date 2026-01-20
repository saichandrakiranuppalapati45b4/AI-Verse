import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const EventEvaluation = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [scores, setScores] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            console.log('EventEvaluation: loadData triggered', { authLoading, user: user?.id, eventId });

            // 1. If auth is still loading, do nothing yet (keep component spinner)
            if (authLoading) {
                console.log('EventEvaluation: Auth is loading, waiting...');
                return;
            }

            // 2. Auth is done. If no user, stop loading immediately (will show Error/Redirect)
            if (!user) {
                console.log('EventEvaluation: No user found, stopping load.');
                if (mounted) setLoading(false);
                return;
            }

            // 3. User is present. Start data fetch.
            if (mounted) {
                setLoading(true);
                setError(null);
            }

            // Safety timeout
            const timeoutId = setTimeout(() => {
                if (mounted && loading) {
                    console.error('EventEvaluation: Request timed out');
                    setError('Request timed out. Please check your connection.');
                    setLoading(false);
                }
            }, 10000); // 10 seconds timeout

            try {
                console.log('EventEvaluation: Fetching event details...');
                // Fetch event first as it's critical
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (eventError) {
                    console.error('EventEvaluation: Event fetch error', eventError);
                    throw eventError;
                }
                if (!eventData) {
                    console.error('EventEvaluation: Event not found');
                    throw new Error('Event not found');
                }

                if (mounted) setEvent(eventData);

                console.log('EventEvaluation: Fetching registrations and scores...');
                // Fetch other data in parallel
                await Promise.all([
                    fetchRegistrations(),
                    fetchMyScores()
                ]);
                console.log('EventEvaluation: Data fetch complete');

            } catch (err) {
                console.error('Error loading event data:', err);
                if (mounted) setError(err.message);
            } finally {
                clearTimeout(timeoutId);
                if (mounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [eventId, user, authLoading]);

    const fetchRegistrations = async () => {
        try {
            const { data } = await supabase
                .from('registrations')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (data) setRegistrations(data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            // Don't set global error for this, as event might still be valid
        }
    };

    const fetchMyScores = async () => {
        try {
            const { data } = await supabase
                .from('scores')
                .select('*') // Query all fields to get breakdown
                .eq('event_id', eventId)
                .eq('jury_id', user.id);

            if (data) {
                const scoresMap = {};
                data.forEach(score => {
                    scoresMap[score.registration_id] = score; // Store full object
                });
                setScores(scoresMap);
            }
        } catch (error) {
            console.error('Error fetching scores:', error);
            // Don't set global error for this, as event might still be valid
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1f36]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
                <p className="text-xl text-red-500 font-bold mb-4">Error: {error || 'Event not found'}</p>
                <Button onClick={() => navigate('/jury')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/jury')} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                {/* Event Header - Reverted to Light Theme */}
                <Card className="mb-8">
                    <CardBody>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                        <p className="text-gray-600 mb-4">{event.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(event.start_date).toLocaleDateString()}
                            </div>
                            {event.location && (
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {event.location}
                                </div>
                            )}
                            <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {registrations.length} participants
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Action Area */}
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                        Ready to evaluate? Click below to view all teams and assign marks.
                    </p>
                    <Button
                        size="xl"
                        onClick={() => navigate(`/jury/event/${eventId}/teams`)}
                        className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                    >
                        ENTER MARKS
                    </Button>
                </div>
            </div>
        </div>
    );
};

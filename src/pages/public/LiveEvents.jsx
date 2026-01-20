import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const LiveEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('is_live', true)
                .order('start_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Registration</h1>
                    <p className="text-lg text-gray-600">
                        Register for upcoming hackathons, workshops, and tech events
                    </p>
                </div>

                {events.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <p className="text-gray-600 text-lg">No events available for registration at the moment.</p>
                            <p className="text-gray-500 mt-2">Check back soon for upcoming events!</p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {events.map((event) => (
                            <Card key={event.id} className="hover:shadow-lg transition-shadow">
                                <CardBody>
                                    {event.banner_url && (
                                        <img
                                            src={event.banner_url}
                                            alt={event.title}
                                            className="w-full h-auto rounded-lg mb-4"
                                        />
                                    )}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{new Date(event.event_date || event.start_date).toLocaleDateString()}</span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                        {event.team_size_max > 1 && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Users className="w-4 h-4 mr-2" />
                                                <span>Team Event ({event.team_size_min}-{event.team_size_max} members)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/events/${event.id}`)}
                                            className="flex-1"
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/events/${event.id}/register`)}
                                            className="flex-1"
                                        >
                                            Register Now
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

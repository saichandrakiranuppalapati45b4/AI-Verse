import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Filter } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [typeFilter, setTypeFilter] = useState('all'); // all, hackathon, seminar, workshop, tech_event

    useEffect(() => {
        fetchEvents();
    }, [filter, typeFilter]);

    const fetchEvents = async () => {
        try {
            let query = supabase
                .from('events')
                .select('*')
                .eq('is_published', true);

            if (filter === 'upcoming') {
                query = query.eq('status', 'upcoming');
            } else if (filter === 'past') {
                query = query.in('status', ['completed', 'cancelled']);
            }

            if (typeFilter !== 'all') {
                query = query.eq('event_type', typeFilter);
            }

            const { data } = await query.order('start_date', { ascending: filter !== 'past' });

            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const getEventTypeColor = (type) => {
        const colors = {
            hackathon: 'bg-purple-100 text-purple-700',
            seminar: 'bg-blue-100 text-blue-700',
            workshop: 'bg-green-100 text-green-700',
            tech_event: 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Events</h1>
                    <p className="text-xl text-gray-600">
                        Explore our hackathons, seminars, workshops, and tech events
                    </p>
                </div>

                {/* Events Grid */}
                {events.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-600">No events found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <Card
                                key={event.id}
                                className="hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                {event.banner_url && (
                                    <img
                                        src={event.banner_url}
                                        alt={event.title}
                                        className="w-full h-auto object-cover"
                                    />
                                )}
                                <CardBody>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)} capitalize`}>
                                            {event.event_type.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 text-gray-900">{event.title}</h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(event.start_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {event.location}
                                            </div>
                                        )}
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

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const Results = () => {
    const [results, setResults] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('all');

    useEffect(() => {
        fetchPublishedResults();
        fetchEventsWithResults();
    }, [selectedEvent]);

    const fetchEventsWithResults = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('id, title')
                .eq('is_published', true)
                .order('start_date', { ascending: false });

            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchPublishedResults = async () => {
        try {
            let query = supabase
                .from('results')
                .select(`
          *,
          events(id, title, event_type),
          registrations(team_name, team_leader_name, is_team_registration)
        `)
                .eq('is_published', true)
                .order('rank', { ascending: true });

            if (selectedEvent !== 'all') {
                query = query.eq('event_id', selectedEvent);
            }

            const { data } = await query;

            if (data) setResults(data);
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />;
        if (rank === 3) return <Award className="w-8 h-8 text-orange-600" />;
        return null;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-50 border-yellow-200';
        if (rank === 2) return 'bg-gray-50 border-gray-200';
        if (rank === 3) return 'bg-orange-50 border-orange-200';
        return 'bg-white border-gray-200';
    };

    // Group results by event
    const resultsByEvent = results.reduce((acc, result) => {
        const eventId = result.events.id;
        if (!acc[eventId]) {
            acc[eventId] = {
                event: result.events,
                results: [],
            };
        }
        acc[eventId].results.push(result);
        return acc;
    }, {});

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Results</h1>
                    <p className="text-xl text-gray-600">
                        View published results from our events
                    </p>
                </div>

                {/* Event Filter */}
                {events.length > 0 && (
                    <div className="mb-8 flex justify-center">
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                        >
                            <option value="all">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Results */}
                {Object.keys(resultsByEvent).length === 0 ? (
                    <div className="text-center py-16">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl text-gray-600">No results published yet</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.values(resultsByEvent).map(({ event, results }) => (
                            <div key={event.id}>
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
                                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                                        {event.event_type.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {results.map((result) => (
                                        <Card
                                            key={result.id}
                                            className={`border-2 ${getRankColor(result.rank)}`}
                                        >
                                            <CardBody className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    {getRankIcon(result.rank)}
                                                    <div>
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                #{result.rank}
                                                            </span>
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                {result.registrations.is_team_registration
                                                                    ? result.registrations.team_name
                                                                    : result.registrations.team_leader_name}
                                                            </h3>
                                                        </div>
                                                        {result.prize && (
                                                            <p className="text-sm text-primary-600 font-medium mt-1">
                                                                🏆 {result.prize}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary-600">
                                                        {result.final_score} pts
                                                    </p>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

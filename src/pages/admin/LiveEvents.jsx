import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const LiveEvents = () => {
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
                .order('start_date', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const toggleLiveStatus = async (eventId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_live: !currentStatus })
                .eq('id', eventId);

            if (error) throw error;

            toast.success(currentStatus ? 'Event is now offline' : 'Event is now live!');
            fetchEvents();
        } catch (error) {
            console.error('Error updating live status:', error);
            toast.error('Failed to update live status');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Live Events</h1>
                        <p className="text-gray-500 mt-1">Control which events are currently live</p>
                    </div>
                </div>

                {events.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <p className="text-gray-600">No events found. Create an event first.</p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {events.map((event) => (
                            <Card key={event.id}>
                                <CardBody className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 mr-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-gray-900">{event.title}</h3>
                                                {event.is_live && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
                                                        • LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{event.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>📅 {new Date(event.event_date || event.start_date).toLocaleDateString()}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">{event.event_type.replace('_', ' ')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Toggle Switch */}
                                            <button
                                                onClick={() => toggleLiveStatus(event.id, event.is_live)}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${event.is_live ? 'bg-green-600' : 'bg-gray-300'}`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${event.is_live ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                            <span className="text-xs font-medium text-gray-700 min-w-[35px]">
                                                {event.is_live ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

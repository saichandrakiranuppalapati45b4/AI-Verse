import { useEffect, useState } from 'react';
import { Users, Calendar, Trophy, UserCog } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalRegistrations: 0,
        totalJury: 0,
    });

    const [recentEvents, setRecentEvents] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchRecentEvents();
    }, []);

    const fetchStats = async () => {
        try {
            // Total Events
            const { count: totalEvents } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true });

            // Upcoming Events
            const { count: upcomingEvents } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'upcoming');

            // Total Registrations
            const { count: totalRegistrations } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true });

            // Total Jury
            const { count: totalJury } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'jury');

            setStats({
                totalEvents: totalEvents || 0,
                upcomingEvents: upcomingEvents || 0,
                totalRegistrations: totalRegistrations || 0,
                totalJury: totalJury || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setRecentEvents(data);
        } catch (error) {
            console.error('Error fetching recent events:', error);
        }
    };

    const statCards = [
        {
            title: 'Total Events',
            value: stats.totalEvents,
            icon: Calendar,
            color: 'bg-blue-500',
        },
        {
            title: 'Upcoming Events',
            value: stats.upcomingEvents,
            icon: Calendar,
            color: 'bg-green-500',
        },
        {
            title: 'Total Registrations',
            value: stats.totalRegistrations,
            icon: Users,
            color: 'bg-purple-500',
        },
        {
            title: 'Jury Members',
            value: stats.totalJury,
            icon: UserCog,
            color: 'bg-orange-500',
        },
    ];

    return (
        <AdminLayout>
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <Card key={index}>
                            <CardBody className="flex items-center">
                                <div className={`${stat.color} p-3 rounded-lg mr-4`}>
                                    <stat.icon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Recent Events */}
                <Card>
                    <CardHeader>
                        <h3 className="text-xl font-bold">Recent Events</h3>
                    </CardHeader>
                    <CardBody>
                        {recentEvents.length === 0 ? (
                            <p className="text-gray-600">No events yet</p>
                        ) : (
                            <div className="space-y-4">
                                {recentEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                            <p className="text-sm text-gray-600">
                                                {new Date(event.start_date).toLocaleDateString()} • {event.event_type}
                                            </p>
                                        </div>
                                        <div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === 'upcoming'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AdminLayout>
    );
};

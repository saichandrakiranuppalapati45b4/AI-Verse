import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const TeamSelection = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchRegistrations(),
                    fetchMyScores()
                ]);
            } catch (error) {
                console.error("Error loading team data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [eventId, user]);

    const fetchRegistrations = async () => {
        const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });
        if (data) setRegistrations(data);
    };

    const fetchMyScores = async () => {
        const { data } = await supabase
            .from('scores')
            .select('*')
            .eq('event_id', eventId)
            .eq('jury_id', user.id);

        if (data) {
            const scoresMap = {};
            data.forEach(score => {
                scoresMap[score.registration_id] = score;
            });
            setScores(scoresMap);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(`/jury/event/${eventId}`)} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Event
                </Button>

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Team to Score</h1>

                <div className="grid gap-4">
                    {registrations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                            No participants registered yet
                        </div>
                    ) : (
                        registrations.map((registration) => {
                            const score = scores[registration.id];
                            return (
                                <Link
                                    key={registration.id}
                                    to={`/jury/event/${eventId}/score/${registration.id}`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-400 transition-all cursor-pointer">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700">
                                                {registration.is_team_registration
                                                    ? registration.team_name
                                                    : 'Individual Participant'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {registration.team_leader_name}
                                            </p>
                                        </div>

                                        <div className="flex items-center">
                                            {score ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full mr-4">
                                                    Scored: {score.total_score}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold uppercase rounded-full mr-4 group-hover:bg-green-50 group-hover:text-green-600">
                                                    Pending
                                                </span>
                                            )}
                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

import { useEffect, useState } from 'react';
import { Trophy, Eye, CheckCircle, Plus, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';

export const ResultsManagement = () => {
    const [activeTab, setActiveTab] = useState('Assigning'); // 'Assigning', 'Marks'
    const [events, setEvents] = useState([]);

    // Marks Tab State
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [scores, setScores] = useState([]);
    const [results, setResults] = useState([]);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);

    // Assigning Tab State
    const [assignments, setAssignments] = useState([]);
    const [juryMembers, setJuryMembers] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Forms
    const { register: registerPublish, handleSubmit: handleSubmitPublish, reset: resetPublish, formState: { errors: errorsPublish } } = useForm();
    const { register: registerAssign, handleSubmit: handleSubmitAssign, reset: resetAssign, formState: { errors: errorsAssign } } = useForm();

    useEffect(() => {
        fetchEvents();
        if (activeTab === 'Assigning') {
            fetchAssignments();
            fetchJuryMembers();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedEvent && activeTab === 'Marks') {
            fetchScores();
            fetchResults();
        }
    }, [selectedEvent, activeTab]);

    // Data Fetching
    const fetchEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('id, title, event_type, start_date')
                .order('start_date', { ascending: false });
            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchJuryMembers = async () => {
        try {
            const { data } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('role', 'jury')
                .order('full_name');
            if (data) setJuryMembers(data);
        } catch (error) {
            console.error('Error fetching jury:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const { data } = await supabase
                .from('jury_assignments')
                .select(`
                    *,
                    users:jury_id(full_name, email),
                    events(title)
                `)
                .order('assigned_at', { ascending: false });
            if (data) setAssignments(data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const fetchScores = async () => {
        try {
            const { data } = await supabase
                .from('scores')
                .select(`
                  *,
                  registrations(id, team_name, team_leader_name, is_team_registration),
                  users(full_name, email)
                `)
                .eq('event_id', selectedEvent);
            if (data) setScores(data);
        } catch (error) {
            console.error('Error fetching scores:', error);
        }
    };

    const fetchResults = async () => {
        try {
            const { data } = await supabase
                .from('results')
                .select(`
                  *,
                  registrations(team_name, team_leader_name, is_team_registration)
                `)
                .eq('event_id', selectedEvent)
                .order('rank', { ascending: true });
            if (data) setResults(data);
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    // Assigning Actions
    const onAssignJury = async (data) => {
        try {
            const { error } = await supabase
                .from('jury_assignments')
                .insert({
                    jury_id: data.jury_id,
                    event_id: data.event_id,
                });

            if (error) throw error;
            toast.success('Jury assigned to event successfully');
            setIsAssignModalOpen(false);
            resetAssign();
            fetchAssignments();
        } catch (error) {
            console.error('Error assigning jury:', error);
            if (error.code === '23505') {
                toast.error('This jury member is already assigned to this event');
            } else {
                toast.error('Failed to assign jury member');
            }
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;
        try {
            const { error } = await supabase
                .from('jury_assignments')
                .delete()
                .eq('id', assignmentId);
            if (error) throw error;
            toast.success('Assignment removed successfully');
            fetchAssignments();
        } catch (error) {
            console.error('Error removing assignment:', error);
            toast.error('Failed to remove assignment');
        }
    };

    // Marks/Publish Actions
    const aggregatedScores = scores.reduce((acc, score) => {
        if (!acc[score.registration_id]) {
            acc[score.registration_id] = {
                registration: score.registrations,
                scores: [],
                totalScore: 0,
                avgScore: 0,
            };
        }
        acc[score.registration_id].scores.push(score);
        acc[score.registration_id].totalScore += score.total_score;
        acc[score.registration_id].avgScore =
            acc[score.registration_id].totalScore / acc[score.registration_id].scores.length;
        return acc;
    }, {});

    const sortedResults = Object.values(aggregatedScores).sort((a, b) => b.avgScore - a.avgScore);

    const handlePublish = (registration) => {
        setSelectedRegistration(registration);
        const rank = sortedResults.findIndex(r => r.registration.id === registration.registration.id) + 1;
        resetPublish({
            rank,
            final_score: registration.avgScore.toFixed(2),
            prize: '',
        });
        setIsPublishModalOpen(true);
    };

    const onPublishResult = async (data) => {
        try {
            const { error } = await supabase
                .from('results')
                .upsert({
                    event_id: selectedEvent,
                    registration_id: selectedRegistration.registration.id,
                    final_score: parseFloat(data.final_score),
                    rank: parseInt(data.rank),
                    prize: data.prize || null,
                    is_published: data.is_published === 'true',
                });

            if (error) throw error;
            toast.success('Result published successfully');
            setIsPublishModalOpen(false);
            fetchResults();
        } catch (error) {
            console.error('Error publishing result:', error);
            toast.error('Failed to publish result');
        }
    };

    const handleExportCSV = () => {
        if (!sortedResults.length) {
            toast.error('No results to export');
            return;
        }

        const headers = ['Rank', 'Team Name', 'Leader', 'Innovation', 'Feasibility', 'Statistics', 'Revenue', 'Total Score'];
        const csvContent = [
            headers.join(','),
            ...sortedResults.map((item, index) => {
                const scoreCount = item.scores.length;
                const avgInnovation = (item.scores.reduce((sum, s) => sum + (s.innovation_score || 0), 0) / scoreCount).toFixed(0);
                const avgTechnical = (item.scores.reduce((sum, s) => sum + (s.technical_score || 0), 0) / scoreCount).toFixed(0);
                const avgPresentation = (item.scores.reduce((sum, s) => sum + (s.presentation_score || 0), 0) / scoreCount).toFixed(0);
                const avgImpact = (item.scores.reduce((sum, s) => sum + (s.impact_score || 0), 0) / scoreCount).toFixed(0);

                return [
                    index + 1,
                    `"${item.registration.is_team_registration ? item.registration.team_name : 'Individual'}"`,
                    `"${item.registration.team_leader_name}"`,
                    avgInnovation,
                    avgTechnical,
                    avgPresentation,
                    avgImpact,
                    item.avgScore.toFixed(2)
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `results_event_${selectedEvent}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Assigning & Results</h1>

                {/* Tabs */}
                <div className="flex space-x-1 bg-transparent border-b border-gray-200 w-full mb-6">
                    {['Assigning', 'Marks', 'Set Limits'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                                ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'Assigning' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsAssignModalOpen(true)} className="bg-primary-600 hover:bg-primary-700">
                                <Plus className="w-5 h-5 mr-2" />
                                Assign Jury
                            </Button>
                        </div>
                        <Card>
                            <CardBody className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50">
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Jury Member</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Assigned Event</th>
                                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {assignments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="py-8 text-center text-gray-500">
                                                        No assignments found
                                                    </td>
                                                </tr>
                                            ) : (
                                                assignments.map((assignment) => (
                                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                                        <td className="py-4 px-6 font-medium text-gray-900">
                                                            {assignment.users?.full_name || 'Unknown User'}
                                                            <div className="text-xs text-gray-500 font-normal">{assignment.users?.email}</div>
                                                        </td>
                                                        <td className="py-4 px-6 text-gray-700">
                                                            {assignment.events?.title || 'Unknown Event'}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <button
                                                                onClick={() => handleRemoveAssignment(assignment.id)}
                                                                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {activeTab === 'Marks' && (
                    <div className="bg-[#1a1f36] p-8 rounded-xl min-h-[600px] text-white shadow-2xl">
                        {/* Header and Filter */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div className="flex-1 w-full max-w-md">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Select Event to View Marks
                                </label>
                                <select
                                    value={selectedEvent || ''}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                    className="w-full bg-[#252b43] text-white border border-[#2d3550] rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none"
                                >
                                    <option value="" className="text-gray-400">Choose an event</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>
                                            {event.title} {event.status === 'completed' ? '(Completed)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEvent && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleExportCSV}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={!sortedResults.length}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV
                                    </Button>
                                    <div className="flex items-center px-4 py-2 bg-[#252b43] border border-[#2d3550] rounded-lg">
                                        <div className={`w-3 h-3 rounded-full mr-3 ${selectedEvent ? 'bg-green-500' : 'bg-gray-500'
                                            }`}></div>
                                        <span className="text-sm font-semibold tracking-wide text-gray-300">
                                            EVENT {events.find(e => e.id === selectedEvent)?.status === 'completed' ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedEvent && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#2d3550]">
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Team Name</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Leader</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Innovation</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Feasibility</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Statistics</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Revenue</th>
                                            <th className="text-right py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Total</th>
                                            <th className="text-right py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2d3550]">
                                        {sortedResults.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="py-12 text-center text-gray-500">
                                                    No scores submitted yet for this event
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedResults.map((item) => {
                                                // Calculate category averages
                                                const scoreCount = item.scores.length;
                                                const avgInnovation = item.scores.reduce((sum, s) => sum + (s.innovation_score || 0), 0) / scoreCount;
                                                const avgTechnical = item.scores.reduce((sum, s) => sum + (s.technical_score || 0), 0) / scoreCount;
                                                const avgPresentation = item.scores.reduce((sum, s) => sum + (s.presentation_score || 0), 0) / scoreCount;
                                                const avgImpact = item.scores.reduce((sum, s) => sum + (s.impact_score || 0), 0) / scoreCount;
                                                const isPublished = results.some(r => r.registration_id === item.registration.id);

                                                return (
                                                    <tr key={item.registration.id} className="hover:bg-[#252b43] transition-colors group">
                                                        <td className="py-5 px-4 font-semibold text-white">
                                                            {item.registration.is_team_registration
                                                                ? item.registration.team_name
                                                                : 'Individual'}
                                                        </td>
                                                        <td className="py-5 px-4 text-gray-300">
                                                            {item.registration.team_leader_name}
                                                        </td>
                                                        <td className="py-5 px-4 text-center font-mono text-gray-300">
                                                            {avgInnovation.toFixed(0)}
                                                        </td>
                                                        <td className="py-5 px-4 text-center font-mono text-gray-300">
                                                            {avgTechnical.toFixed(0)}
                                                        </td>
                                                        <td className="py-5 px-4 text-center font-mono text-gray-300">
                                                            {avgPresentation.toFixed(0)}
                                                        </td>
                                                        <td className="py-5 px-4 text-center font-mono text-gray-300">
                                                            {avgImpact.toFixed(0)}
                                                        </td>
                                                        <td className="py-5 px-4 text-right font-bold text-2xl text-white">
                                                            {item.avgScore.toFixed(1)}
                                                        </td>
                                                        <td className="py-5 px-4 text-right">
                                                            <button
                                                                onClick={() => handlePublish(item)}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isPublished
                                                                    ? 'bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10'
                                                                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                                                                    }`}
                                                            >
                                                                {isPublished ? 'Published' : 'Publish'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Set Limits' && (
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardBody className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Set Evaluation Limits</h3>

                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                                    <select
                                        value={selectedEvent || ''}
                                        onChange={(e) => setSelectedEvent(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Choose an event...</option>
                                        {events.map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedEvent && (
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);
                                        const updates = {
                                            max_score_innovation: parseInt(formData.get('max_score_innovation')),
                                            max_score_feasibility: parseInt(formData.get('max_score_feasibility')),
                                            max_score_statistics: parseInt(formData.get('max_score_statistics')),
                                            max_score_revenue: parseInt(formData.get('max_score_revenue')),
                                        };

                                        supabase
                                            .from('events')
                                            .update(updates)
                                            .eq('id', selectedEvent)
                                            .then(({ error }) => {
                                                if (error) {
                                                    console.error('Error updating limits:', error);
                                                    toast.error('Failed to update limits');
                                                } else {
                                                    toast.success('Limits updated successfully');
                                                    fetchEvents();
                                                }
                                            });
                                    }}>
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            {['Innovation', 'Feasibility', 'Statistics', 'Revenue'].map((criteria) => {
                                                const fieldName = `max_score_${criteria.toLowerCase()}`;
                                                const currentEvent = events.find(e => e.id === selectedEvent);
                                                const defaultValue = currentEvent ? currentEvent[fieldName] : 10;

                                                return (
                                                    <div key={criteria}>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Max {criteria} Score
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            name={fieldName}
                                                            defaultValue={defaultValue}
                                                            min="1"
                                                            required
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                                                Save Limits
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Modals */}
                <Modal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    title="Assign Jury to Event"
                >
                    <form onSubmit={handleSubmitAssign(onAssignJury)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                            <select
                                {...registerAssign('event_id', { required: 'Event is required' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Choose Event</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.title}</option>
                                ))}
                            </select>
                            {errorsAssign.event_id && <p className="text-red-500 text-sm mt-1">{errorsAssign.event_id.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Jury Member</label>
                            <select
                                {...registerAssign('jury_id', { required: 'Jury member is required' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Choose Jury</option>
                                {juryMembers.map(jury => (
                                    <option key={jury.id} value={jury.id}>{jury.full_name} ({jury.email})</option>
                                ))}
                            </select>
                            {errorsAssign.jury_id && <p className="text-red-500 text-sm mt-1">{errorsAssign.jury_id.message}</p>}
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Assign
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    title="Publish Result"
                >
                    <form onSubmit={handleSubmitPublish(onPublishResult)} className="space-y-4">
                        <Input
                            label="Rank"
                            type="number"
                            {...registerPublish('rank', { required: 'Rank is required' })}
                            error={errorsPublish.rank?.message}
                        />
                        <Input
                            label="Final Score"
                            type="number"
                            step="0.01"
                            {...registerPublish('final_score', { required: 'Score is required' })}
                            error={errorsPublish.final_score?.message}
                        />
                        <Input
                            label="Prize (optional)"
                            {...registerPublish('prize')}
                            placeholder="e.g., Winner, Runner Up, Best Innovation"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publish Status</label>
                            <select
                                {...registerPublish('is_published')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="false">Draft (not visible to public)</option>
                                <option value="true">Published (visible to public)</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsPublishModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Publish Result
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

import { useEffect, useState } from 'react';
import { Download, Search, Filter, Trash2, CheckCircle, XCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

export const ParticipantsManagement = () => {
    const { userProfile } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Registrations');

    // Attendance Modal State
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkInSession, setCheckInSession] = useState('Morning');
    const [selectedRegistrationForCheckIn, setSelectedRegistrationForCheckIn] = useState(null);
    const [attendanceLogs, setAttendanceLogs] = useState([]);

    useEffect(() => {
        fetchEvents();
        fetchRegistrations();
        if (activeTab === 'Checked In Info') {
            fetchAttendanceLogs();
        }
    }, [selectedEvent, activeTab]);

    const fetchAttendanceLogs = async () => {
        try {
            let query = supabase
                .from('attendance_logs')
                .select(`
                    *,
                    registrations (
                        team_name,
                        team_leader_name,
                        is_team_registration
                    ),
                    events (title)
                `)
                .order('created_at', { ascending: false });

            if (selectedEvent !== 'all') {
                query = query.eq('event_id', selectedEvent);
            }

            const { data, error } = await query;
            if (error) throw error;
            setAttendanceLogs(data || []);
        } catch (error) {
            console.error('Error fetching attendance logs:', error);
            toast.error('Failed to fetch attendance logs');
        }
    };

    const handleOpenCheckInModal = (registration) => {
        setSelectedRegistrationForCheckIn(registration);
        setIsCheckInModalOpen(true);
    };

    const handleSubmitCheckIn = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('attendance_logs')
                .insert({
                    registration_id: selectedRegistrationForCheckIn.id,
                    event_id: selectedRegistrationForCheckIn.event_id,
                    check_in_date: checkInDate,
                    session: checkInSession
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error('This participant is already checked in for this session');
                } else {
                    throw error;
                }
            } else {
                toast.success('Check-in recorded successfully');
                setIsCheckInModalOpen(false);
                // Optionally update local checked_in state if needed, generally logs are separate
            }
        } catch (error) {
            console.error('Error recording check-in:', error);
            toast.error('Failed to record check-in');
        }
    };


    const fetchEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('id, title')
                .order('start_date', { ascending: false });

            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchRegistrations = async () => {
        try {
            let query = supabase
                .from('registrations')
                .select(`
          *,
          events(title, event_type)
        `)
                .order('created_at', { ascending: false });

            if (selectedEvent !== 'all') {
                query = query.eq('event_id', selectedEvent);
            }

            const { data } = await query;

            if (data) setRegistrations(data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    const filteredRegistrations = registrations.filter(reg => {
        const searchLower = searchTerm.toLowerCase();
        return (
            reg.team_leader_name.toLowerCase().includes(searchLower) ||
            reg.team_leader_email.toLowerCase().includes(searchLower) ||
            (reg.team_name && reg.team_name.toLowerCase().includes(searchLower))
        );
    });

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportEventId, setExportEventId] = useState('');

    const handleOpenExportModal = () => {
        setExportEventId('');
        setIsExportModalOpen(true);
    };

    const handleExportConfirm = async () => {
        if (!exportEventId) {
            toast.error('Please select an event to export');
            return;
        }

        try {
            // Fetch registrations for the specific event directly from DB to ensure clean export
            const { data: exportData, error } = await supabase
                .from('registrations')
                .select(`
                    *,
                    events(title)
                `)
                .eq('event_id', exportEventId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!exportData || exportData.length === 0) {
                toast.error('No registrations found for this event');
                return;
            }

            const headers = [
                'Event',
                'Team Name',
                'Member Type',
                'Name',
                'Email',
                'Phone',
                'Status',
                'Registered At'
            ];

            const csvRows = [];

            exportData.forEach(reg => {
                // Add team leader row
                csvRows.push([
                    reg.events.title,
                    reg.team_name || 'Individual',
                    reg.is_team_registration ? 'Team Leader' : 'Individual',
                    reg.team_leader_name,
                    reg.team_leader_email,
                    reg.team_leader_phone,
                    reg.registration_status,
                    new Date(reg.created_at).toLocaleDateString()
                ]);

                // Add team members
                if (reg.is_team_registration && reg.team_members && reg.team_members.length > 0) {
                    reg.team_members.forEach((member, index) => {
                        csvRows.push([
                            reg.events.title,
                            reg.team_name,
                            `Team Member ${index + 1}`,
                            member.name,
                            member.email,
                            member.phone,
                            reg.registration_status,
                            new Date(reg.created_at).toLocaleDateString()
                        ]);
                    });
                }
            });

            const csvContent = [
                headers.join(','),
                ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `registrations_${exportData[0].events.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Data exported successfully');
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        }
    };


    const handleApprove = async (registrationId) => {
        try {
            const { error } = await supabase
                .from('registrations')
                .update({ registration_status: 'approved' })
                .eq('id', registrationId);

            if (error) throw error;

            toast.success('Registration approved successfully');
            fetchRegistrations();
        } catch (error) {
            console.error('Error approving registration:', error);
            toast.error('Failed to approve registration');
        }
    };

    const handleDelete = async (registrationId) => {
        if (!confirm('Are you sure you want to delete this registration?')) return;

        try {
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registrationId);

            if (error) throw error;

            toast.success('Registration deleted successfully');
            fetchRegistrations();
        } catch (error) {
            console.error('Error deleting registration:', error);
            toast.error('Failed to delete registration');
        }
    };

    const handleToggleCheckIn = async (registrationId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('registrations')
                .update({ checked_in: !currentStatus })
                .eq('id', registrationId);

            if (error) throw error;

            toast.success(currentStatus ? 'Marked as absent' : 'Checked in successfully');
            fetchRegistrations();
        } catch (error) {
            console.error('Error updating check-in status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleSendTicket = async (registrationId) => {
        const toastId = toast.loading('Sending ticket...');
        try {
            // detailed logging/debugging removed as invoke handles details
            const { data, error } = await supabase.functions.invoke('send-event-ticket', {
                body: { registration_id: registrationId }
            });

            if (error) {
                // If it's a function error, it might be in error object or data
                console.error('Function Invocation Error:', error);
                // Try to parse the error message better
                let errorMsg = error.message;
                try {
                    // Sometimes context is in error.context
                    if (error.context?.json) {
                        const json = await error.context.json();
                        errorMsg = json.error || json.message || errorMsg;
                    }
                } catch (e) { }

                throw new Error(errorMsg || 'Failed to send ticket via Function');
            }

            // Sometimes success is waiting in data even if no error thrown
            if (data && !data.success) {
                throw new Error(data.error || data.message || 'Ticket sending returned failure');
            }

            toast.success('Ticket sent successfully!', { id: toastId });
        } catch (error) {
            console.error('Error sending ticket:', error);
            toast.error(error.message, { id: toastId, duration: 5000 });
        }
    };

    return (
        <div>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Participants Management</h2>
                    <Button onClick={handleOpenExportModal}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-transparent border-b border-gray-200 w-full mb-6">
                    {['Registrations', 'Checked In', 'Checked In Info'].map((tab) => (
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

                {/* Filters */}
                <Card className="mb-6">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Filter className="w-4 h-4 inline mr-2" />
                                    Filter by Event
                                </label>
                                <select
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="all">All Events</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Search className="w-4 h-4 inline mr-2" />
                                    Search
                                </label>
                                <Input
                                    placeholder="Search by name, email, or team..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-primary-600">{filteredRegistrations.length}</p>
                            <p className="text-sm text-gray-600">Total Registrations</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-green-600">
                                {filteredRegistrations.filter(r => r.registration_status === 'approved').length}
                            </p>
                            <p className="text-sm text-gray-600">Approved</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-yellow-600">
                                {filteredRegistrations.filter(r => r.registration_status === 'pending').length}
                            </p>
                            <p className="text-sm text-gray-600">Pending</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Content */}
                {/* Registrations List */}
                {activeTab === 'Registrations' && (
                    filteredRegistrations.length === 0 ? (
                        <Card>
                            <CardBody className="text-center py-12">
                                <p className="text-gray-600">No registrations found</p>
                            </CardBody>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredRegistrations.map((registration) => (
                                <Card key={registration.id}>
                                    <CardBody>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {registration.is_team_registration
                                                        ? `${registration.team_name} (Team)`
                                                        : registration.team_leader_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{registration.events.title}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${registration.registration_status === 'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : registration.registration_status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {registration.registration_status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">
                                                    <strong>Leader:</strong> {registration.team_leader_name}
                                                </p>
                                                <p className="text-gray-600">
                                                    <strong>Email:</strong> {registration.team_leader_email}
                                                </p>
                                                <p className="text-gray-600">
                                                    <strong>Phone:</strong> {registration.team_leader_phone}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">
                                                    <strong>College:</strong> {registration.college || 'N/A'}
                                                </p>
                                                <p className="text-gray-600">
                                                    <strong>Department:</strong> {registration.department || 'N/A'}
                                                </p>
                                                {registration.is_team_registration && (
                                                    <p className="text-gray-600">
                                                        <strong>Team Size:</strong> {(registration.team_members?.length || 0) + 1} members
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {registration.is_team_registration && registration.team_members && registration.team_members.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <p className="font-semibold text-sm text-gray-700 mb-2">Team Members:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {registration.team_members.map((member, idx) => (
                                                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                            <p><strong>{member.name}</strong></p>
                                                            <p>{member.email}</p>
                                                            <p>{member.phone}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-500 mt-4">
                                            Registered: {new Date(registration.created_at).toLocaleString()}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-4 pt-4 border-t">
                                            {/* Only Admins can Approve/Reject */}
                                            {userProfile?.role === 'admin' && registration.registration_status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(registration.id)}
                                                    className="flex-1"
                                                >
                                                    Approve
                                                </Button>
                                            )}

                                            {/* Everyone can see Send Ticket? Maybe only admins? User said "see registrations" for coordinators. 
                                                Let's assume Send Ticket is safe/useful for coordinators too, OR keep it admin only.
                                                "Only have access to see the registrations" implies READ ONLY.
                                                I will hide Ticket button for Student Coordinators to be safe.
                                            */}
                                            {userProfile?.role === 'admin' && registration.registration_status === 'approved' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSendTicket(registration.id)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Send Ticket
                                                </Button>
                                            )}

                                            {/* Only Admins can Delete */}
                                            {userProfile?.role === 'admin' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(registration.id)}
                                                    className="text-red-600 hover:bg-red-50 border-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {/* Checked In List */}
                {activeTab === 'Checked In' && (
                    <div className="space-y-4">
                        {filteredRegistrations.filter(r => r.registration_status === 'approved').length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                                No approved registrations found to check in.
                            </div>
                        ) : (
                            filteredRegistrations.filter(r => r.registration_status === 'approved').map((registration) => (
                                <Card key={registration.id} className={registration.checked_in ? 'border-green-500 border-2' : ''}>
                                    <CardBody>
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                                    {registration.is_team_registration
                                                        ? `${registration.team_name}`
                                                        : registration.team_leader_name}
                                                    {registration.checked_in && (
                                                        <span className="ml-3 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Checked In
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-600">{registration.events.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Leader: {registration.team_leader_name} | {registration.team_leader_phone}
                                                </p>
                                            </div>

                                            <Button
                                                onClick={() => handleOpenCheckInModal(registration)}
                                                className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark Present
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Attendance Logs List */}
                {activeTab === 'Checked In Info' && (
                    <div className="bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Time</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Participant / Team</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Event</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Session</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {attendanceLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                No attendance records found
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    {log.registrations?.is_team_registration
                                                        ? log.registrations?.team_name
                                                        : log.registrations?.team_leader_name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {log.events?.title}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.session === 'Morning' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                                                        }`}>
                                                        {log.check_in_date} ({log.session})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Check In Modal */}
                <Modal
                    isOpen={isCheckInModalOpen}
                    onClose={() => setIsCheckInModalOpen(false)}
                    title="Participant Check In"
                >
                    <form onSubmit={handleSubmitCheckIn} className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Recording attendance for: <span className="font-bold text-gray-900">
                                    {selectedRegistrationForCheckIn?.is_team_registration
                                        ? selectedRegistrationForCheckIn?.team_name
                                        : selectedRegistrationForCheckIn?.team_leader_name}
                                </span>
                            </p>
                        </div>

                        <Input
                            type="date"
                            label="Check-in Date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                            <select
                                value={checkInSession}
                                onChange={(e) => setCheckInSession(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCheckInModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                Confirm Present
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Export Modal */}
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Export Participants</h3>
                            <p className="text-gray-600 mb-4">Select an event to export registration data.</p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                                <select
                                    value={exportEventId}
                                    onChange={(e) => setExportEventId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Select Event --</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleExportConfirm} disabled={!exportEventId}>
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';

export const EventsManagement = () => {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [activeTab, setActiveTab] = useState('public');
    const [uploading, setUploading] = useState(false);
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: false });

            if (data) setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const filteredEvents = events.filter(event => {
        if (activeTab === 'public') return event.is_published;
        if (activeTab === 'draft') return true; // Show all events in Draft/Manage tab so they don't disappear when toggled
        return true;
    });

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-banners')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('event-banners').getPublicUrl(filePath);

            setValue('banner_url', data.publicUrl);
            toast.success('Image uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const toLocalISOString = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const handleOpenModal = (event = null) => {
        setEditingEvent(event);
        if (event) {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date || event.start_date);

            const isSameDay = start.getFullYear() === end.getFullYear() &&
                start.getMonth() === end.getMonth() &&
                start.getDate() === end.getDate();

            setIsMultiDay(!isSameDay);

            let formData = {
                ...event,
                registration_start_date: toLocalISOString(event.registration_start_date),
                registration_deadline: toLocalISOString(event.registration_deadline),
                start_date_full: toLocalISOString(event.start_date),
                end_date_full: toLocalISOString(event.end_date || event.start_date),
            };

            if (isSameDay) {
                const year = start.getFullYear();
                const month = String(start.getMonth() + 1).padStart(2, '0');
                const day = String(start.getDate()).padStart(2, '0');

                formData.single_date = `${year}-${month}-${day}`;
                formData.single_start_time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                formData.single_end_time = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            }

            reset(formData);
        } else {
            setIsMultiDay(false);
            // Default is_published to false if we are in draft tab
            reset({ is_published: activeTab === 'public' });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            let finalStartDate, finalEndDate;

            if (editingEvent) {
                // Logic for Editing Event (Fields are visible)
                if (isMultiDay) {
                    finalStartDate = new Date(data.start_date_full).toISOString();
                    finalEndDate = new Date(data.end_date_full).toISOString();
                } else {
                    if (!data.single_date || !data.single_start_time || !data.single_end_time) {
                        toast.error('Please fill in Date, Start Time and End Time');
                        return;
                    }
                    const startStr = `${data.single_date}T${data.single_start_time}`;
                    const endStr = `${data.single_date}T${data.single_end_time}`;

                    finalStartDate = new Date(startStr).toISOString();
                    finalEndDate = new Date(endStr).toISOString();
                }
            } else {
                // Logic for Creating Event (Fields are HIDDEN, use defaults)
                // Use the user-provided quick_date
                if (!data.quick_date) {
                    toast.error('Date is required');
                    return;
                }
                const chosenDate = new Date(data.quick_date);
                // Set time to 09:00 AM by default
                chosenDate.setHours(9, 0, 0, 0);

                finalStartDate = chosenDate.toISOString();
                // End date = same day 5 PM
                const endDate = new Date(chosenDate);
                endDate.setHours(17, 0, 0, 0);
                finalEndDate = endDate.toISOString();
            }

            const cleanData = {
                title: data.title,
                description: editingEvent ? data.description : 'To be announced', // Default description for quick create
                // If editing, use form data. If creating, use defaults.
                event_type: editingEvent ? data.event_type : 'tech_event',
                location: editingEvent ? data.location : 'To be announced',
                banner_url: data.banner_url || null, // Might be null in create
                start_date: finalStartDate,
                end_date: finalEndDate,
                registration_start_date: editingEvent && data.registration_start_date ? new Date(data.registration_start_date).toISOString() : new Date().toISOString(),
                registration_deadline: editingEvent && data.registration_deadline ? new Date(data.registration_deadline).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                max_participants: data.max_participants ? parseInt(data.max_participants) : null,
                team_size_min: parseInt(data.team_size_min) || 1,
                team_size_max: parseInt(data.team_size_max) || 1,
                status: 'upcoming',
                // For new events, strictly use the activeTab logic we set in reset(), but here we can just force it if we want secure logic.
                // data.is_published might be undefined if field is hidden.
                is_published: editingEvent ? data.is_published : (activeTab === 'public'),
            };

            if (editingEvent) {
                const { error } = await supabase
                    .from('events')
                    .update(cleanData)
                    .eq('id', editingEvent.id);

                if (error) throw error;
                toast.success('Event updated successfully');
            } else {
                const { error } = await supabase
                    .from('events')
                    .insert(cleanData);

                if (error) throw error;
                toast.success('Event created successfully');
            }

            setIsModalOpen(false);
            fetchEvents();
            reset({});
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error(`Failed to save event: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const handleTogglePublish = async (event) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_published: !event.is_published })
                .eq('id', event.id);

            if (error) throw error;
            toast.success(`Event ${event.is_published ? 'unpublished' : 'published'} successfully`);
            fetchEvents();
        } catch (error) {
            console.error('Error toggling publish status:', error);
            toast.error('Failed to update event status');
        }
    };

    const handleSendReminders = async () => {
        const toastId = toast.loading('Sending reminders...');
        try {
            // 1. Verify Session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error("Session Error:", sessionError);
                throw new Error("No active session. Please log in again.");
            }

            console.log("Invoking function with user:", session.user.email);

            // 2. Invoke Function
            const { data, error } = await supabase.functions.invoke('send-event-reminders', {
                body: {},
            });

            if (error) {
                console.error('Function Invocation Error:', error);

                // Check for Invalid JWT - highly indicative of project mismatch
                if (error.message && error.message.includes("Invalid JWT")) {
                    console.error("CRITICAL: JWT Mismatch. Your frontend is likely connected to a different Supabase project than your functions.");
                    console.error("Frontend URL:", import.meta.env.VITE_SUPABASE_URL);
                    throw new Error("Configuration Error: Invalid JWT. Please check that your VITE_SUPABASE_URL matches the project you deployed functions to.");
                }

                // Try to parse the error message better
                let errorMsg = error.message;
                try {
                    if (error.context?.json) {
                        const json = await error.context.json();
                        errorMsg = json.error || json.message || errorMsg;
                    }
                } catch (e) { }

                throw new Error(errorMsg || 'Failed to send reminders via Function');
            }

            // Check for error in response data logic
            if (data && !data.success) {
                throw new Error(data.error || 'Failed to send reminders');
            }

            if (data.summary && data.summary.length > 0) {
                const sentCount = data.summary.filter(s => s.status === 'sent').length;
                toast.success(`Reminders sent: ${sentCount}`, { id: toastId });
            } else {
                toast.success(data.message || 'No reminders needed sending.', { id: toastId });
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
            const message = error.message || 'Failed to send reminders';
            toast.error(message, { id: toastId });
        }
    };

    // Debugging Helper
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectId = supabaseUrl?.split('.')[0]?.replace('https://', '');

    return (
        <AdminLayout>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 font-mono">
                <p><strong>DEBUG CONFIGURATION:</strong></p>
                <p>Supabase URL: {supabaseUrl}</p>
                <p>Project ID: {projectId}</p>
                <p>Key (Start): {import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10)}...</p>
                <p>Please verify this Project ID matches the one you deployed functions to.</p>
            </div>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Events Management</h2>
                        <p className="text-gray-500 mt-1">Create and manage events</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab('public')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === 'public'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Public Events
                        </button>
                        <button
                            onClick={() => setActiveTab('draft')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === 'draft'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Draft Events
                        </button>
                    </div>

                    {activeTab === 'draft' && (
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleSendReminders}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Reminders
                            </Button>
                            <Button onClick={() => handleOpenModal()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Event
                            </Button>
                        </div>
                    )}
                </div>

                {filteredEvents.length === 0 ? (
                    <Card><CardBody className="text-center py-12 text-gray-600">No {activeTab} events found.</CardBody></Card>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => (
                            <Card key={event.id}>
                                <CardBody className="py-4 flex items-center justify-between">
                                    <div className="flex-1 mr-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                                            {!event.is_published && <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Draft</span>}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{event.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>📅 {new Date(event.start_date).toLocaleString()}</span>
                                            {event.location && <span>📍 {event.location}</span>}
                                            <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{event.event_type.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={() => handleTogglePublish(event)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${event.is_published ? 'bg-green-500' : 'bg-gray-200'}`}
                                            title={event.is_published ? 'Unpublish Event' : 'Publish Event'}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event.is_published ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(event)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingEvent ? 'Edit Event' : 'Create Event'}
                    size="lg"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input label="Event Title" {...register('title', { required: 'Title is required' })} error={errors.title?.message} />

                        {!editingEvent ? (
                            <Input
                                label="Event Date"
                                type="date"
                                {...register('quick_date', { required: 'Date is required' })}
                                error={errors.quick_date?.message}
                            />
                        ) : (
                            <Textarea label="Description" {...register('description', { required: 'Description is required' })} error={errors.description?.message} />
                        )}

                        {editingEvent && (
                            <>
                                {/* Publish Toggle */}
                                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <input
                                        type="checkbox"
                                        id="is_published"
                                        className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        {...register('is_published')}
                                    />
                                    <label htmlFor="is_published" className="text-sm font-medium text-gray-900 cursor-pointer select-none">
                                        Publish this event immediately?
                                    </label>
                                </div>

                                <Select
                                    label="Event Type"
                                    {...register('event_type', { required: 'Event type is required' })}
                                    error={errors.event_type?.message}
                                    options={[
                                        { value: '', label: 'Select type' },
                                        { value: 'hackathon', label: 'Hackathon' },
                                        { value: 'seminar', label: 'Seminar' },
                                        { value: 'workshop', label: 'Workshop' },
                                        { value: 'tech_event', label: 'Tech Event' },
                                    ]}
                                />

                                {/* Event Duration Toggle */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="font-medium text-gray-900">Event Schedule</label>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${!isMultiDay ? 'font-bold text-primary-600' : 'text-gray-500'}`}>One Day</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsMultiDay(!isMultiDay)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMultiDay ? 'bg-primary-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMultiDay ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <span className={`text-sm ${isMultiDay ? 'font-bold text-primary-600' : 'text-gray-500'}`}>Multi Day</span>
                                        </div>
                                    </div>

                                    {isMultiDay ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Start Date & Time"
                                                type="datetime-local"
                                                {...register('start_date_full', { required: isMultiDay ? 'Start date is required' : false })}
                                            />
                                            <Input
                                                label="End Date & Time"
                                                type="datetime-local"
                                                {...register('end_date_full', { required: isMultiDay ? 'End date is required' : false })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="Date"
                                                type="date"
                                                {...register('single_date', { required: !isMultiDay ? 'Date is required' : false })}
                                            />
                                            <Input
                                                label="Start Time"
                                                type="time"
                                                {...register('single_start_time', { required: !isMultiDay ? 'Start time is required' : false })}
                                            />
                                            <Input
                                                label="End Time"
                                                type="time"
                                                {...register('single_end_time', { required: !isMultiDay ? 'End time is required' : false })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Registration Window */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block font-medium text-gray-900 mb-4">Registration Window</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Opens At"
                                            type="datetime-local"
                                            {...register('registration_start_date', { required: 'Registration start is required' })}
                                            error={errors.registration_start_date?.message}
                                        />
                                        <Input
                                            label="Closes At (Deadline)"
                                            type="datetime-local"
                                            {...register('registration_deadline', { required: 'Deadline is required' })}
                                            error={errors.registration_deadline?.message}
                                        />
                                    </div>
                                </div>

                                <Input label="Location" {...register('location')} />

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Event Banner</label>
                                    <div className="flex items-center gap-4">
                                        {watch('banner_url') && (
                                            <img src={watch('banner_url')} alt="Banner" className="h-20 w-32 object-cover rounded-md border" />
                                        )}
                                        <label className="cursor-pointer btn-secondary">
                                            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
                                                <Plus className="w-4 h-4" /> Upload Banner
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                        </label>
                                    </div>
                                    <input type="hidden" {...register('banner_url')} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Min Team Size" type="number" defaultValue={1} {...register('team_size_min')} />
                                    <Input label="Max Team Size" type="number" defaultValue={1} {...register('team_size_max')} />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingEvent ? 'Update' : 'Create'} Event</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
};

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Loader, Trash2, CheckCircle } from 'lucide-react';

export const AdminContact = () => {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'edit'

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
                    <p className="text-gray-500 mt-1">Manage contact requests and page content</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none border-b-2 transition-colors ${activeTab === 'requests'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none border-b-2 transition-colors ${activeTab === 'edit'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Edit Page Content
                    </button>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'requests' ? <ContactRequestsTab /> : <EditContentTab />}
                </div>
            </div>
        </AdminLayout>
    );
};

const ContactRequestsTab = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contact_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load contact requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const { error } = await supabase
                .from('contact_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setRequests(requests.map(req =>
                req.id === id ? { ...req, status: newStatus } : req
            ));
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            const { error } = await supabase
                .from('contact_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRequests(requests.filter(req => req.id !== id));
            toast.success('Request deleted');
        } catch (error) {
            toast.error('Failed to delete request');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary-600" /></div>;

    return (
        <div className="space-y-4">
            {requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
                    No contact requests found
                </div>
            ) : (
                requests.map((request) => (
                    <Card key={request.id} className={request.status === 'new' ? 'border-l-4 border-l-primary-500' : ''}>
                        <CardBody>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{request.subject}</h3>
                                        {request.status === 'new' && (
                                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase">New</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mb-2">
                                        From: <span className="font-medium text-gray-900">{request.name}</span> ({request.email})
                                        <span className="mx-2">•</span>
                                        {new Date(request.created_at).toLocaleString()}
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md mt-2">
                                        {request.message}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                    {request.status === 'new' && (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(request.id, 'read')}>
                                            <CheckCircle className="w-4 h-4 mr-1" /> Mark Read
                                        </Button>
                                    )}
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(request.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))
            )}
        </div>
    );
};

const EditContentTab = () => {
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        address: '',
        instagram: '',
        linkedin: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_pages')
                .select('content')
                .eq('page_name', 'contact')
                .single();

            if (data) {
                setFormData({
                    email: data.content.email || '',
                    phone: data.content.phone || '',
                    address: data.content.address || '',
                    instagram: data.content.social?.instagram || '',
                    linkedin: data.content.social?.linkedin || ''
                });
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const contentPayload = {
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                social: {
                    instagram: formData.instagram,
                    linkedin: formData.linkedin
                }
            };

            const { error } = await supabase
                .from('content_pages')
                .upsert({
                    page_name: 'contact',
                    content: contentPayload,
                    updated_at: new Date()
                }, { onConflict: 'page_name' });

            if (error) throw error;
            toast.success('Contact page content updated');
        } catch (error) {
            console.error('Error saving content:', error);
            toast.error('Failed to update content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary-600" /></div>;

    return (
        <Card>
            <CardBody>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Contact Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            icon={Mail}
                        />
                        <Input
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            icon={Phone}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <textarea
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Instagram URL"
                                value={formData.instagram}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                placeholder="https://instagram.com/..."
                            />
                            <Input
                                label="LinkedIn URL"
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="https://linkedin.com/..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardBody>
        </Card>
    );
};

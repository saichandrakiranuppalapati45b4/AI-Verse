import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Image as ImageIcon, Trash2, Loader, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const AdminGallery = () => {
    const { user } = useAuth();
    const [images, setImages] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [imagesRes, eventsRes] = await Promise.all([
                supabase
                    .from('gallery')
                    .select('*, events(title)')
                    .order('upload_date', { ascending: false }),
                supabase
                    .from('events')
                    .select('id, title')
                    .order('created_at', { ascending: false })
            ]);

            if (imagesRes.error) throw imagesRes.error;
            if (eventsRes.error) throw eventsRes.error;

            setImages(imagesRes.data || []);
            setEvents(eventsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load gallery data');
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return;
        }

        if (!selectedEventId) {
            toast.error('Please select an event first');
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('gallery-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('gallery-images')
                .getPublicUrl(filePath);

            // 3. Save to Database
            const { data: dbData, error: dbError } = await supabase
                .from('gallery')
                .insert([
                    {
                        title: file.name.split('.')[0], // Default title from filename
                        description: '',
                        image_url: publicUrl,
                        uploaded_by: user.id,
                        event_id: selectedEventId
                    }
                ])
                .select('*, events(title)')
                .single();

            if (dbError) throw dbError;

            // Update UI
            setImages([dbData, ...images]);
            toast.success('Image uploaded successfully');

        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, imageUrl) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            // 1. Delete from Database
            const { error: dbError } = await supabase
                .from('gallery')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            if (fileName) {
                const { error: storageError } = await supabase.storage
                    .from('gallery-images')
                    .remove([fileName]);

                if (storageError) console.warn('Could not delete file from storage', storageError);
            }

            // Update UI
            setImages(images.filter(img => img.id !== id));
            toast.success('Image deleted');

        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Failed to delete image');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
                        <p className="text-gray-500 mt-1">Upload and manage event photos</p>
                    </div>
                </div>

                {/* Upload Area */}
                <Card>
                    <CardBody>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Event for Upload
                            </label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">-- Select an Event --</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Choose which event these photos belong to.
                            </p>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer relative ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleChange}
                                accept="image/*"
                                disabled={uploading}
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                                    <p className="text-gray-600 font-medium">Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {dragActive ? 'Drop image to upload' : 'Drop images here'}
                                    </h3>
                                    <p className="text-gray-500 mt-2">or click to browse form your computer</p>
                                    <p className="text-xs text-gray-400 mt-4">Supports: JPG, PNG, GIF (Max 5MB)</p>
                                </>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No images uploaded yet
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <img
                                    src={image.image_url}
                                    alt={image.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                        onClick={() => handleDelete(image.id, image.image_url)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 hover:scale-110 transition-transform shadow-lg"
                                        title="Delete Image"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs font-semibold truncate">{image.title}</p>
                                    {image.events && (
                                        <p className="text-[10px] text-gray-300 truncate">
                                            {image.events.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

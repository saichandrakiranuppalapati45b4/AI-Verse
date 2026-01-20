import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const Gallery = () => {
    const [groupedImages, setGroupedImages] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('gallery')
                .select('*, events(title)')
                .order('upload_date', { ascending: false });

            if (data) {
                // Group by Event Title
                const groups = {};
                data.forEach(img => {
                    // Fallback 'Misc' if no event
                    const eventTitle = img.events?.title || 'Miscellaneous';
                    if (!groups[eventTitle]) {
                        groups[eventTitle] = [];
                    }
                    groups[eventTitle].push(img);
                });
                setGroupedImages(groups);
            }
        } catch (error) {
            console.error('Error fetching gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-16 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Gallery</h1>
                    <p className="text-xl text-gray-600">
                        Moments captured from our events
                    </p>
                </div>

                {/* Gallery Sections by Event */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : Object.keys(groupedImages).length === 0 ? (
                    <div className="text-center py-16">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl text-gray-600">No images in gallery yet</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {Object.entries(groupedImages).map(([eventName, images]) => (
                            <div key={eventName}>
                                <div className="flex items-center justify-center mb-8 relative">
                                    <h2 className="text-3xl font-bold text-gray-800 text-center relative z-10 px-6 bg-gray-50 uppercase tracking-wider">
                                        {eventName}
                                    </h2>
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide">
                                    <div className="flex gap-4" style={{ width: 'max-content' }}>
                                        {images.map((image) => (
                                            <div
                                                key={image.id}
                                                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
                                                onClick={() => setSelectedImage(image)}
                                                style={{ width: '300px', height: '220px', flexShrink: 0 }}
                                            >
                                                <img
                                                    src={image.image_url}
                                                    alt={image.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Lightbox */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="max-w-7xl max-h-[95vh] relative w-full flex justify-center">
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 md:top-0 md:-right-12 text-white/70 hover:text-white text-4xl font-light transition-colors z-50 p-2"
                            >
                                ×
                            </button>
                            <img
                                src={selectedImage.image_url}
                                alt={selectedImage.title}
                                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute bottom-0 translate-y-full pt-4 text-center">
                                <h3 className="text-lg font-bold text-white mb-1">{selectedImage.title}</h3>
                                {selectedImage.description && (
                                    <p className="text-gray-400 text-sm">{selectedImage.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

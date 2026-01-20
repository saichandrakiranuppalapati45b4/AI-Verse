import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Users, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const Home = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        fetchHomeContent();
        fetchUpcomingEvents();
    }, []);

    const fetchHomeContent = async () => {
        try {
            const { data } = await supabase
                .from('content_pages')
                .select('*')
                .eq('page_name', 'home')
                .single();

            if (data) setContent(data.content);
        } catch (error) {
            console.error('Error fetching home content:', error);
        }
    };

    const fetchUpcomingEvents = async () => {
        try {
            const { data } = await supabase
                .from('events')
                .select('*')
                .eq('is_published', true)
                .eq('status', 'upcoming')
                .order('start_date', { ascending: true })
                .limit(3);

            if (data) setUpcomingEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const defaultHighlights = [
        { icon: Trophy, value: '100+', label: 'Events Conducted' },
        { icon: Users, value: '500+', label: 'Active Members' },
        { icon: BookOpen, value: '50+', label: 'Workshops Hosted' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="gradient-bg text-white py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex justify-center mb-6">
                        <Sparkles className="w-16 h-16 animate-pulse-slow" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                        {content?.hero?.title || 'AI Verse'}
                    </h1>
                    <p className="text-xl md:text-2xl mb-4 text-blue-100">
                        {content?.hero?.subtitle || 'Department of CSE – Artificial Intelligence & Data Science'}
                    </p>
                    <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-50">
                        {content?.hero?.description || 'Empowering innovation through hackathons, seminars, workshops, and tech events'}
                    </p>
                    <Button
                        size="lg"
                        variant="accent"
                        onClick={() => navigate('/events')}
                        className="shadow-glow"
                    >
                        {content?.hero?.ctaText || 'Explore Events'}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>



            {/* Vision Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Our Vision</h2>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        {content?.vision || 'To create a vibrant community of AI enthusiasts and data scientists'}
                    </p>
                </div>
            </section>

            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Upcoming Events</h2>
                            <Button variant="outline" onClick={() => navigate('/events')}>
                                View All
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
                                <Card key={event.id} className="hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                                    {event.banner_url && (
                                        <img
                                            src={event.banner_url}
                                            alt={event.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <CardBody>
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(event.start_date).toLocaleDateString()}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">{event.title}</h3>
                                        <p className="text-gray-600 line-clamp-2">{event.description}</p>
                                        <div className="mt-4">
                                            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                                                {event.event_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-16 px-4 bg-primary-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Us Today!</h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Be part of the AI revolution. Participate in our events, learn from experts, and build innovative solutions.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="accent" onClick={() => navigate('/events')}>
                            Browse Events
                        </Button>
                        <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-gray-100" onClick={() => navigate('/contact')}>
                            Contact Us
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

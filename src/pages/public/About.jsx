import { useEffect, useState } from 'react';
import { Target, Eye, Award, Lightbulb } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const About = () => {
    const [content, setContent] = useState(null);

    useEffect(() => {
        fetchAboutContent();
    }, []);

    const fetchAboutContent = async () => {
        try {
            const { data } = await supabase
                .from('content_pages')
                .select('*')
                .eq('page_name', 'about')
                .single();

            if (data) setContent(data.content);
        } catch (error) {
            console.error('Error fetching about content:', error);
        }
    };

    const valueIcons = {
        Innovation: Lightbulb,
        Collaboration: Award,
        Excellence: Target,
        Integrity: Eye,
    };

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">About AI Verse</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {content?.description || 'AI Verse is the premier club of the Department of CSE - Artificial Intelligence & Data Science.'}
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <Card className="transform hover:scale-105 transition-transform">
                        <CardBody className="p-8">
                            <div className="flex items-center mb-4">
                                <Target className="w-10 h-10 text-primary-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                {content?.mission || 'To foster innovation, creativity, and technical excellence in the field of Artificial Intelligence and Data Science'}
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="transform hover:scale-105 transition-transform">
                        <CardBody className="p-8">
                            <div className="flex items-center mb-4">
                                <Eye className="w-10 h-10 text-accent-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                                {content?.vision || 'To be a leading hub for AI and Data Science education, research, and industry collaboration'}
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Values */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Our Core Values</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {(content?.values || ['Innovation', 'Collaboration', 'Excellence', 'Integrity']).map((value) => {
                            const Icon = valueIcons[value] || Award;
                            return (
                                <Card key={value} className="text-center transform hover:scale-105 transition-transform">
                                    <CardBody className="py-8">
                                        <Icon className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                                        <h3 className="text-lg font-bold text-gray-900">{value}</h3>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* What We Do */}
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">What We Do</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-4">1</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Hackathons</h3>
                                <p className="text-gray-700">Organize cutting-edge hackathons to challenge and inspire students to build innovative AI solutions</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold mr-4">2</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Workshops</h3>
                                <p className="text-gray-700">Conduct hands-on workshops to enhance technical skills in AI, ML, and Data Science</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-4">3</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Seminars</h3>
                                <p className="text-gray-700">Host insightful seminars with industry experts and researchers</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold mr-4">4</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">Tech Events</h3>
                                <p className="text-gray-700">Organize various tech events to keep students updated with the latest trends</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

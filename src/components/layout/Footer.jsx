import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, Instagram, Linkedin, Twitter, Github } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const Footer = () => {
    const [contactInfo, setContactInfo] = useState(null);

    useEffect(() => {
        fetchContactInfo();
    }, []);

    const fetchContactInfo = async () => {
        try {
            const { data } = await supabase
                .from('content_pages')
                .select('*')
                .eq('page_name', 'contact')
                .single();

            if (data) setContactInfo(data.content);
        } catch (error) {
            console.error('Error fetching contact info:', error);
        }
    };

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <Sparkles className="w-8 h-8 text-primary-400" />
                            <span className="text-2xl font-bold text-white">AI Verse</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Department of CSE – Artificial Intelligence & Data Science
                        </p>
                        <p className="text-gray-400">
                            Empowering innovation through hackathons, seminars, workshops, and tech events.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/about" className="hover:text-primary-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/events" className="hover:text-primary-400 transition-colors">
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link to="/team" className="hover:text-primary-400 transition-colors">
                                    Our Team
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start space-x-2">
                                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{contactInfo?.email || 'aiverse@college.edu'}</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{contactInfo?.phone || '+91 1234567890'}</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm whitespace-pre-line">
                                    {contactInfo?.address || 'Dept. of CSE - AI & DS\nCollege Campus'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Social Links & Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm mb-4 md:mb-0">
                            © {new Date().getFullYear()} AI Verse. All rights reserved.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-800 rounded-full hover:bg-primary-600 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export const ContentManagement = () => {
    const [pages, setPages] = useState({
        home: null,
        about: null,
        team: null,
        contact: null,
    });
    const [selectedPage, setSelectedPage] = useState('home');
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchAllPages();
    }, []);

    useEffect(() => {
        if (pages[selectedPage]) {
            setContent(JSON.stringify(pages[selectedPage].content, null, 2));
        }
    }, [selectedPage, pages]);

    const fetchAllPages = async () => {
        try {
            const { data } = await supabase
                .from('content_pages')
                .select('*');

            if (data) {
                const pagesObj = {};
                data.forEach(page => {
                    pagesObj[page.page_name] = page;
                });
                setPages(pagesObj);
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
        }
    };

    const handleSave = async () => {
        try {
            const parsedContent = JSON.parse(content);

            const { error } = await supabase
                .from('content_pages')
                .upsert({
                    page_name: selectedPage,
                    content: parsedContent,
                });

            if (error) throw error;
            toast.success('Content saved successfully');
            fetchAllPages();
        } catch (error) {
            if (error instanceof SyntaxError) {
                toast.error('Invalid JSON format');
            } else {
                console.error('Error saving content:', error);
                toast.error('Failed to save content');
            }
        }
    };

    const pageTemplates = {
        home: {
            hero: {
                title: "AI Verse",
                subtitle: "Department of CSE – Artificial Intelligence & Data Science",
                description: "Empowering innovation through hackathons, seminars, workshops, and tech events",
                ctaText: "Explore Events",
                ctaLink: "/events"
            },
            vision: "To create a vibrant community of AI enthusiasts and data scientists",
            highlights: [
                { icon: "trophy", value: "100+", label: "Events Conducted" },
                { icon: "users", value: "500+", label: "Active Members" },
                { icon: "book", value: "50+", label: "Workshops Hosted" }
            ]
        },
        about: {
            mission: "To foster innovation, creativity, and technical excellence in the field of Artificial Intelligence and Data Science",
            vision: "To be a leading hub for AI and Data Science education, research, and industry collaboration",
            description: "AI Verse is the premier club of the Department of CSE - Artificial Intelligence & Data Science.",
            values: ["Innovation", "Collaboration", "Excellence", "Integrity"]
        },
        team: {
            members: [
                {
                    name: "John Doe",
                    position: "President",
                    department: "AI & DS",
                    year: 4,
                    image: "/team/john.jpg",
                    linkedin: "https://linkedin.com",
                    github: "https://github.com"
                }
            ]
        },
        contact: {
            email: "aiverse@college.edu",
            phone: "+91 1234567890",
            address: "Department of CSE - AI & DS, College Campus",
            social: {
                instagram: "https://instagram.com/aiverse",
                linkedin: "https://linkedin.com/company/aiverse",
                twitter: "https://twitter.com/aiverse",
                github: "https://github.com/aiverse"
            }
        }
    };

    const loadTemplate = () => {
        setContent(JSON.stringify(pageTemplates[selectedPage], null, 2));
    };

    return (
        <AdminLayout>
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Content Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Page Selector */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <h3 className="font-bold">Pages</h3>
                            </CardHeader>
                            <CardBody className="p-0">
                                {Object.keys(pages).map((pageName) => (
                                    <button
                                        key={pageName}
                                        onClick={() => setSelectedPage(pageName)}
                                        className={`w-full text-left px-4 py-3 transition-colors capitalize ${selectedPage === pageName
                                                ? 'bg-primary-600 text-white'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageName}
                                    </button>
                                ))}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Content Editor */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold capitalize">{selectedPage} Page Content</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={loadTemplate}>
                                            Load Template
                                        </Button>
                                        <Button size="sm" onClick={handleSave}>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Content is stored as JSON. Edit carefully to maintain valid JSON format.
                                    </p>
                                </div>

                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={20}
                                    className="font-mono text-sm"
                                />

                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Preview:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                                        <pre className="text-xs text-gray-700">{content}</pre>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

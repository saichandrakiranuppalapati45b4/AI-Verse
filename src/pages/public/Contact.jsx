import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const Contact = () => {
    const [contactInfo, setContactInfo] = useState(null);
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

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

    const onSubmit = async (data) => {
        try {
            const { error } = await supabase
                .from('contact_requests')
                .insert([{
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    status: 'new'
                }]);

            if (error) throw error;

            toast.success('Message sent successfully! We\'ll get back to you soon.');
            reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to send message. Please try again.');
        }
    };

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Contact Us</h1>
                    <p className="text-xl text-gray-600">
                        Have questions? We'd love to hear from you!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Get in Touch</h2>

                        <div className="space-y-6 mb-8">
                            <Card>
                                <CardBody className="flex items-start space-x-4">
                                    <div className="p-3 bg-primary-100 rounded-lg">
                                        <Mail className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                        <a href={`mailto:${contactInfo?.email || 'aiverse@college.edu'}`} className="text-primary-600 hover:underline">
                                            {contactInfo?.email || 'aiverse@college.edu'}
                                        </a>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-start space-x-4">
                                    <div className="p-3 bg-accent-100 rounded-lg">
                                        <Phone className="w-6 h-6 text-accent-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                                        <a href={`tel:${contactInfo?.phone || '+911234567890'}`} className="text-primary-600 hover:underline">
                                            {contactInfo?.phone || '+91 1234567890'}
                                        </a>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody className="flex items-start space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <MapPin className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                                        <p className="text-gray-600">
                                            {contactInfo?.address || 'Department of CSE - AI & DS, College Campus'}
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Social Media */}
                        {contactInfo?.social && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                                <div className="flex space-x-4">
                                    {contactInfo.social.instagram && (
                                        <a
                                            href={contactInfo.social.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-gray-100 hover:bg-primary-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                        </a>
                                    )}
                                    {contactInfo.social.linkedin && (
                                        <a
                                            href={contactInfo.social.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-gray-100 hover:bg-primary-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Form */}
                    <div>
                        <Card>
                            <CardBody className="p-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Send us a Message</h2>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <Input
                                        label="Your Name"
                                        {...register('name', { required: 'Name is required' })}
                                        error={errors.name?.message}
                                    />
                                    <Input
                                        label="Your Email"
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address'
                                            }
                                        })}
                                        error={errors.email?.message}
                                    />
                                    <Input
                                        label="Subject"
                                        {...register('subject', { required: 'Subject is required' })}
                                        error={errors.subject?.message}
                                    />
                                    <Textarea
                                        label="Message"
                                        rows={6}
                                        {...register('message', { required: 'Message is required' })}
                                        error={errors.message?.message}
                                    />
                                    <Button type="submit" size="lg" className="w-full">
                                        <Send className="w-5 h-5 mr-2" />
                                        Send Message
                                    </Button>
                                </form>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

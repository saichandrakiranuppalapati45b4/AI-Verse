import { useEffect, useState } from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const Team = () => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const teamOrder = [
        "Communication team",
        "Design team",
        "PR team",
        "Technical team",
        "Videography team",
        "Photography team",
        "Editing team",
        "Logistics & Operation team",
        "Social media handling"
    ];

    // Group members by role (which serves as the Team Name)
    const groupedMembers = members.reduce((acc, member) => {
        const teamName = member.role || 'Other';
        if (!acc[teamName]) {
            acc[teamName] = [];
        }
        acc[teamName].push(member);
        return acc;
    }, {});

    // Get all unique teams from the database to ensure we don't miss any not in the hardcoded list
    const dbTeams = Object.keys(groupedMembers);

    // Combine ordered teams with any extra teams found in DB
    const displayTeams = [
        ...teamOrder.filter(team => dbTeams.includes(team)),
        ...dbTeams.filter(team => !teamOrder.includes(team))
    ];

    return (
        <div className="min-h-screen py-16 px-4 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Our Team</h1>
                    <p className="text-xl text-gray-600">
                        Meet the passionate individuals driving AI Verse
                    </p>
                </div>

                {/* Team Sections */}
                {members.length > 0 ? (
                    <div className="space-y-16">
                        {displayTeams.map((teamName) => (
                            <div key={teamName} className="relative">
                                <div className="flex items-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-800 border-l-4 border-primary-500 pl-4 capitalize">
                                        {teamName}
                                    </h2>
                                    <div className="h-px bg-gray-200 flex-grow ml-6"></div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                    {groupedMembers[teamName].map((member) => (
                                        <Card key={member.id} className="text-center bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 rounded-2xl overflow-hidden group">
                                            <CardBody className="p-8 flex flex-col items-center">
                                                {/* Avatar */}
                                                {member.image_url ? (
                                                    <div className="mb-6 relative">
                                                        <img
                                                            src={member.image_url}
                                                            alt={member.name}
                                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md relative z-10 group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 blur-xl opacity-30 transform scale-110 -z-0 group-hover:opacity-50 transition-opacity"></div>
                                                    </div>
                                                ) : (
                                                    <div className="mb-6 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                                        <span className="text-5xl font-bold text-white tracking-wider">
                                                            {member.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                                                <div className="mb-4">
                                                    {member.position && <p className="text-primary-600 font-bold tracking-wide text-sm uppercase">{member.position}</p>}
                                                </div>

                                                {/* Social Links */}
                                                <div className="flex justify-center space-x-4 mt-auto pt-4 border-t border-gray-100 w-full">
                                                    {/* LinkedIn */}
                                                    {member.linkedin_url ? (
                                                        <a
                                                            href={member.linkedin_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110"
                                                        >
                                                            <Linkedin className="w-5 h-5" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-200 cursor-not-allowed">
                                                            <Linkedin className="w-5 h-5" />
                                                        </span>
                                                    )}

                                                    {/* GitHub */}
                                                    {member.github_url ? (
                                                        <a
                                                            href={member.github_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-400 hover:text-gray-900 transition-colors transform hover:scale-110"
                                                        >
                                                            <Github className="w-5 h-5" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-200 cursor-not-allowed">
                                                            <Github className="w-5 h-5" />
                                                        </span>
                                                    )}

                                                    {/* Email */}
                                                    {member.email ? (
                                                        <a
                                                            href={`mailto:${member.email}`}
                                                            className="text-gray-400 hover:text-red-500 transition-colors transform hover:scale-110"
                                                        >
                                                            <Mail className="w-5 h-5" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-200 cursor-not-allowed">
                                                            <Mail className="w-5 h-5" />
                                                        </span>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-600">Team information will be available soon</p>
                    </div>
                )}

                {/* Join Team CTA */}
                <div className="mt-24 text-center bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            We're always looking for passionate individuals to join AI Verse. Be part of the innovation.
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-3 bg-white text-primary-600 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:bg-gray-50 hover:scale-105"
                        >
                            Get in Touch
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

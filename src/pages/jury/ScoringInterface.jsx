import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export const ScoringInterface = () => {
    const { eventId, registrationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [registration, setRegistration] = useState(null);
    const [event, setEvent] = useState(null);
    const [existingScore, setExistingScore] = useState(null);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            innovation_score: 0,
            technical_score: 0,
            presentation_score: 0,
            impact_score: 0,
            feedback: '',
        }
    });

    const scores = watch(['innovation_score', 'technical_score', 'presentation_score', 'impact_score']);
    const totalScore = scores.reduce((sum, score) => sum + (parseInt(score) || 0), 0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch registration
            const { data: regData } = await supabase
                .from('registrations')
                .select('*')
                .eq('id', registrationId)
                .single();

            if (regData) setRegistration(regData);

            // Fetch event
            const { data: eventData } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (eventData) setEvent(eventData);

            // Fetch existing score
            const { data: scoreData } = await supabase
                .from('scores')
                .select('*')
                .eq('registration_id', registrationId)
                .eq('jury_id', user.id)
                .single();

            if (scoreData) {
                setExistingScore(scoreData);
                setValue('innovation_score', scoreData.innovation_score);
                setValue('technical_score', scoreData.technical_score);
                setValue('presentation_score', scoreData.presentation_score);
                setValue('impact_score', scoreData.impact_score);
                setValue('feedback', scoreData.feedback || '');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const onSubmit = async (data) => {
        try {
            const scoreData = {
                registration_id: registrationId,
                jury_id: user.id,
                event_id: eventId,
                innovation_score: parseInt(data.innovation_score),
                technical_score: parseInt(data.technical_score),
                presentation_score: parseInt(data.presentation_score),
                impact_score: parseInt(data.impact_score),
                feedback: data.feedback,
            };

            const { error } = await supabase
                .from('scores')
                .upsert(scoreData);

            if (error) throw error;

            toast.success('Score submitted successfully!');
            navigate(`/jury/event/${eventId}`);
        } catch (error) {
            console.error('Error submitting score:', error);
            toast.error('Failed to submit score');
        }
    };

    if (!registration || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const ScoreSlider = ({ name, label, description, maxScore }) => {
        const value = watch(name);
        return (
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <span className="text-2xl font-bold text-primary-600">{value || 0}/{maxScore}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{description}</p>
                <input
                    type="range"
                    min="0"
                    max={maxScore}
                    {...register(name, {
                        required: 'Score is required',
                        min: 0,
                        max: {
                            value: maxScore,
                            message: `Max score is ${maxScore}`
                        }
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{Math.round(maxScore / 2)}</span>
                    <span>{maxScore}</span>
                </div>
                {errors[name] && (
                    <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>
                )}
            </div>
        );
    };

    const maxInnovation = event?.max_score_innovation || 10;
    const maxTechnical = event?.max_score_feasibility || 10; // Mapping Feasibility to Technical as per previous naming usage
    const maxPresentation = event?.max_score_statistics || 10; // Mapping Statistics to Presentation
    const maxImpact = event?.max_score_revenue || 10; // Mapping Revenue to Impact

    // Calculate total max score
    const totalMaxScore = maxInnovation + maxTechnical + maxPresentation + maxImpact;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(`/jury/event/${eventId}`)} className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Participants
                </Button>

                {/* Participant Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <h1 className="text-2xl font-bold">
                            {registration.is_team_registration
                                ? registration.team_name
                                : registration.team_leader_name}
                        </h1>
                        <p className="text-gray-600">{event.title}</p>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">
                                    <strong>Leader:</strong> {registration.team_leader_name}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Email:</strong> {registration.team_leader_email}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Phone:</strong> {registration.team_leader_phone}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">
                                    <strong>College:</strong> {registration.college || 'N/A'}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Department:</strong> {registration.department || 'N/A'}
                                </p>
                                {registration.is_team_registration && (
                                    <p className="text-gray-600">
                                        <strong>Team Size:</strong> {(registration.team_members?.length || 0) + 1} members
                                    </p>
                                )}
                            </div>
                        </div>

                        {registration.is_team_registration && registration.team_members && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="font-semibold text-sm mb-2">Team Members:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {registration.team_members.map((member, idx) => (
                                        <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                            <p><strong>{member.name}</strong></p>
                                            <p className="text-gray-600">{member.email}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Scoring Form */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Evaluation Scores</h2>
                        <p className="text-gray-600">Rate each criterion based on event limits</p>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <ScoreSlider
                                name="innovation_score"
                                label="Innovation"
                                description="Uniqueness and creativity of the solution"
                                maxScore={maxInnovation}
                            />

                            <ScoreSlider
                                name="technical_score"
                                label="Feasibility (Technical)"
                                description="Technical implementation and feasibility"
                                maxScore={maxTechnical}
                            />

                            <ScoreSlider
                                name="presentation_score"
                                label="Statistics (Presentation)"
                                description="Data presentation and statistics"
                                maxScore={maxPresentation}
                            />

                            <ScoreSlider
                                name="impact_score"
                                label="Revenue (Impact)"
                                description="Business model and revenue potential"
                                maxScore={maxImpact}
                            />

                            {/* Total Score Display */}
                            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 text-center">
                                <p className="text-sm text-gray-600 mb-2">Total Score</p>
                                <p className="text-5xl font-bold text-primary-600">{totalScore}/{totalMaxScore}</p>
                            </div>

                            {/* Feedback */}
                            <Textarea
                                label="Feedback & Comments"
                                rows={6}
                                {...register('feedback')}
                                placeholder="Provide constructive feedback and comments..."
                            />

                            {existingScore && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        You previously scored this participant. Submitting again will update your score.
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/jury/event/${eventId}`)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="lg">
                                    <Save className="w-5 h-5 mr-2" />
                                    Submit Score
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

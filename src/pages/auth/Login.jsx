import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            console.log('Attempting login...');
            const { data: authData, error } = await signIn(data.email, data.password);
            console.log('Login response:', { authData, error });

            if (authData?.user) {
                console.log('User found, navigating...');
                toast.success('Login successful!');
                navigate('/dashboard');
            } else {
                console.log('No user returned from signIn');
            }
        } catch (error) {
            console.error('Login error caught:', error);
            toast.error(error.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Sparkles className="w-16 h-16 text-white animate-pulse-slow" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">AI Verse</h1>
                    <p className="text-blue-100">Admin & Jury Portal</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-2xl">
                    <CardHeader>
                        <h2 className="text-2xl font-bold text-center flex items-center justify-center">
                            <LogIn className="w-6 h-6 mr-2" />
                            Sign In
                        </h2>
                    </CardHeader>
                    <CardBody className="p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input
                                label="Email"
                                type="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                                error={errors.email?.message}
                                autoComplete="email"
                            />
                            <Input
                                label="Password"
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                error={errors.password?.message}
                                autoComplete="current-password"
                            />
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                ← Back to Home
                            </button>
                        </div>
                    </CardBody>
                </Card>

                {/* Info */}
                <div className="mt-6 text-center text-white text-sm">
                    <p className="mb-2">For Admin and Jury members only</p>
                    <p className="text-blue-200">Contact the administrator for access</p>
                </div>
            </div>
        </div>
    );
};

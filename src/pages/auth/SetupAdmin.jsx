import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export const SetupAdmin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: 'Admin User',
                    }
                }
            });

            if (error) throw error;

            toast.success('User created! Now go to Supabase Dashboard to make them admin.');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h1 className="text-2xl font-bold">Admin Setup</h1>
                    <p className="text-sm text-gray-500">Create the initial user</p>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <Input
                            label="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                    </form>
                    <div className="mt-4 p-4 bg-yellow-50 text-sm text-yellow-800 rounded">
                        <p className="font-bold">Next Step:</p>
                        <p>After creating the user, run this SQL in Supabase Dashboard:</p>
                        <pre className="mt-2 bg-black text-white p-2 rounded overflow-x-auto">
                            UPDATE public.users{'\n'}
                            SET role = 'admin'{'\n'}
                            WHERE email = '{email || 'email@example.com'}';
                        </pre>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

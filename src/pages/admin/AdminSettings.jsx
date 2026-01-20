import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Upload, User, Lock, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const AdminSettings = () => {
    const { userProfile, refreshProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            full_name: userProfile?.full_name || '',
            email: userProfile?.email || '',
        }
    });

    // Watch for image preview
    const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);

    useEffect(() => {
        if (userProfile) {
            setValue('full_name', userProfile.full_name);
            setValue('email', userProfile.email);
            setAvatarUrl(userProfile.avatar_url);
        }
    }, [userProfile, setValue]);

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Create avatars bucket if it doesn't exist (handled by SQL usually, but let's try upload)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) {
                // formatting error for better debugging
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            toast.success('Photo uploaded! Click "Save Changes" to apply.');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error uploading image. Ensure "avatars" bucket exists.');
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const updates = {
                full_name: data.full_name,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            // 1. Update public.users table
            const { error: dbError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userProfile.id);

            if (dbError) throw dbError;

            // 2. Update auth.users metadata (optional but good for sync)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: data.full_name, avatar_url: avatarUrl }
            });

            if (authError) throw authError;

            // 3. Update password if provided
            if (data.new_password) {
                if (data.new_password !== data.confirm_password) {
                    throw new Error("Passwords do not match");
                }
                const { error: pwdError } = await supabase.auth.updateUser({
                    password: data.new_password
                });
                if (pwdError) throw pwdError;
                toast.success('Password updated successfully');
            }

            toast.success('Profile updated successfully');
            if (refreshProfile) refreshProfile();

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile details and security</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Profile Details</h2>
                            </div>
                        </CardHeader>
                        <CardBody className="p-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Auto-Layout: Photo + Inputs */}
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Photo Section */}
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="relative group">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Profile"
                                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                                                    {userProfile?.full_name?.charAt(0) || 'A'}
                                                </div>
                                            )}
                                            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
                                                {uploading ? (
                                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Camera className="w-5 h-5 text-gray-600" />
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Allowed: JPG, PNG. Max 2MB</p>
                                    </div>

                                    {/* Inputs Section */}
                                    <div className="flex-1 w-full space-y-4">
                                        <Input
                                            label="Full Name"
                                            {...register('full_name', { required: 'Name is required' })}
                                            error={errors.full_name?.message}
                                            icon={<User className="w-4 h-4" />}
                                        />
                                        <Input
                                            label="Email Address"
                                            {...register('email')}
                                            disabled
                                            className="bg-gray-50 text-gray-500"
                                            helperText="Email cannot be changed"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lock className="w-5 h-5 text-gray-500" />
                                        <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            type="password"
                                            label="New Password"
                                            {...register('new_password', {
                                                minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                            })}
                                            error={errors.new_password?.message}
                                            placeholder="Leave blank to keep current"
                                        />
                                        <Input
                                            type="password"
                                            label="Confirm New Password"
                                            {...register('confirm_password', {
                                                validate: (val) => {
                                                    if (watch('new_password') && val !== watch('new_password')) {
                                                        return "Passwords do not match";
                                                    }
                                                }
                                            })}
                                            error={errors.confirm_password?.message}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={loading || uploading} size="lg">
                                        {loading ? 'Saving Changes...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

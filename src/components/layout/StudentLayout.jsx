import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LogOut, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const StudentLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navItems = [
        { to: '/student/dashboard', icon: ClipboardList, label: 'Registrations' },
        { to: '/student/qr-checkin', icon: QrCode, label: 'QR Check-in' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full z-10">
                {/* Logo Area */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center space-y-3">
                    <img
                        src="/assets/ai_verse.png"
                        alt="AI Verse Logo"
                        className="w-16 h-16 object-contain drop-shadow-sm"
                    />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide">
                        AI Verse
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {userProfile?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {userProfile?.full_name || 'Coordinator'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Student Coordinator
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center text-red-500 hover:text-red-700 text-sm font-medium transition-colors w-full px-2"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <main className="flex-1 ml-64 p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

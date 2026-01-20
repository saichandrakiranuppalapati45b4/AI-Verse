import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, userProfile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // ... (keep handleSignOut)

    const handleSignOut = async () => {
        console.log('Sign out clicked');
        try {
            await signOut();
            console.log('Sign out successful, navigating to home');
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navLinks = [
        // ...
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' },
        { to: '/events', label: 'Events' },
        { to: '/live-events', label: 'Live Events' },
        { to: '/team', label: 'Team' },
        { to: '/gallery', label: 'Gallery' },
        { to: '/contact', label: 'Contact' },
    ];

    return (
        <>
            <nav className="bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <img
                                src="/assets/ai_verse.png"
                                alt="AI Verse Logo"
                                className="h-12 w-12 object-contain mr-3"
                            />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                AI Verse
                            </span>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center lg:hidden gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {!isMobileMenuOpen ? (
                                    <Menu className="block h-6 w-6" />
                                ) : (
                                    <X className="block h-6 w-6" />
                                )}
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-sm font-medium transition-colors ${location.pathname === link.to
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden lg:flex items-center space-x-3">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {user ? (
                                <>
                                    {/* Dashboard Button for ALL logged in users */}
                                    <Button
                                        className="bg-primary-600 hover:bg-primary-700 text-white"
                                        size="sm"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Dashboard
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSignOut}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" onClick={() => navigate('/login')} className="bg-primary-600 hover:bg-primary-700">
                                    Login
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-200">
                        <div className="px-4 py-4 space-y-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-gray-200">
                                {user ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mb-2"
                                            onClick={() => {
                                                navigate('/dashboard');
                                                setIsMobileMenuOpen(false);
                                            }}
                                        >
                                            Dashboard
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            navigate('/login');
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Login
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            {/* Gradient Strip */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        </>
    );
};

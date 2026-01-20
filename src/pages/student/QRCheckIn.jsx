// Force deploy fix
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, AlertCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const QRCheckIn = () => {
    const [scanResult, setScanResult] = useState(null);
    const [registrationData, setRegistrationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Auto-start scanner on mount
        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        if (scannerRef.current) return;

        try {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            setIsScanning(true);
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText, decodedResult) => {
                    // Success callback
                    console.log(`Code matched = ${decodedText}`, decodedResult);

                    let finalId = decodedText;
                    try {
                        // Check if it's a JSON string and extract ID
                        const parsed = JSON.parse(decodedText);
                        if (parsed && parsed.id) {
                            finalId = parsed.id;
                            console.log("Extracted ID from JSON:", finalId);
                        }
                    } catch (e) {
                        // Not a JSON string, assume it's the ID directly
                    }

                    if (finalId.length > 20) {
                        setScanResult(decodedText); // Show original text/JSON for verifying
                        fetchRegistration(finalId);
                        stopScanner();
                    }
                },
                (errorMessage) => {
                    // Error callback (ignore for scanning noise)
                }
            );
        } catch (err) {
            console.error("Error starting scanner:", err);
            setIsScanning(false);
            // toast.error("Could not start camera. Please ensure permissions are granted.");
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
    };

    const fetchRegistration = async (registrationId) => {
        setLoading(true);
        setError(null);
        setRegistrationData(null);

        try {
            const { data, error } = await supabase
                .from('registrations')
                .select(`
                    *,
                    events (title)
                `)
                .eq('id', registrationId)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Registration not found");

            setRegistrationData(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to fetch participant details");
            toast.error("Invalid QR Code or Participant Not Found");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!registrationData) return;

        try {
            const { error: regError } = await supabase
                .from('registrations')
                .update({ checked_in: true })
                .eq('id', registrationData.id);

            if (regError) throw regError;

            const { error: logError } = await supabase
                .from('attendance_logs')
                .insert({
                    registration_id: registrationData.id,
                    event_id: registrationData.event_id,
                    check_in_date: new Date().toISOString().split('T')[0],
                    session: new Date().getHours() < 12 ? 'Morning' : 'Afternoon'
                });

            if (logError && logError.code !== '23505') throw logError;

            toast.success("Check-in Confirmed Successfully!");

            // Reset and restart scanner
            setTimeout(() => {
                setScanResult(null);
                setRegistrationData(null);
                startScanner();
            }, 1000);

        } catch (err) {
            console.error(err);
            toast.error("Check-in Failed: " + err.message);
        }
    };

    const handleManualRetry = () => {
        setScanResult(null);
        setRegistrationData(null);
        setError(null);
        startScanner();
    };

    return (
        <StudentLayout>
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">QR Code Check-in</h2>

                <Card className="mb-6 overflow-hidden">
                    <CardBody className="p-0">
                        {!scanResult ? (
                            <div className="relative bg-black min-h-[300px] flex flex-col items-center justify-center">
                                <div id="reader" className="w-full h-full absolute inset-0"></div>
                                {!isScanning && (
                                    <div className="z-10 text-white text-center">
                                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm opacity-75">Starting Camera...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-green-50">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900">Code Scanned</h3>
                                <p className="text-gray-500 text-xs font-mono mt-1 mb-4">{scanResult}</p>
                                <Button size="sm" variant="outline" onClick={handleManualRetry}>
                                    Scan Again
                                </Button>
                            </div>
                        )}
                        {!scanResult && (
                            <div className="p-4 bg-white text-center text-sm text-gray-500 border-t">
                                Point camera at participant ticket
                            </div>
                        )}
                    </CardBody>
                </Card>

                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Checking ticket...</p>
                    </div>
                )}

                {error && (
                    <Card className="border-red-200 bg-red-50 mb-6">
                        <CardBody className="flex items-center gap-4 text-red-700">
                            <XCircle className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Error</h4>
                                <p>{error}</p>
                                <Button size="sm" onClick={handleManualRetry} className="mt-2 bg-red-600 hover:bg-red-700 text-white border-none">
                                    Try Again
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {registrationData && (
                    <Card className="border-green-200 bg-green-50">
                        <CardBody>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {registrationData.is_team_registration
                                            ? registrationData.team_name
                                            : registrationData.team_leader_name}
                                    </h3>
                                    <p className="text-green-700 font-medium">{registrationData.events?.title}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${registrationData.registration_status === 'approved' ? 'bg-green-200 text-green-800' :
                                    registrationData.registration_status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-red-200 text-red-800'
                                    }`}>
                                    {registrationData.registration_status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                                <div>
                                    <p className="text-gray-600 font-semibold mb-1">Leader Name</p>
                                    <p className="font-bold text-gray-900">{registrationData.team_leader_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 font-semibold mb-1">Email</p>
                                    <p className="font-bold text-gray-900 break-all">{registrationData.team_leader_email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 font-semibold mb-1">College</p>
                                    <p className="font-bold text-gray-900">{registrationData.college || 'N/A'}</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmCheckIn}
                                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg"
                                disabled={registrationData.registration_status !== 'approved'}
                            >
                                Confirm Check-In
                            </Button>
                        </CardBody>
                    </Card>
                )}
            </div>
        </StudentLayout>
    );
};

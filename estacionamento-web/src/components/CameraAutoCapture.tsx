import React, { useRef, useState, useEffect } from 'react';
import { useWebcamCapture } from '@/hooks/useWebcamCapture';
import { Camera, X, RefreshCw, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CameraAutoCaptureProps {
    onCapture: (file: File | null) => void;
    children: React.ReactNode;
    fallbackInputName?: string;
    accept?: string;
    capture?: string;
}

export function CameraAutoCapture({ onCapture, children, fallbackInputName, accept = "image/*", capture = "environment" }: CameraAutoCaptureProps) {
    const { videoRef, stream, error, isCapturing, startCamera, stopCamera, capturePhoto } = useWebcamCapture();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Clean up preview URL when it changes
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Clean up camera only when unmounting
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleTriggerClick = async () => {
        // Try to open camera first
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia) {
            await startCamera();
            // If starting the camera triggers an error immediately, fall back
            if (!stream && error) {
                fileInputRef.current?.click();
            }
        } else {
            // Fallback to normal input if no mediaDevices
            fileInputRef.current?.click();
        }
    };

    // If starting camera failed later, fall back
    useEffect(() => {
        if (isCapturing && error && !stream) {
            stopCamera();
            fileInputRef.current?.click();
        }
    }, [error, isCapturing, stream, stopCamera]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            onCapture(file);
        } else {
            onCapture(null);
        }
    };

    const handleTakePic = async () => {
        const file = await capturePhoto();
        stopCamera();
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onCapture(file);
        }
    };

    const handleRetake = async () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        onCapture(null);
        await startCamera();
    };

    const handleCancel = () => {
        stopCamera();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        onCapture(null);
    };

    return (
        <>
            <div onClick={handleTriggerClick} className="cursor-pointer w-full">
                {children}
            </div>

            {/* Fallback Input hidden */}
            <input
                type="file"
                accept={accept}
                capture={capture as any}
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                name={fallbackInputName}
            />

            {/* Fullscreen Camera Modal */}
            {isCapturing && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-black">
                    <div className="flex-1 w-full h-full relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-contain"
                        />

                        {/* Close Button */}
                        <button
                            onClick={handleCancel}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
                        >
                            <X size={24} />
                        </button>

                        {/* Capture Controls */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-10 px-4">
                            <Button
                                variant="outline"
                                className="bg-black/50 border-white text-white hover:bg-black/80 rounded-full w-16 h-16 flex-shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                title="Selecionar da Galeria"
                            >
                                <Image size={24} />
                            </Button>

                            <button
                                onClick={handleTakePic}
                                className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform"
                                title="Capturar Foto"
                            >
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                            </button>

                            <div className="w-16 h-16" /> {/* Spacer to balance gallery button */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

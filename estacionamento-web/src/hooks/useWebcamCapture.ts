import { useState, useRef, useCallback, useEffect } from 'react';

export function useWebcamCapture() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const startCamera = useCallback(async () => {
        setIsCapturing(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play().catch((e) => console.warn("Autoplay prevented:", e));
            }
        } catch (err: any) {
            setError(err.message || 'Não foi possível acessar a câmera');
            setIsCapturing(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCapturing(false);
    }, []);

    const capturePhoto = useCallback((): Promise<File | null> => {
        return new Promise((resolve) => {
            if (!videoRef.current || !streamRef.current) {
                resolve(null);
                return;
            }

            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    resolve(file);
                } else {
                    resolve(null);
                }
            }, 'image/jpeg', 0.8);
        });
    }, []);

    // Ensure video stream is attached when the video element mounts
    useEffect(() => {
        if (isCapturing && videoRef.current && streamRef.current) {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.play().catch((e) => console.warn("Autoplay prevented:", e));
            }
        }
    }, [isCapturing, stream]); // react re-renders when `stream` or `isCapturing` changes, attaching the effect

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        videoRef,
        stream,
        error,
        isCapturing,
        startCamera,
        stopCamera,
        capturePhoto
    };
}

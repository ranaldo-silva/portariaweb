import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

// VAPID key from environment variable
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const useFcmToken = () => {
    const [token, setToken] = useState('');
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('');

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    // Register the service worker specially for Firebase if not already
                    // Note: Next.js PWA plugin might already register one. 
                    // We need to ensure firebase-messaging-sw.js is the one being used or imported.
                    // For Simplicity, we rely on the default registration or explicit registration here.

                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        if (!messaging) return; // Firebase might not be initialized

                        const currentToken = await getToken(messaging, {
                            vapidKey: VAPID_KEY,
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            // Save token to Supabase for the current user
                            const sessionId = localStorage.getItem("morador_session_id");
                            if (sessionId) {
                                await supabase
                                    .from('moradores')
                                    .update({ fcm_token: currentToken })
                                    .eq('id', sessionId);
                            }
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    }
                }
            } catch (error) {
                console.log('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, []);

    return { fcmToken: token, notificationPermissionStatus };
};

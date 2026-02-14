import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
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
                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        if (!messaging) {
                            console.error("Firebase messaging not initialized.");
                            return;
                        }

                        const currentToken = await getToken(messaging, {
                            vapidKey: VAPID_KEY,
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            console.log("FCM Token retrieved:", currentToken); // Debug Log

                            // Save token to Supabase for the current user using RPC to bypass RLS
                            const sessionId = localStorage.getItem("morador_session_id");
                            console.log("Session ID content:", sessionId); // Debug Log

                            if (sessionId) {
                                // Use new RPC for multi-device support
                                const { error } = await supabase.rpc('save_notification_token', {
                                    p_user_id: parseInt(sessionId),
                                    p_token: currentToken
                                });

                                if (error) {
                                    console.error("Error saving FCM token via RPC:", error);
                                } else {
                                    console.log("FCM token saved via RPC (Multi-Device) successfully.");
                                }
                            } else {
                                console.warn("No session ID found in localStorage. Token not saved.");
                            }
                        } else {
                            console.log('No registration token available.');
                        }
                    }
                }
            } catch (error) {
                console.log('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, []);

    // Listen for foreground messages
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground Message received:', payload);
                const { title, body } = payload.notification || {};

                // Show a simple browser alert or custom toast
                // Using alert for immediate visibility in testing, can swap for toast later
                if (title) {
                    // Start vibrate pattern for mobile
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                    // Option: Create a visible HTML element or use alert
                    // alert(`🔔 ${title}\n${body}`); 

                    // Better Option: Browser Notification API even if in foreground (if supported)
                    new Notification(title, { body, icon: '/vercel.svg' });
                }
            });
            return () => unsubscribe();
        }
    }, []);

    return { fcmToken: token, notificationPermissionStatus };
};

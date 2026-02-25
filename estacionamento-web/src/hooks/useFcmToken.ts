import { useEffect, useState } from 'react';
import { getToken, onMessage, isSupported, getMessaging } from 'firebase/messaging';
import { app } from '@/lib/firebase';
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
                        const supported = await isSupported();
                        if (!supported) {
                            console.warn("O navegador não suporta Firebase Messaging.");
                            return;
                        }

                        const messaging = getMessaging(app);

                        const currentToken = await getToken(messaging, {
                            vapidKey: VAPID_KEY,
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            console.log("FCM Token retrieved:", currentToken); // Debug Log

                            // Save token to Supabase based on Role
                            const sessionId = localStorage.getItem("morador_session_id");
                            const role = localStorage.getItem("userRole"); // 'admin' or 'porteiro' or null (morador default)

                            console.log(`Saving Token. Role: ${role}, Session: ${sessionId}`);

                            if (role === 'admin') {
                                // For admins, we use the email stored in a different key or assume standard logic
                                // Since we don't have 'admin_session_id', we might need to store admin email on login
                                // Let's check if we have it. If not, we can't save personalized token yet.
                                // NOTE: Client must ensure 'admin_email' is saved on login.
                                const adminEmail = localStorage.getItem("admin_email");

                                if (adminEmail) {
                                    const { error } = await supabase.rpc('save_admin_token', {
                                        p_email: adminEmail,
                                        p_token: currentToken
                                    });
                                    if (error) console.error("Error saving Admin token:", error);
                                    else console.log("Admin token saved successfully.");
                                } else {
                                    console.warn("No admin email found in localStorage. Admin token not saved.");
                                }
                            } else if (sessionId) {
                                // Resident Logic (Existing)
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
                                console.warn("No session ID or admin email found in localStorage. Token not saved.");
                            }
                        } else {
                            // No registration token
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, []);

    // Listen for foreground messages
    useEffect(() => {
        let unsubscribe: any = null;
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            isSupported().then((supported) => {
                if (supported) {
                    const messaging = getMessaging(app);
                    unsubscribe = onMessage(messaging, (payload) => {
                        console.log('Foreground Message received:', payload);
                        const { title, body } = payload.notification || {};

                        if (title) {
                            // Start vibrate pattern for mobile
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                            // Better Option: Browser Notification API even if in foreground (if supported)
                            new Notification(title, { body, icon: '/vercel.svg' });
                        }
                    });
                }
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return { fcmToken: token, notificationPermissionStatus };
};

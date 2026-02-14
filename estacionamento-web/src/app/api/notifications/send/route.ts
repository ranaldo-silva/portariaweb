import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId, title, body, data } = await req.json();

        if (!userId && !title) {
            return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
        }

        // 1. Get user's FCM token from Supabase
        const { data: user, error } = await supabase
            .from('moradores')
            .select('fcm_token')
            .eq('id', userId)
            .single();

        if (error || !user || !user.fcm_token) {
            console.log(`User ${userId} has no FCM token`);
            return NextResponse.json({ message: 'User has no token' }, { status: 200 });
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            token: user.fcm_token,
        };

        // 2. Send via Firebase Admin
        const response = await firebaseAdmin.messaging().send(message);

        return NextResponse.json({ success: true, messageId: response });
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

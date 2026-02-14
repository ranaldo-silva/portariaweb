import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId, title, body, data } = await req.json();

        if (!userId && !title) {
            return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
        }

        // 1. Get user's FCM token from Supabase (Try RPC first to bypass RLS)
        let tokenToUse = null;

        const { data: rpcToken, error: rpcError } = await supabase
            .rpc('get_fcm_token', { p_user_id: userId });

        if (!rpcError && rpcToken) {
            tokenToUse = rpcToken;
        } else {
            // Fallback to direct select
            const { data: user, error } = await supabase
                .from('moradores')
                .select('fcm_token')
                .eq('id', userId)
                .single();

            if (user && user.fcm_token) {
                tokenToUse = user.fcm_token;
            }
        }

        if (!tokenToUse) {
            console.log(`User ${userId} has no FCM token (RPC/Direct failed)`);
            return NextResponse.json({ message: 'User has no token' }, { status: 200 });
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            token: tokenToUse,
        };

        // 2. Send via Firebase Admin
        console.log(`Sending notification to token: ${tokenToUse.substring(0, 10)}...`);
        const response = await firebaseAdmin.messaging().send(message);
        console.log("Notification sent successfully. Message ID:", response);

        return NextResponse.json({ success: true, messageId: response });
    } catch (error: any) {
        console.error('Error sending notification (Server):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

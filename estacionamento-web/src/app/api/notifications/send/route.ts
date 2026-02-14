import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId, title, body, data } = await req.json();

        if (!userId && !title) {
            return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 });
        }

        // 1. Get all user's FCM tokens from Supabase (Multi-device support)
        let tokens: string[] = [];

        // Try getting from new table first
        const { data: userTokens, error: rpcError } = await supabase
            .rpc('get_user_tokens', { p_user_id: userId });

        if (!rpcError && userTokens && userTokens.length > 0) {
            tokens = userTokens.map((t: any) => t.token);
        } else {
            // Fallback to legacy single token column
            const { data: user, error } = await supabase
                .from('moradores')
                .select('fcm_token')
                .eq('id', userId)
                .single();

            if (user && user.fcm_token) {
                tokens = [user.fcm_token];
            }
        }

        if (tokens.length === 0) {
            console.log(`User ${userId} has no FCM tokens`);
            return NextResponse.json({ message: 'User has no tokens' }, { status: 200 });
        }

        console.log(`Sending notification to ${tokens.length} devices for User ${userId}`);

        // 2. Send via Firebase Admin (Multicast)
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens: tokens, // Use 'tokens' array for multicast
        };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
        console.log(`Notifications sent/failed: ${response.successCount}/${response.failureCount}`);

        // Optional: Cleanup invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log("Failed tokens to potentially remove:", failedTokens);
            // TODO: Remove failed tokens from DB using an RPC
        }

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        });
    } catch (error: any) {
        console.error('Error sending notification (Server):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

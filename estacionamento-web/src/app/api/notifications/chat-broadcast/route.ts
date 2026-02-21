import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        // 1. Get all Admin Tokens
        const { data: adminTokens, error } = await supabase.rpc('get_all_admin_tokens');

        if (error || !adminTokens || adminTokens.length === 0) {
            return NextResponse.json({ message: 'No admins to notify' });
        }

        const tokens = adminTokens.map((t: any) => t.token);

        // 2. Send Multicast
        const payload = {
            notification: {
                title: 'Nova Mensagem da Portaria',
                body: message,
            },
            tokens: tokens
        };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(payload);

        return NextResponse.json({ success: true, count: response.successCount });
    } catch (error: any) {
        console.error("Error broadcasting chat:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

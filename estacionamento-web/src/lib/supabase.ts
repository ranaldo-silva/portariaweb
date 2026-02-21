import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bzfzklnzqckolvhomuta.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_z87dqo6PQj5hzlbark_s0A_3v7kHE7j';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

// Configuration from existing app
const supabaseUrl = 'https://bzfzklnzqckolvhomuta.supabase.co';
const supabaseKey = 'sb_publishable_z87dqo6PQj5hzlbark_s0A_3v7kHE7j';

export const supabase = createClient(supabaseUrl, supabaseKey);

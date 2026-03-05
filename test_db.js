require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
    console.log('Testing Profiles table query...');
    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

    console.log('Profiles Error:', profErr);
    console.log('Profiles returned:', profiles?.length);
    if (profiles?.length > 0) {
        console.log('First profile:', profiles[0].display_name);
    }
}

testQuery();

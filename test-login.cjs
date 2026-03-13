const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- Testing Admin Login ---');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'basith@adscroll360.com')
        .eq('password', 'AAAAAAAAAA@123456789')
        .single();

    if (error) {
        console.error('LOGIN ERROR:', error.message);
    } else {
        console.log('LOGIN SUCCESS! Admin found:', data.name);
    }
}

test();

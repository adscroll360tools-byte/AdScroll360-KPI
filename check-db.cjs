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

console.log('Testing connection to:', supabaseUrl);
if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Probing "users" table ---');
    const { data: users, error: uError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (uError) {
        console.error('ERROR (users):', uError.message);
    } else {
        console.log('SUCCESS: "users" table found.');
    }

    console.log('--- Probing "tasks" table ---');
    const { data: tasks, error: tError } = await supabase.from('tasks').select('count', { count: 'exact', head: true });
    if (tError) {
        console.error('ERROR (tasks):', tError.message);
    } else {
        console.log('SUCCESS: "tasks" table found.');
    }

    console.log('--- Probing "attendance" table ---');
    const { data: att, error: aError } = await supabase.from('attendance').select('count', { count: 'exact', head: true });
    if (aError) {
        console.error('ERROR (attendance):', aError.message);
    } else {
        console.log('SUCCESS: "attendance" table found.');
    }
}

check();

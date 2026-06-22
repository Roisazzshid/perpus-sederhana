const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env SUPABASE_URL');
}
if (!serviceRoleKey) {
  throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY');
}

// Server-side client using service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

module.exports = supabase;


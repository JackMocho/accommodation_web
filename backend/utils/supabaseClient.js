// filepath: backend/utils/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Role Key are required.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
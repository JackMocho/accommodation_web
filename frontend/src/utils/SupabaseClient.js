import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckxjqwoadqqnvpodsoah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreGpxd29hZHFxbnZwb2Rzb2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODg3NTMsImV4cCI6MjA3MDc2NDc1M30.yJ50DCzZ0MDRDCwjhuzLopwit1KmLn8lKmu-HLdbx1s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
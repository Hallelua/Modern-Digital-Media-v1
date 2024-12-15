import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xwprjmpozbfwvrhljglb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cHJqbXBvemJmd3ZyaGxqZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MjQwMjUsImV4cCI6MjA0ODEwMDAyNX0.M_58WdNeyNKk89pweFU-1xUvtehxON0KGFUcaZ8EbP8';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccjbpguodxziqidogfaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjamJwZ3VvZHh6aXFpZG9nZmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjcyNjksImV4cCI6MjA4MzYwMzI2OX0.OKIbSi9qdDHBhsdgO_bMpiuFEMiSCRKzmN5QJ6FqM7I';

export const supabase = createClient(supabaseUrl, supabaseKey);

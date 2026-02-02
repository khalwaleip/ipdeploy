import { createClient } from '@supabase/supabase-js'

// The Project URL provided
const supabaseUrl = 'https://ucusxqmezxrfmjovkdqk.supabase.co'

/**
 * We prioritize the environment variable which is injected via Vite.
 * If you are running locally, ensure this is in your .env file or AI Studio Secrets.
 * The hardcoded value below is your project-specific anon key.
 */
const supabaseAnonKey: string = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdXN4cW1lenhyZm1qb3ZrZHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzE0NDgsImV4cCI6MjA4MzcwNzQ0OH0.EXwHRXGqQQ2zaJwLKbXAeKixQISKOkfsmUwMwIBH_m0'

// Validates that the key is a real Supabase JWT (Must start with eyJ)
export const isSupabaseConfigured = 
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'PLACEHOLDER' && 
  supabaseAnonKey.startsWith('eyJ')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Runtime warning if the configuration is missing or invalid
if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ SUPABASE CONFIGURATION MISSING: " +
    "The 'anon' key is either missing or invalid. " +
    "Please go to Supabase -> Settings -> API and copy the 'anon / public' key (starts with eyJ). " +
    "Add it to your environment as SUPABASE_ANON_KEY."
  )
}

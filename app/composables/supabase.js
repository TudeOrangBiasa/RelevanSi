import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.SUPABASE_URL
  const supabaseKey = config.public.SUPABASE_KEY
  return createClient(supabaseUrl, supabaseKey)
}

export function useSupabaseClient() {
  return getSupabaseClient()
}
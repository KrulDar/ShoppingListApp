import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bdcicchyfipnetlifodc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkY2ljY2h5ZmlwbmV0bGlmb2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjkwNDYsImV4cCI6MjA4NDI0NTA0Nn0.8Lvs87OlpuJ_dVTDkQS_oDUJl6pjhjF5IzwSuc0-bOE'

export const supabase = createClient(supabaseUrl, supabaseKey)

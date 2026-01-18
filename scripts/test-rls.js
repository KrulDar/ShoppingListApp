
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bdcicchyfipnetlifodc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkY2ljY2h5ZmlwbmV0bGlmb2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjkwNDYsImV4cCI6MjA4NDI0NTA0Nn0.8Lvs87OlpuJ_dVTDkQS_oDUJl6pjhjF5IzwSuc0-bOE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
    console.log("Creating/Logging in test user...")
    const email = `testuser${Date.now()}@gmail.com`
    const password = 'password123'

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    })

    if (authError) {
        console.error("Auth Error:", authError)
        return
    }

    const userId = authData.user?.id
    console.log("User ID:", userId)

    // Wait for trigger to create list
    console.log("Waiting for trigger...")
    await new Promise(r => setTimeout(r, 2000))

    // Fetch lists
    const { data: lists, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('owner_id', userId)

    if (listError) {
        console.error("List Fetch Error:", listError)
        return
    }

    console.log("Lists found:", lists)

    if (lists.length === 0) {
        console.error("No lists found! Trigger might have failed.")
        return
    }

    const listId = lists[0].id

    // Try to add item
    console.log("Attempting to add item to list:", listId)
    const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert({
            list_id: listId,
            name: 'Test Item',
            amount: 1,
            category_id: null,
            checked: false
        })
        .select()

    if (itemError) {
        console.error("Item Add Error:", itemError)
        // Check RLS policy details via error message usually
    } else {
        console.log("Success! Item added:", itemData)
    }
}

test()

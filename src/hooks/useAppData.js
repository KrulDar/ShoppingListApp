import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAppData(session) {
    const [profile, setProfile] = useState(null)
    const [role, setRole] = useState('user')
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!session) return

        async function fetchData() {
            setLoading(true)
            try {
                const user = session.user

                // 1. Fetch Profile
                let { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileError) throw profileError

                // 2. Fetch Role
                let { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle() // Use maybeSingle as role might trigger-created slightly later? No, trigger is sync.

                // 3. Fetch Lists
                let { data: listsData, error: listsError } = await supabase
                    .from('lists')
                    .select('*')
                    .order('created_at', { ascending: true })

                if (listsError) throw listsError

                setProfile(profileData)
                setRole(roleData?.role || 'user')
                setLists(listsData)

            } catch (error) {
                console.error('Error loading app data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [session])

    return { profile, role, lists, loading }
}

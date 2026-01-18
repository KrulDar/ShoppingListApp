import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import ShoppingList from './components/ShoppingList'
import ListManager from './components/ListManager'
import { useAppData } from './hooks/useAppData'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState(null)
  const [showListManager, setShowListManager] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { profile, role, lists, loading: dataLoading } = useAppData(session)

  // Auto-select first list
  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id)
    }
  }, [lists, selectedListId])

  if (authLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>Connect...</div>
  }

  if (!session) {
    return <Auth />
  }

  if (dataLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>Loading data...</div>
  }

  return (
    <div className="container">
      <Navbar
        lists={lists}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        onManageLists={() => setShowListManager(true)}
        profile={profile}
        role={role}
      />

      {showListManager && (
        <ListManager
          lists={lists}
          user={session?.user}
          onClose={() => setShowListManager(false)}
        />
      )}

      <main>
        {selectedListId ? (
          <ShoppingList listId={selectedListId} />
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>No lists found.</p>
            <button
              className="primary"
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const { error } = await supabase.from('lists').insert({
                  name: 'My Shopping List',
                  owner_id: user.id
                })
                if (error) alert('Error creating list: ' + error.message)
                else window.location.reload() // Simple reload to refetch
              }}
            >
              Create New List
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

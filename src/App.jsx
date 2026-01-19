import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import ShoppingList from './components/ShoppingList'
import ListManager from './components/ListManager'
import { useAppData } from './hooks/useAppData'

function App() {
  const { t, i18n } = useTranslation()
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState(null)
  const [showListManager, setShowListManager] = useState(false)
  const initializedLanguageSync = useRef(false)

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

  useEffect(() => {
    if (profile?.language && !initializedLanguageSync.current) {
      console.log('🔄 App: Syncing initial language from profile:', profile.language);
      i18n.changeLanguage(profile.language)
      initializedLanguageSync.current = true
    }
  }, [profile, i18n])



  if (authLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>{t('app.connect')}</div>
  }

  if (!session) {
    return <Auth />
  }

  if (dataLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>{t('app.loading')}</div>
  }

  const activeListId = selectedListId || (lists.length > 0 ? lists[0].id : null)

  return (
    <div className="container">
      <Navbar
        lists={lists}
        selectedListId={activeListId}
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
        {activeListId ? (
          <ShoppingList listId={activeListId} />
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import ShoppingList from './components/ShoppingList'
import ListManager from './components/ListManager'
import { useAppData } from './hooks/useAppData'
import { useFirstTimeSetup } from './hooks/useFirstTimeSetup'

function App() {
  const { t, i18n } = useTranslation()
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState(null)
  const [showListManager, setShowListManager] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const initializedLanguageSync = useRef(false)
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

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

  // Listen for language changes and force re-render
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      console.log('🌐 App: Language changed to:', lng);
      setCurrentLanguage(lng)
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => i18n.off('languageChanged', handleLanguageChange)
  }, [i18n])

  const { profile, role, lists, loading: dataLoading } = useAppData(session)

  const handleSetupComplete = useCallback(() => {
    setShowWelcome(true)
  }, [])

  // Handle first-time user setup (create default list)
  useFirstTimeSetup(profile, handleSetupComplete)

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

      {showWelcome && (
        <div style={{
          backgroundColor: 'hsl(140 60% 95%)',
          color: 'hsl(140 100% 25%)',
          padding: '1rem 1.5rem',
          margin: '1rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '1.1rem' }}>🎉 {t('welcome.title')}</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {t('welcome.message')}
            </p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              opacity: 0.7,
              boxShadow: 'none'
            }}
          >
            ×
          </button>
        </div>
      )}

      <main key={currentLanguage}>
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

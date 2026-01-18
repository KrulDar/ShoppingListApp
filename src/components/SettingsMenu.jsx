import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsMenu({ profile, role }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [menuRef])

    const updateLanguage = async (lang) => {
        // Optimistic update would be better, but we'll specific later.
        // For now, fire and forget or simple alert on error
        const { error } = await supabase
            .from('profiles')
            .update({ language: lang })
            .eq('id', profile.id)

        if (error) console.error('Error updating language:', error)
    }

    return (
        <div className="settings-menu" style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} style={{ padding: '0.5rem' }}>
                ⚙️
            </button>

            {isOpen && (
                <div className="card" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    minWidth: '200px',
                    padding: '1rem',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{profile?.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Role: {role}</div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Language</label>
                        <select
                            value={profile?.language || 'lt'}
                            onChange={(e) => updateLanguage(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="lt">Lietuvių</option>
                            <option value="en">English</option>
                            <option value="no">Norsk</option>
                        </select>
                    </div>

                    {role === 'admin' && (
                        <button style={{ width: '100%', textAlign: 'left' }}>Admin Panel</button>
                    )}

                    <button
                        onClick={() => supabase.auth.signOut()}
                        style={{ width: '100%', textAlign: 'left', color: 'red' }} // Simple danger style
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}

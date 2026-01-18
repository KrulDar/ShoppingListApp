import ListSelector from './ListSelector'
import SettingsMenu from './SettingsMenu'

export default function Navbar({ lists, selectedListId, onSelectList, onManageLists, profile, role }) {
    return (
        <nav className="card" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem'
        }}>
            <div style={{ flex: 1 }}>
                <ListSelector
                    lists={lists}
                    selectedListId={selectedListId}
                    onSelect={onSelectList}
                    onManageLists={onManageLists}
                />
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    🛒 Shopping List
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <SettingsMenu profile={profile} role={role} />
            </div>
        </nav>
    )
}

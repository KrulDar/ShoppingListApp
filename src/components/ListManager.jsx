import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ListManager({ lists, user, onClose }) {
    const [editingId, setEditingId] = useState(null)
    const [editName, setEditName] = useState('')
    const [newListName, setNewListName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const updateList = async (id) => {
        if (!editName.trim()) return
        const { error } = await supabase.from('lists').update({ name: editName }).eq('id', id)
        if (error) {
            console.error('Error updating list:', error)
            alert('Could not update list. ' + error.message)
        } else {
            setEditingId(null)
            window.location.reload() // Force reload to refresh lists in App/Navbar
        }
    }

    const deleteList = async (id) => {
        if (!confirm('Delete this list? All items will be lost.')) return
        const { error } = await supabase.from('lists').delete().eq('id', id)
        if (error) {
            console.error('Error deleting list:', error)
            alert('Could not delete list. ' + error.message)
        } else {
            window.location.reload()
        }
    }

    const createList = async (e) => {
        e.preventDefault()
        if (!newListName.trim()) return

        const { error } = await supabase.from('lists').insert({
            name: newListName,
            owner_id: user.id
        })

        if (error) {
            console.error('Error creating list:', error)
            alert('Could not create list. ' + error.message)
        } else {
            setNewListName('')
            setIsCreating(false)
            window.location.reload()
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3>Manage Lists</h3>
                    <button onClick={onClose}>Close</button>
                </div>

                {/* Create New List Section */}
                {isCreating ? (
                    <form onSubmit={createList} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>New List Name</label>
                            <input
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                placeholder="e.g., Weekly Shopping"
                                style={{ width: '100%' }}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="primary" style={{ flex: 1 }}>Create</button>
                            <button type="button" onClick={() => { setIsCreating(false); setNewListName('') }} style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="primary"
                        style={{ width: '100%', marginBottom: '1.5rem' }}
                    >
                        + Create New List
                    </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {lists.map(list => (
                        <div key={list.id} className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-body)', borderRadius: 'var(--radius-sm)' }}>
                            {editingId === list.id ? (
                                <div className="flex gap-2" style={{ flex: 1 }}>
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        style={{ flex: 1 }}
                                        autoFocus
                                    />
                                    <button onClick={() => updateList(list.id)} className="primary">Save</button>
                                    <button onClick={() => setEditingId(null)}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 500 }}>{list.name}</div>
                                    <div className="flex gap-2">
                                        {/* Only show actions if owner */}
                                        {list.owner_id === user?.id ? (
                                            <>
                                                <button
                                                    onClick={() => { setEditingId(list.id); setEditName(list.name); }}
                                                    style={{ fontSize: '0.85rem' }}
                                                >
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => deleteList(list.id)}
                                                    style={{ fontSize: '0.85rem', color: 'red' }}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Shared with you</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {lists.length === 0 && <div style={{ color: 'var(--color-text-muted)' }}>No lists found.</div>}
                </div>
            </div>
        </div>
    )
}

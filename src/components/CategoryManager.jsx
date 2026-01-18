import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CategoryManager({ categories, onClose }) {
    const [newCatName, setNewCatName] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editName, setEditName] = useState('')

    const addCategory = async (e) => {
        e.preventDefault()
        if (!newCatName.trim()) return

        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { error } = await supabase.from('categories').insert({
                name: newCatName,
                owner_id: user.id
            })
            if (error) {
                console.error('Error adding category:', error)
                alert('Could not add category. ' + error.message)
            } else {
                setNewCatName('')
            }
        }
    }

    const updateCategory = async (id) => {
        if (!editName.trim()) return
        const { error } = await supabase.from('categories').update({ name: editName }).eq('id', id)
        if (error) {
            console.error('Error updating category:', error)
            alert('Could not update category. ' + error.message)
        } else {
            setEditingId(null)
        }
    }

    const deleteCategory = async (id) => {
        if (!confirm('Delete category? Items will be uncategorized.')) return
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) {
            console.error('Error deleting category:', error)
            alert('Could not delete category. ' + error.message)
        }
    }

    const moveCategory = async (id, direction) => {
        const index = categories.findIndex(c => c.id === id)
        if (index === -1) return

        const otherIndex = direction === 'up' ? index - 1 : index + 1
        if (otherIndex < 0 || otherIndex >= categories.length) return

        const current = categories[index]
        const other = categories[otherIndex]

        // Swap functionality
        // We need to ensure they have distinct sort_orders. 
        // If sort_order is null, we assume index based sort.
        // Let's just swap their sort_order values.
        // Note: data fetched is already sorted by sort_order.

        let currentOrder = current.sort_order || index * 10
        let otherOrder = other.sort_order || otherIndex * 10

        // If they happen to be equal (e.g. both null or collision), fix it
        if (currentOrder === otherOrder) {
            currentOrder = index * 10
            otherOrder = otherIndex * 10
        }

        // Perform swap
        const { error: error1 } = await supabase
            .from('categories')
            .update({ sort_order: otherOrder })
            .eq('id', current.id)

        if (error1) {
            console.error('Error moving category:', error1)
            return
        }

        const { error: error2 } = await supabase
            .from('categories')
            .update({ sort_order: currentOrder })
            .eq('id', other.id)

        if (error2) console.error('Error moving category (partner):', error2)
    }

    return (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h3>Manage Categories</h3>
                <button onClick={onClose} style={{ fontSize: '0.9rem' }}>Close</button>
            </div>

            <form onSubmit={addCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="New Category Name"
                    style={{ flex: 1 }}
                />
                <button type="submit" className="primary">Add</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center" style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        {editingId === cat.id ? (
                            <div className="flex gap-2" style={{ flex: 1 }}>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={{ flex: 1, padding: '0.25rem' }}
                                    autoFocus
                                />
                                <button onClick={() => updateCategory(cat.id)} className="primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Save</button>
                                <button onClick={() => setEditingId(null)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <span>{cat.name}</span>
                                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => moveCategory(cat.id, 'up')}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                fontSize: '1rem',
                                                lineHeight: '1',
                                                cursor: categories.indexOf(cat) === 0 ? 'not-allowed' : 'pointer',
                                                opacity: categories.indexOf(cat) === 0 ? 0.3 : 1
                                            }}
                                            disabled={categories.indexOf(cat) === 0}
                                            title="Move up"
                                        >
                                            ⬆
                                        </button>
                                        <button
                                            onClick={() => moveCategory(cat.id, 'down')}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                fontSize: '1rem',
                                                lineHeight: '1',
                                                cursor: categories.indexOf(cat) === categories.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: categories.indexOf(cat) === categories.length - 1 ? 0.3 : 1
                                            }}
                                            disabled={categories.indexOf(cat) === categories.length - 1}
                                            title="Move down"
                                        >
                                            ⬇
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteCategory(cat.id)}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'red' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {categories.length === 0 && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No custom categories.</div>}
            </div>
        </div>
    )
}

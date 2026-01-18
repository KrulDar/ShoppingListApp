import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useListItems } from '../hooks/useListItems'
import CategoryManager from './CategoryManager'

export default function ShoppingList({ listId }) {
    const { categories, items, loading, updateLocalItem } = useListItems(listId)

    // Local state for UI
    const [searchQuery, setSearchQuery] = useState('')
    const [showCheckedOnly, setShowCheckedOnly] = useState(false)
    const [showCatManager, setShowCatManager] = useState(false)

    // Add Item State
    const [isAdding, setIsAdding] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [newItemAmount, setNewItemAmount] = useState(1)
    const [newItemCategory, setNewItemCategory] = useState('')
    const [newItemComment, setNewItemComment] = useState('')

    // Actions
    const toggleCheck = async (item) => {
        // Optimistic Update
        updateLocalItem(item.id, { checked: !item.checked })

        // Server Update
        const { error } = await supabase
            .from('items')
            .update({ checked: !item.checked })
            .eq('id', item.id)

        if (error) {
            console.error('Error toggling item:', error)
            // Revert on error
            updateLocalItem(item.id, { checked: item.checked })
        }
    }

    const updateItem = async (itemId, updates) => {
        // Optimistic Update
        updateLocalItem(itemId, updates)

        const { error } = await supabase
            .from('items')
            .update(updates)
            .eq('id', itemId)

        if (error) {
            console.error('Error updating item:', error)
            alert('Failed to update item')
        }
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!newItemName.trim()) return
        if (!listId) {
            alert('No list selected!')
            return
        }

        const { error } = await supabase
            .from('items')
            .insert({
                list_id: listId,
                name: newItemName,
                amount: newItemAmount,
                category_id: newItemCategory || null,
                comment: newItemComment || null,
                checked: false
            })

        if (error) {
            console.error('Error adding item:', error)
            alert('Error adding item: ' + error.message)
        } else {
            setNewItemName('')
            setNewItemAmount(1)
            setNewItemComment('')
            setIsAdding(false)
        }
    }

    const deleteItem = async (itemId) => {
        if (!confirm("Delete this item?")) return;
        const { error } = await supabase.from('items').delete().eq('id', itemId);
        if (error) console.error("Error deleting item:", error);
    }

    // Filtering
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (showCheckedOnly && !item.checked) return false
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const matchName = item.name.toLowerCase().includes(q)
                const matchComment = item.comment?.toLowerCase().includes(q)
                return matchName || matchComment
            }
            return true
        })
    }, [items, showCheckedOnly, searchQuery])

    // Grouping
    const itemsByCat = {}
    const uncategorized = []

    filteredItems.forEach(item => {
        if (item.category_id) {
            if (!itemsByCat[item.category_id]) itemsByCat[item.category_id] = []
            itemsByCat[item.category_id].push(item)
        } else {
            uncategorized.push(item)
        }
    })

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading list...</div>

    return (
        <div className="shopping-list">
            {/* Controls */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowCheckedOnly(!showCheckedOnly)}
                            style={{
                                backgroundColor: showCheckedOnly ? 'var(--color-primary)' : 'var(--color-bg-card)',
                                color: showCheckedOnly ? 'white' : 'var(--color-text-main)',
                                border: '1px solid var(--color-border)',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                padding: '0.6rem 1rem'
                            }}
                        >
                            {showCheckedOnly ? 'Show All' : 'Show Checked'}
                        </button>

                        <button
                            onClick={() => setShowCatManager(!showCatManager)}
                            style={{
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                padding: '0.6rem 1rem'
                            }}
                        >
                            Cats {showCatManager ? '▲' : '▼'}
                        </button>

                        <button
                            className="primary"
                            onClick={() => setIsAdding(!isAdding)}
                            style={{
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                padding: '0.6rem 1rem'
                            }}
                        >
                            {isAdding ? 'Cancel' : 'Add +'}
                        </button>
                    </div>
                </div>

                {/* Category Manager */}
                {showCatManager && (
                    <div style={{ marginTop: '1rem' }}>
                        <CategoryManager categories={categories} onClose={() => setShowCatManager(false)} />
                    </div>
                )}

                {/* Add Item Form */}
                {isAdding && (
                    <form onSubmit={addItem} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Item Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="e.g. Milk"
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ width: '80px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Qty</label>
                            <input
                                type="number"
                                min="1"
                                value={newItemAmount}
                                onChange={(e) => setNewItemAmount(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                            <select
                                value={newItemCategory}
                                onChange={(e) => setNewItemCategory(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">Uncategorized</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 2, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Comment</label>
                            <input
                                type="text"
                                value={newItemComment}
                                onChange={(e) => setNewItemComment(e.target.value)}
                                placeholder="Optional note"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="primary" style={{ height: '38px' }}>Add</button>
                    </form>
                )}
            </div>

            {categories.map(cat => {
                const catItems = itemsByCat[cat.id] || []
                if (catItems.length === 0) return null

                return (
                    <div key={cat.id} className="category-group" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            color: 'var(--color-primary)',
                            borderBottom: '2px solid var(--color-border)',
                            paddingBottom: '0.25rem',
                            marginBottom: '0.5rem'
                        }}>
                            {cat.name}
                        </h3>
                        <div className="items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {catItems.map(item => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    categories={categories}
                                    onToggle={() => toggleCheck(item)}
                                    onUpdate={updateItem}
                                    onDelete={() => deleteItem(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}

            {uncategorized.length > 0 && (
                <div className="category-group" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Uncategorized</h3>
                    <div className="items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {uncategorized.map(item => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                categories={categories}
                                onToggle={() => toggleCheck(item)}
                                onUpdate={updateItem}
                                onDelete={() => deleteItem(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {items.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <p>This list is empty.</p>
                    <button style={{ marginTop: '1rem' }} onClick={() => setIsAdding(true)}>Add your first item</button>
                </div>
            )}

            {items.length > 0 && filteredItems.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <p>No items match your filters.</p>
                </div>
            )}
        </div>
    )
}

function ItemRow({ item, categories, onToggle, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const [edited, setEdited] = useState({
        name: item.name,
        amount: item.amount,
        comment: item.comment || '',
        category_id: item.category_id || ''
    })

    const startEditing = () => {
        setEdited({
            name: item.name,
            amount: item.amount,
            comment: item.comment || '',
            category_id: item.category_id || ''
        })
        setIsEditing(true)
    }

    const save = () => {
        if (!edited.name.trim()) return
        onUpdate(item.id, {
            name: edited.name,
            amount: edited.amount,
            comment: edited.comment || null,
            category_id: edited.category_id || null
        })
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="item-row card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Name</label>
                        <input
                            value={edited.name}
                            onChange={e => setEdited({ ...edited, name: e.target.value })}
                            style={{ width: '100%' }}
                            autoFocus
                        />
                    </div>
                    <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty</label>
                        <input
                            type="number" min="1"
                            value={edited.amount}
                            onChange={e => setEdited({ ...edited, amount: parseInt(e.target.value) || 1 })}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Category</label>
                        <select
                            value={edited.category_id}
                            onChange={e => setEdited({ ...edited, category_id: e.target.value })}
                            style={{ width: '100%' }}
                        >
                            <option value="">Uncategorized</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ width: '100%' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Comment</label>
                    <input
                        value={edited.comment}
                        onChange={e => setEdited({ ...edited, comment: e.target.value })}
                        placeholder="Optional note"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="primary" onClick={save} style={{ flex: 1 }}>Save</button>
                    <button onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</button>
                    <button
                        onClick={() => {
                            setIsEditing(false)
                            onDelete()
                        }}
                        style={{ flex: 1, backgroundColor: 'hsl(0, 70%, 50%)', color: 'white' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        )
    }

    const incrementAmount = () => {
        onUpdate(item.id, { amount: item.amount + 1 })
    }

    const decrementAmount = () => {
        if (item.amount > 1) {
            onUpdate(item.id, { amount: item.amount - 1 })
        }
    }

    return (
        <div className="item-row card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
                type="checkbox"
                checked={item.checked}
                onChange={onToggle}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />

            <div style={{ flex: 1, opacity: item.checked ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ fontWeight: 500 }}>
                    {item.name}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                    onClick={decrementAmount}
                    disabled={item.amount <= 1}
                    style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.9rem',
                        cursor: item.amount <= 1 ? 'not-allowed' : 'pointer',
                        opacity: item.amount <= 1 ? 0.3 : 1,
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        minWidth: '28px'
                    }}
                    title="Decrease quantity"
                >
                    −
                </button>
                <div style={{
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    fontSize: '0.9rem',
                    minWidth: '25px',
                    textAlign: 'center'
                }}>
                    {item.amount}
                </div>
                <button
                    onClick={incrementAmount}
                    style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        minWidth: '28px'
                    }}
                    title="Increase quantity"
                >
                    +
                </button>
            </div>

            {item.comment && (
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowComment(!showComment)}
                        style={{
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            padding: '0.2rem 0.5rem',
                            backgroundColor: 'hsl(var(--color-primary) / 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            border: 'none'
                        }}
                        title="View comment"
                    >
                        💬
                    </button>
                    {showComment && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                marginBottom: '0.5rem',
                                backgroundColor: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.75rem',
                                boxShadow: 'var(--shadow-lg)',
                                minWidth: '200px',
                                maxWidth: '300px',
                                zIndex: 10,
                                fontSize: '0.9rem',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            {item.comment}
                            <button
                                onClick={() => setShowComment(false)}
                                style={{
                                    position: 'absolute',
                                    top: '0.25rem',
                                    right: '0.25rem',
                                    padding: '0.1rem 0.3rem',
                                    fontSize: '0.7rem',
                                    opacity: 0.5
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={startEditing}
                style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-sm)'
                }}
                title="Edit item"
            >
                ✏️
            </button>

        </div>
    )
}

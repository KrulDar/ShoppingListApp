import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useListItems(listId) {
    const [categories, setCategories] = useState([])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!listId) return

        let isMounted = true

        const fetchItems = async (isRefresh = false) => {
            if (!isRefresh) setLoading(true)
            try {
                // Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .order('sort_order', { ascending: true })

                if (catError) throw catError

                // Fetch Items
                const { data: itemData, error: itemError } = await supabase
                    .from('items')
                    .select('*')
                    .eq('list_id', listId)
                    .order('created_at', { ascending: false })

                if (itemError) throw itemError

                if (isMounted) {
                    setCategories(catData)
                    setItems(itemData)
                }
            } catch (error) {
                console.error('Error fetching list items:', error)
            } finally {
                if (isMounted && !isRefresh) setLoading(false)
            }
        }

        fetchItems()

        const itemSub = supabase
            .channel('items-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` }, () => {
                fetchItems(true)
            })
            .subscribe()

        const catSub = supabase
            .channel('categories-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                fetchItems(true)
            })
            .subscribe()

        return () => {
            isMounted = false
            itemSub.unsubscribe()
            catSub.unsubscribe()
        }

    }, [listId])

    const updateLocalItem = (id, updates) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
    }

    return { categories, items, loading, updateLocalItem }
}

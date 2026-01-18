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

        // Real-time subscription for items
        const itemSub = supabase
            .channel(`items-${listId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'items',
                filter: `list_id=eq.${listId}`
            }, (payload) => {
                if (isMounted) {
                    setItems(prev => [payload.new, ...prev])
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'items',
                filter: `list_id=eq.${listId}`
            }, (payload) => {
                if (isMounted) {
                    setItems(prev => prev.map(item =>
                        item.id === payload.new.id ? payload.new : item
                    ))
                }
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'items',
                filter: `list_id=eq.${listId}`
            }, (payload) => {
                if (isMounted) {
                    setItems(prev => prev.filter(item => item.id !== payload.old.id))
                }
            })
            .subscribe()

        // Real-time subscription for categories
        const catSub = supabase
            .channel('categories-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'categories'
            }, async () => {
                // Refetch categories when they change
                const { data: catData } = await supabase
                    .from('categories')
                    .select('*')
                    .order('sort_order', { ascending: true })

                if (isMounted && catData) {
                    setCategories(catData)
                }
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

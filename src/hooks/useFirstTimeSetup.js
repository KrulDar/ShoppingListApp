import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES, DEFAULT_LIST_NAME, DEFAULT_ITEMS } from '../lib/defaultItems';

/**
 * Hook to handle first-time user setup
 * Creates a default "Food" list with pre-populated items based on user's signup language
 */
export function useFirstTimeSetup(profile) {
    useEffect(() => {
        if (!profile) return;

        const setupDefaultList = async () => {
            try {
                // Check if user has already been set up
                if (profile.initial_setup_completed) {
                    return;
                }

                console.log('🎁 First time user detected, creating default list...');

                // Get the signup language from user metadata or profile
                const { data: { user } } = await supabase.auth.getUser();
                const signupLanguage = user?.user_metadata?.signup_language || profile.language || 'en';

                console.log(`📝 Using language: ${signupLanguage}`);

                // Create the "Food" list
                const listName = DEFAULT_LIST_NAME[signupLanguage] || DEFAULT_LIST_NAME.en;
                const { data: newList, error: listError } = await supabase
                    .from('lists')
                    .insert({
                        name: listName,
                        owner_id: profile.id
                    })
                    .select()
                    .single();

                if (listError) {
                    console.error('Error creating default list:', listError);
                    return;
                }

                console.log(`✅ Created list: ${listName}`);

                // Create categories
                const categories = DEFAULT_CATEGORIES[signupLanguage] || DEFAULT_CATEGORIES.en;
                const categoryMap = {}; // Map category index to created category ID

                for (let i = 0; i < categories.length; i++) {
                    const { data: category, error: catError } = await supabase
                        .from('categories')
                        .insert({
                            name: categories[i],
                            owner_id: profile.id,
                            sort_order: i
                        })
                        .select()
                        .single();

                    if (!catError && category) {
                        categoryMap[i] = category.id;
                    } else if (catError) {
                        console.error(`Error creating category ${categories[i]}:`, catError);
                    }
                }

                console.log(`✅ Created ${Object.keys(categoryMap).length} categories`);

                // Create items
                const itemsToInsert = DEFAULT_ITEMS.map((item, index) => {
                    const itemName = item[`name_${signupLanguage}`] || item.name_en;
                    const categoryId = categoryMap[item.category];

                    return {
                        list_id: newList.id,
                        name: itemName,
                        amount: item.amount,
                        category_id: categoryId || null,
                        checked: false,
                        sort_order: index
                    };
                });

                const { error: itemsError } = await supabase
                    .from('items')
                    .insert(itemsToInsert);

                if (itemsError) {
                    console.error('Error creating default items:', itemsError);
                    return;
                }

                console.log(`✅ Created ${itemsToInsert.length} items`);

                // Mark setup as completed
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ initial_setup_completed: true })
                    .eq('id', profile.id);

                if (updateError) {
                    console.error('Error updating profile:', updateError);
                } else {
                    console.log('🎉 First-time setup completed!');
                }

            } catch (error) {
                console.error('Error in first-time setup:', error);
            }
        };

        setupDefaultList();
    }, [profile]);
}

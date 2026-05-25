import apiClient from '@/api/client'

import { ProductOptionService } from '../product_option/ProductOptionService'
import { ProductOptionValueService } from '../product_option_value/ProductOptionValueService'
import { ProductService } from '../product/ProductService'

/** Récupère tous les IDs d'une ressource */
async function getAllIds(resource: string): Promise<number[]> {
    try {
        const response = await apiClient.get(`/${resource}?display=[id]`)
        const xml = response.data as string
        const ids: number[] = []
        const regex = /<id>(?:\<!\[CDATA\[)?(\d+)(?:\]\]>)?<\/id>/g
        let match
        while ((match = regex.exec(xml)) !== null) {
            ids.push(parseInt(match[1] ?? ''))
        }
        return ids
    } catch {
        return []
    }
}

/** Supprime une ressource par ID */
async function deleteById(resource: string, id: number): Promise<void> {
    try {
        await apiClient.delete(`/${resource}/${id}`)
    } catch (err: any) {
        console.warn(`[Reset] Échec suppression ${resource}/${id}:`, err?.message || err)
    }
}

/** Supprime toutes les ressources d'un type (sauf IDs exclus) */
async function deleteAll(resource: string, excludeIds: number[] = []): Promise<number> {
    const ids = await getAllIds(resource)
    const toDelete = ids.filter(id => !excludeIds.includes(id))
    let deleted = 0
    for (const id of toDelete) {
        await deleteById(resource, id)
        deleted++
    }
    console.log(`[Reset] ${resource}: ${deleted} supprimé(s)`)
    return deleted
}

type ResetLogEntry = {
    resource: string
    deleted: number
}

export const ResetService = {

    /**
     * Réinitialise toutes les données.
     * Ordre de suppression : dépendances d'abord, entités principales ensuite.
     */
    async resetAll(): Promise<{ logs: ResetLogEntry[]; success: boolean }> {
        const logs: ResetLogEntry[] = []

        try {
            console.log('[Reset] Début de la réinitialisation...')

            // Vider les caches mémoire locaux
            ProductOptionService.clearCache()
            ProductOptionValueService.clearCache()
            ProductService.clearCache()
            console.log('[Reset] Caches locaux vidés.')

            // Phase 1 : Entités dépendantes (enfants)
            const phase1: string[] = [
                'orders',              // dépend de carts, customers
                'order_histories',       // dépend de orders
                // 'order_state_changes',   // dépend de orders
                'carts',               // dépend de customers, addresses, produits
                'combinations',        // dépend de produits, options
                'images/products',     // dépend de produits (endpoint différent)
                'product_option_values', // dépend de product_options
                'product_options',     // indépendant mais valeurs en dépendent
                'stock_movements', // stock mouvements
            ]

            for (const resource of phase1) {
                const deleted = await deleteAll(resource)
                logs.push({ resource, deleted })
            }

            // Phase 2 : Produits (sauf catégories racine)
            const productDeleted = await deleteAll('products')
            logs.push({ resource: 'products', deleted: productDeleted })

            // Phase 3 : Adresses
            const addressDeleted = await deleteAll('addresses', [1])
            logs.push({ resource: 'addresses', deleted: addressDeleted })

            // Phase 4 : Clients
            const customerDeleted = await deleteAll('customers', [1])
            logs.push({ resource: 'customers', deleted: customerDeleted })

            // Phase 5 : Catégories (garder 1=Root et 2=Accueil)
            const categoryDeleted = await deleteAll('categories', [1, 2])
            logs.push({ resource: 'categories', deleted: categoryDeleted })

            // Phase 6 : Taxes
            const taxRuleGroupDeleted = await deleteAll('tax_rule_groups')
            logs.push({ resource: 'tax_rule_groups', deleted: taxRuleGroupDeleted })
            const taxRuleDeleted = await deleteAll('tax_rules')
            logs.push({ resource: 'tax_rules', deleted: taxRuleDeleted })
            const taxDeleted = await deleteAll('taxes')
            logs.push({ resource: 'taxes', deleted: taxDeleted })

            console.log('[Reset] Réinitialisation terminée.')
            return { logs, success: true }
        } catch (err: any) {
            console.error('[Reset] Erreur:', err)
            return { logs, success: false }
        }
    }
}

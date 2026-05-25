import { StockAvailableService } from '../stock_available/StockAvailableService'
import { StockMvtService } from '../stock_mvt/StockMvtService'

export interface EvolutionDay {
    date: string
    initialStock: number
    in: number
    out: number
    available: number
}

/**
 * Formate une date en YYYY-MM-DD (local time)
 */
const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Crée une date à partir d'une chaîne YYYY-MM-DD (local time)
 */
const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('-').map(Number)
    const y = parts[0] || 0
    const m = parts[1] || 1
    const d = parts[2] || 1
    return new Date(y, m - 1, d)
}

export const StockEvolutionService = {
    /**
     * Calcule l'évolution journalière des stocks pour un produit.
     * Génère toutes les dates consécutives pour assurer une continuité.
     */
    async calculateEvolution(
        productId: number | null,
        startDate?: string,
        endDate?: string,
        productAttributeId?: number | null
    ): Promise<EvolutionDay[]> {
        if (!productId) return []

        // 1. Récupérer les stocks et mouvements
        const allStocks = await StockAvailableService.getAll()
        const allProductStocks = allStocks.filter(s => Number(s.id_product) === productId)

        // Règle métier : déclinaisons si présentes, sinon standard ou filtrage spécifique
        const hasCombos = allProductStocks.some(s => Number(s.id_product_attribute) !== 0)
        
        let productStocks = allProductStocks
        if (productAttributeId !== undefined && productAttributeId !== null) {
            // Si une déclinaison spécifique est demandée
            productStocks = allProductStocks.filter(s => Number(s.id_product_attribute) === productAttributeId)
        } else {
            // Comportement par défaut (consolidation)
            productStocks = hasCombos
                ? allProductStocks.filter(s => Number(s.id_product_attribute) !== 0)
                : allProductStocks.filter(s => Number(s.id_product_attribute) === 0)
        }

        // Calculer le stock actuel total
        const currentTotalStock = productStocks.reduce((sum, s) => sum + Number(s.quantity), 0)

        // 2. Récupérer tous les mouvements pour les lignes de stock filtrées
        const mvtPromises = productStocks.map(s => StockMvtService.getByStockId(s.id))
        const mvtResults = await Promise.all(mvtPromises)
        const allMovements = mvtResults.flat()

        // 3. Grouper par date
        const dailyGroups: Record<string, { in: number, out: number }> = {}
        allMovements.forEach(mvt => {
            const dateStr = (mvt.date_add || '').split(' ')[0]
            if (!dateStr) return

            if (!dailyGroups[dateStr]) {
                dailyGroups[dateStr] = { in: 0, out: 0 }
            }

            const group = dailyGroups[dateStr]
            if (!group) return // Guard pour TypeScript

            const qty = Math.abs(Number(mvt.physical_quantity))
            const sign = Number(mvt.sign)

            if (sign > 0) group.in += qty
            else group.out += qty
        })

        // 4. Déterminer les bornes de l'intervalle à afficher
        const todayStr = formatDate(new Date())
        
        let oldestMvtDate = todayStr
        Object.keys(dailyGroups).forEach(d => {
            if (d < oldestMvtDate) oldestMvtDate = d
        })

        // La boucle commence à endDate (ou today par défaut) et s'arrête à startDate (ou oldestMvtDate par défaut)
        const loopEndDateStr = endDate || todayStr
        const loopStartDateStr = startDate || oldestMvtDate

        // 5. Calculer le stock disponible réel à la date de fin (loopEndDateStr)
        // Il faut annuler l'effet des mouvements qui ont eu lieu APRÈS loopEndDateStr
        let stockAtEndDate = currentTotalStock
        Object.keys(dailyGroups).forEach(d => {
            if (d > loopEndDateStr) {
                const group = dailyGroups[d]
                if (group) {
                    // Annuler ce mouvement : on retire les entrées, on rajoute les sorties
                    stockAtEndDate = stockAtEndDate - group.in + group.out
                }
            }
        })

        // 6. Construire l'évolution jour par jour sur l'intervalle exact
        const evolution: EvolutionDay[] = []
        let runningAvailable = stockAtEndDate
        
        let curr = parseDate(loopEndDateStr)
        const minDate = parseDate(loopStartDateStr)

        while (curr >= minDate) {
            const dStr = formatDate(curr)
            const group = dailyGroups[dStr] || { in: 0, out: 0 }
            
            // Calcul du stock initial à partir du stock disponible (fin de journée)
            // initial = disponible - entrer + sortie
            const initial = runningAvailable - group.in + group.out

            evolution.push({
                date: dStr,
                available: runningAvailable,
                in: group.in,
                out: group.out,
                initialStock: initial
            })

            // Le stock initial de cette journée devient le stock disponible de la veille
            runningAvailable = initial
            
            // Passer au jour précédent
            curr.setDate(curr.getDate() - 1)
        }

        // Renverser le tableau pour l'afficher chronologiquement (du plus ancien au plus récent)
        // Cela permet une lecture logique de haut en bas : initial + entrées - sorties = disponible
        evolution.reverse()

        return evolution
    }
}

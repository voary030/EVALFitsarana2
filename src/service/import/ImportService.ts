import Papa from 'papaparse'
import JSZip from 'jszip'
import { ProductService } from '@/service/product/ProductService'
import { CombinationService } from '@/service/combination/CombinationService'
import { ProductOptionService } from '@/service/product_option/ProductOptionService'
import { ProductOptionValueService } from '@/service/product_option_value/ProductOptionValueService'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { StockDeltaService } from '@/service/stock_delta/StockDeltaService'
import { CartService } from '@/service/cart/CartService'
import { CustomerService } from '@/service/customer/CustomerService'
import { AddressService } from '@/service/adresse/AddressService'
import { OrderService } from '@/service/orders/OrderService'
import { OrderHistoryService } from '@/service/order_history/OrderHistoryService'
import { CategoryService } from '@/service/category/CategoryService'
import { TaxService } from '@/service/tax/taxe/TaxService'
import { ProductApi } from '@/api/product/ProductApi'
import { ImageApi } from '@/api/image/ImageApi'
import type { Product } from '@/types/product'
import type { ProductOptionValue } from '@/types/product_option_value'
import type { Combination } from '@/types/combination'
import type { Customer } from '@/types/customer'
import type { Cart } from '@/types/cart'
import { OrderStateChangeService } from '../order_state_change/OrderStateChangeService'
import { StockMvtService } from '@/service/stock_mvt/StockMvtService'
import type { Order } from '@/types/orders'

const normalizeText = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')

export interface ImportRowResult {
    success: boolean
    product?: Product
    order?: Order
    error?: string
    line: number
    column?: string
}

export interface ImageImportResult {
    success: boolean
    reference: string
    productId?: number
    imageId?: number
    fileName: string
    error?: string
}

export const ImportService = {

    async importFichier1(csvText: string): Promise<ImportRowResult[]> {
        const parsed = Papa.parse<string[]>(csvText, {
            header: false,
            skipEmptyLines: true,
            delimiter: ',',
        })

        if (parsed.data.length < 2) {
            throw new Error('Le fichier CSV est vide ou ne contient que l\'en-tête.')
        }

        const headers = parsed.data[0]

        checkColumns('fichier 1', headers, ['date_availability_produit', 'nom', 'reference', 'prix_ttc', 'Taxe', 'categorie', 'prix_achat'])

        // ── Caches locaux pour éviter les appels API redondants ──
        const categoryCache = new Map<string, { id: number }>()
        const taxCache = new Map<number, number>()

        const results: ImportRowResult[] = []
        for (let i = 1; i < parsed.data.length; i++) {
            const row = parsed.data[i]
            if (!row) continue
            const line = i + 1
            try {
                const data = {
                    date_availability_produit: (row[0] || '').trim(),
                    nom: (row[1] || '').trim(),
                    reference: (row[2] || '').trim(),
                    prix_ttc: (row[3] || '0').trim().replace(',', '.'),
                    Taxe: (row[4] || '0%').trim(),
                    categorie: (row[5] || '').trim(),
                    prix_achat: (row[6] || '0').trim().replace(',', '.'),
                }
                validateDateDDMMYYYY(data.date_availability_produit, 'date_availability_produit')
                validatePositiveAmount(data.prix_ttc, 'prix_ttc')
                validatePositiveAmount(data.prix_achat, 'prix_achat')
                // ── Résoudre la catégorie via cache ──
                const catKey = data.categorie.trim().toLowerCase()
                let categorie = categoryCache.get(catKey)
                if (!categorie) {
                    let cat = await CategoryService.getByName(data.categorie.trim())
                    if (!cat) {
                        cat = await CategoryService.create(data.categorie.trim())
                    }
                    if (cat) {
                        categorie = { id: cat.id }
                        categoryCache.set(catKey, categorie)
                    }
                }

                // ── Résoudre la taxe via cache ──
                const prix_ttc = Number(data.prix_ttc.replace(',', '.'))
                const prix_achat = Number(data.prix_achat.replace(',', '.'))
                const taxe_str = data.Taxe.replace('%', '').trim()
                const taxe = Number(taxe_str.replace(',', '.'))
                const prixHT = prix_ttc / (1 + (taxe / 100))

                let id_tax_rules_group = taxCache.get(taxe)
                if (id_tax_rules_group === undefined) {
                    let resolved = await TaxService.getIdTaxeRulesGroupByRateTax(taxe)
                    if (resolved == 0) {
                        const tax_rule_groupe = await TaxService.mamoronaTaxeSyNyZanany(`Taxe ${taxe} %`, taxe, 8)
                        resolved = tax_rule_groupe?.id
                    }
                    if (resolved) {
                        id_tax_rules_group = resolved
                        taxCache.set(taxe, resolved)
                    }
                }

                const formattedDate = data.date_availability_produit.split('/').reverse().join('-')

                if (categorie?.id && id_tax_rules_group) {
                    const product = await ProductService.create({
                        name: data.nom.trim(),
                        price: prixHT,
                        wholesale_price: prix_achat,
                        available_date: formattedDate,
                        reference: data.reference,
                        id_category: categorie.id,
                        id_tax_rules_group: id_tax_rules_group,
                    })
                    results.push({ success: true, product, line })
                } else {
                    results.push({ success: false, error: 'Catégorie ou taxe non résolue', line })
                }
            } catch (err: any) {
                const errorMsg = err?.message || err?.toString() || 'Erreur inconnue'
                results.push({
                    success: false,
                    error: errorMsg,
                    line,
                    column: err?.column
                })
            }
        }
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return results
    },

    async importFichier2(csvText: string): Promise<ImportRowResult[]> {

        const parsed = Papa.parse<string[]>(csvText, {
            header: false,
            skipEmptyLines: true,
            delimiter: ',',
        })

        if (parsed.data.length < 2) {
            throw new Error('Le fichier CSV est vide ou ne contient que l\'en-tête.')
        }

        const headers = parsed.data[0] || []
        // Version insensible à la casse (active par défaut)
        const actualHeaders = headers.map((h: string) => (h || '').trim().toLowerCase())
        const hasSpecificite = actualHeaders.includes('specificité') || actualHeaders.includes('specificite')
        const expectedCols = ['reference', 'karazany', 'stock_initial', 'prix_vente_ttc']
        if (hasSpecificite) expectedCols.splice(1, 0, 'specificité')

        // Version sensible à la casse (commentée)
        // const actualHeaders = headers.map((h: string) => (h || '').trim())
        // const hasSpecificite = actualHeaders.includes('specificité') || actualHeaders.includes('specificite')
        // const expectedCols = ['reference', 'karazany', 'stock_initial', 'prix_vente_ttc']
        // if (hasSpecificite) {
        //     const exactSpec = actualHeaders.includes('specificité') ? 'specificité' : 'specificite'
        //     expectedCols.splice(1, 0, exactSpec)
        // }

        checkColumns('fichier 2', parsed.data[0], expectedCols)

        // ── Caches locaux pour éviter les appels API redondants ──
        const productCache = new Map<string, Product>()          // reference → Product
        const comboCache = new Map<number, Combination[]>()      // productId → Combination[]
        const taxRateCache = new Map<number, number>()           // productId → taxRate

        const results: ImportRowResult[] = []

        for (let i = 1; i < parsed.data.length; i++) {
            const row = parsed.data[i]
            if (!row) continue
            const line = i + 1

            try {
                const reference = (row[0] || '').trim()
                const specificite = (row[1] || '').trim()
                const karazany = (row[2] || '').trim()
                const stockInitial = parseInt((row[3] || '0').trim()) || 0
                const rawPrix = (row[4] || '').trim()
                const prixVenteTtc = rawPrix === '' ? 0 : parseFloat(rawPrix.replace(',', '.')) || 0

                // Si la colonne prix est vide, on accepte 0 (prix non renseigné)
                // Valider le montant uniquement si la colonne "specificité" est présente
                if (rawPrix !== '' && hasSpecificite) validatePositiveAmount(rawPrix, 'prix_vente_ttc')

                if (!reference) {
                    results.push({ success: false, error: 'Référence vide', line, column: 'reference' })
                    continue
                }

                // ── Trouver le produit par référence (cache) ──
                let product = productCache.get(reference)
                if (!product) {
                    const found = await ProductService.findByReference(reference)
                    if (!found) {
                        results.push({ success: false, error: `Produit avec référence "${reference}" introuvable`, line, column: 'reference' })
                        continue
                    }
                    product = found
                    productCache.set(reference, product)
                }

                if (!specificite && !karazany) {
                    // Pas de spécificité → mise à jour du stock du produit de base
                    await StockAvailableService.updateStock(product.id, 0, stockInitial)

                    const stock = await StockAvailableService.getByProductId(product.id, 0)
                    if (stock) {
                        const mvtDate = product.available_date && product.available_date !== '0000-00-00 00:00:00'
                            ? (product.available_date.includes(' ') ? product.available_date : product.available_date + ' 12:00:00')
                            : new Date().toISOString().slice(0, 19).replace('T', ' ')
                        await StockMvtService.createMouvement({
                            id_product: product.id,
                            id_product_attribute: 0,
                            id_stock: stock.id,
                            physical_quantity: stockInitial,
                            sign: 1,
                            date_add: mvtDate
                        })
                    }

                    results.push({ success: true, line, product })
                    continue
                }

                // Créer ou trouver l'option de produit (a déjà son propre cache interne)
                let option = await ProductOptionService.findOrCreate(specificite)
                if (!option) {
                    results.push({ success: false, error: `Impossible de créer l'option "${specificite}"`, line, column: 'specificité' })
                    continue
                }

                // Créer ou trouver la valeur d'option (a déjà son propre cache interne)
                let optionValue = await ProductOptionValueService.findOrCreate(option.id, karazany)
                if (!optionValue) {
                    results.push({ success: false, error: `Impossible de créer la valeur "${karazany}"`, line, column: 'karazany' })
                    continue
                }

                // ── Vérifier les combinaisons existantes (cache) ──
                let existingCombos = comboCache.get(product.id)
                if (!existingCombos) {
                    existingCombos = await CombinationService.getByProductId(product.id)
                    comboCache.set(product.id, existingCombos)
                }

                const targetReference = reference + '_' + karazany.toLowerCase()
                let existingCombo = existingCombos.find(c => c.product_option_value_ids.includes(optionValue!.id))

                // Fallback: si pas trouvé par option, chercher par référence (pour éviter les doublons si l'association a échoué avant)
                if (!existingCombo) {
                    existingCombo = existingCombos.find(c => c.reference === targetReference)
                }

                if (existingCombo) {
                    // Mise à jour du stock de la combinaison existante
                    await StockAvailableService.updateStock(product.id, existingCombo.id, stockInitial)

                    const stock = await StockAvailableService.getByProductId(product.id, existingCombo.id)
                    if (stock) {
                        const mvtDate = product.available_date && product.available_date !== '0000-00-00 00:00:00'
                            ? (product.available_date.includes(' ') ? product.available_date : product.available_date + ' 12:00:00')
                            : new Date().toISOString().slice(0, 19).replace('T', ' ')
                        // console.log("==> ", mvtDate)
                        await StockMvtService.createMouvement({
                            id_product: product.id,
                            id_product_attribute: existingCombo.id,
                            id_stock: stock.id,
                            physical_quantity: stockInitial,
                            sign: 1,
                            date_add: mvtDate
                        })
                    }

                    results.push({ success: true, line, product })
                } else {
                    // ── Solution Radicale : Préparer le produit (Type + Lien Option) ──
                    await ProductService.prepareForCombinations(product.id, optionValue.id)

                    // ── Récupérer le taux de taxe (cache) ──
                    let taxRate = taxRateCache.get(product.id)
                    if (taxRate === undefined) {
                        taxRate = await ProductService.fetchTaxRate(product)
                        taxRateCache.set(product.id, taxRate)
                    }
                    const prixHt = prixVenteTtc / (1 + taxRate / 100)
                    const comboPrice = prixHt - product.price
                    // Créer la combinaison
                    const combo = await CombinationService.create({
                        id_product: product.id,
                        price: parseFloat(comboPrice.toFixed(6)),
                        reference: reference + '_' + karazany.toLowerCase(),
                        id_product_option_value: optionValue.id,
                        quantity: stockInitial,
                    })

                    if (combo) {
                        await StockAvailableService.updateStock(product.id, combo.id, stockInitial)
                        const stock = await StockAvailableService.getByProductId(product.id, combo.id)
                        if (stock) {
                            const mvtDate = product.available_date && product.available_date !== '0000-00-00 00:00:00'
                                ? (product.available_date.includes(' ') ? product.available_date : product.available_date + ' 12:00:00')
                                : new Date().toISOString().slice(0, 19).replace('T', ' ')

                            // console.log("==> ", mvtDate)
                            await StockMvtService.createMouvement({
                                id_product: product.id,
                                id_product_attribute: combo.id,
                                id_stock: stock.id,
                                physical_quantity: stockInitial,
                                sign: 1,
                                date_add: mvtDate
                            })
                        }

                        // Invalider le cache combos car on vient d'en créer une nouvelle
                        comboCache.delete(product.id)
                        results.push({ success: true, product, line })
                    } else {
                        results.push({ success: false, error: 'Échec création combinaison', line, column: 'Combination' })
                    }
                }
            } catch (err: any) {
                const errorMsg = err?.message || err?.toString() || 'Erreur inconnue'
                console.error('[importFichier2] ERREUR ligne', line, ':', errorMsg)
                results.push({ success: false, error: errorMsg, line, column: err?.column || 'Combination' })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return results
    },

    /**
     * Import du fichier 3 : création de paniers (et commandes si la colonne "etat" est remplie).
     * Colonnes attendues : date, nom, email, pwd, adresse, achat, etat
     * Format de la colonne "achat" : [("reference";quantite;"specificite"), ...]
     */
    async importFichier3(csvText: string): Promise<ImportRowResult[]> {
        const parsed = Papa.parse<string[]>(csvText, {
            header: false,
            skipEmptyLines: true,
            delimiter: ',',
        })

        if (parsed.data.length < 2) {
            throw new Error('Le fichier CSV est vide ou ne contient que l\'en-tête.')
        }

        const headers = parsed.data[0]
        checkColumns('fichier 3', headers, ['date', 'nom', 'email', 'pwd', 'adresse', 'achat', 'etat'])

        // ── Caches locaux pour éviter les appels API redondants ──
        const customerCache = new Map<string, Customer>()                // email → Customer
        const addressCache = new Map<number, number>()                   // customerId → addressId
        const productCache = new Map<string, Product>()                  // reference → Product
        const comboCache = new Map<number, Combination[]>()              // productId → Combination[]
        const optionValueByNameCache = new Map<string, ProductOptionValue | undefined>()  // name → value
        const prixTtcCache = new Map<string, number>()                   // "productId_comboId" → prixTtc
        let allOptionValuesCache: ProductOptionValue[] | null = null      // chargé 1 seule fois si besoin

        const results: ImportRowResult[] = []

        for (let i = 1; i < parsed.data.length; i++) {
            const row = parsed.data[i]
            if (!row || row.every(cell => !cell?.trim())) continue
            const line = i + 1

            try {
                const date = (row[0] || '').trim()
                const nom = (row[1] || '').trim()
                const email = (row[2] || '').trim()
                const pwd = (row[3] || '').trim()
                const adresseAndCity = (row[4] || '').trim()
                const [adresse, city] = adresseAndCity.split(",");
                const achatRaw = (row[5] || '').trim()
                const etat = (row[6] || '').trim()

                console.log('ohatra adresse : ' + adresse);
                validateDateDDMMYYYY(date, 'date')

                if (!email) {
                    results.push({ success: false, error: 'Email vide', line, column: 'email' })
                    continue
                }

                // ── Résoudre le client via cache ──
                const emailKey = email.toLowerCase()
                let customer = customerCache.get(emailKey)
                if (!customer) {
                    const found = await CustomerService.findByEmail(email)
                    if (found) {
                        customer = found
                    } else {
                        const created = await CustomerService.create({
                            firstname: nom,
                            lastname: nom,
                            email,
                            passwd: pwd,
                            active: 1,
                        })
                        if (!created) {
                            results.push({ success: false, error: `Impossible de créer le client ${email}`, line, column: 'email' })
                            continue
                        }
                        customer = created
                    }
                    customerCache.set(emailKey, customer)
                }

                // ── Résoudre l'adresse via cache ──
                let addressId = addressCache.get(customer.id)
                if (addressId === undefined) {
                    const customerAddresses = await AddressService.getByCustomerId(customer.id)
                    addressId = customerAddresses[0]?.id

                    if (!addressId && adresse) {
                        try {
                            const newAddress = await AddressService.create({
                                id_customer: customer.id,
                                id_country: 1,
                                alias: 'Adresse principale',
                                lastname: nom,
                                firstname: nom,
                                address1: adresse,
                                city: city,
                                postcode: '00000',
                            })
                            if (newAddress) {
                                addressId = newAddress.id
                            }
                        } catch (err: any) {
                            console.warn(`[importFichier3] Échec création adresse:`, err?.message || err)
                        }
                    }

                    if (addressId) {
                        addressCache.set(customer.id, addressId)
                    }
                }

                if (!addressId) {
                    results.push({ success: false, error: `Aucune adresse valide pour ${email}`, line, column: 'adresse' })
                    continue
                }

                // 2. Parser la colonne "achat" → [("ref";qty;"spec"), ...]
                const achatItems = parseAchatColumn(achatRaw)
                if (achatItems.length === 0) {
                    results.push({ success: false, error: 'Colonne achat vide ou mal formée', line, column: 'achat' })
                    continue
                }

                // 3. Résoudre les produits et combinaisons
                const cartItemsData: Array<{
                    product: Product
                    id_product_attribute: number
                    quantity: number
                    priceTtc: number
                }> = []

                for (const item of achatItems) {
                    // ── Trouver le produit par référence (cache) ──
                    let product = productCache.get(item.reference)
                    if (!product) {
                        const found = await ProductService.findByReference(item.reference)
                        if (!found) {
                            // Ignorer si référence produit non trouvée
                            console.warn(`[importFichier3] Produit introuvable pour la référence "${item.reference}" à la ligne ${line}. Ignoré.`)
                            continue
                        }
                        product = found
                        productCache.set(item.reference, product)
                    }

                    let id_product_attribute = 0
                    let priceTtc = product.prix_ttc ?? product.price

                    // Si une spécificité est renseignée, chercher la combinaison correspondante
                    if (item.specificite) {
                        // ── Récupérer les combinaisons (cache) ──
                        let combos = comboCache.get(product.id)
                        if (!combos) {
                            combos = await CombinationService.getByProductId(product.id)
                            comboCache.set(product.id, combos)
                        }

                        // ── Chercher la valeur d'option (cache) ──
                        const specKey = normalizeText(item.specificite)
                        let matchingValue: ProductOptionValue | undefined
                        if (optionValueByNameCache.has(specKey)) {
                            matchingValue = optionValueByNameCache.get(specKey)
                        } else {
                            matchingValue = await ProductOptionValueService.findByName(item.specificite)
                            optionValueByNameCache.set(specKey, matchingValue)
                        }

                        if (!matchingValue) {
                            try {
                                // Charger toutes les option values une seule fois
                                if (!allOptionValuesCache) {
                                    allOptionValuesCache = await ProductOptionValueService.getAll()
                                }
                                const productValues = (product.product_option_value_ids || []).map(id => {
                                    const v = allOptionValuesCache!.find(x => x.id === id)
                                    return v ? `${v.id}:${v.name}` : String(id)
                                })
                                console.error('[importFichier3] Valeur d\'option introuvable — debug:', {
                                    specificite: item.specificite,
                                    reference: item.reference,
                                    productId: product.id,
                                    productValueIds: product.product_option_value_ids,
                                    productValues,
                                    combos: combos.map(c => ({ id: c.id, product_option_value_ids: c.product_option_value_ids }))
                                })
                            } catch (dbgErr) {
                                console.error('[importFichier3] Debug fetch failed:', dbgErr)
                            }
                            results.push({ success: false, error: `Valeur d'option "${item.specificite}" introuvable pour ${item.reference}`, line })
                            cartItemsData.length = 0
                            break
                        }
                        const matchingCombo = combos.find(c => c.product_option_value_ids.includes(matchingValue!.id))
                        if (!matchingCombo) {
                            results.push({ success: false, error: `Combinaison "${item.specificite}" introuvable pour ${item.reference}`, line })
                            cartItemsData.length = 0
                            break
                        }
                        id_product_attribute = matchingCombo.id

                        // ── Calculer le prix TTC (cache) ──
                        const prixKey = `${product.id}_${matchingCombo.id}`
                        const cachedPrix = prixTtcCache.get(prixKey)
                        if (cachedPrix !== undefined) {
                            priceTtc = cachedPrix
                        } else {
                            try {
                                priceTtc = await ProductService.getPrixTtc(String(product.id), matchingCombo.id)
                                prixTtcCache.set(prixKey, priceTtc)
                            } catch {
                                priceTtc = product.prix_ttc ?? product.price
                            }
                        }
                    }

                    cartItemsData.push({
                        product,
                        id_product_attribute,
                        quantity: item.quantity,
                        priceTtc,
                    })
                }

                if (cartItemsData.length === 0) {
                    // erreur déjà pushée dans la boucle
                    continue
                }

                // 4. Créer le panier et ajouter les articles
                let cart: Cart | undefined
                for (const itemData of cartItemsData) {
                    try {
                        cart = await CartService.addToCart({
                            id_customer: customer.id,
                            id_address_delivery: addressId,
                            id_address_invoice: addressId,
                            id_currency: 1,
                            id_lang: 1,
                            id_product: itemData.product.id,
                            id_product_attribute: itemData.id_product_attribute,
                            quantity: itemData.quantity,
                            cartId: cart?.id,
                            date_add: date
                        })
                    } catch (err: any) {
                        console.error(`[importFichier3] Erreur ajout panier:`, err)
                        results.push({
                            success: false,
                            error: err?.message || err,
                            line,
                            column: err?.column
                        })
                        cart = undefined
                        break
                    }
                }

                if (!cart) {
                    continue
                }

                // 5. Gérer l'état : "dans le panier" ou vide → s'arrêter au panier. Sinon → créer la commande.
                const etatLower = etat.toLowerCase().trim()
                const isCartOnly = !etatLower || etatLower === 'dans le panier'

                if (isCartOnly) {
                    await CartService.patchDate(cart.id, date)
                    results.push({ success: true, line })
                } else {
                    try {

                        const order = await OrderService.createOrderFromCart(
                            cart,
                            cartItemsData.map(d => ({
                                id_product: d.product.id,
                                id_product_attribute: d.id_product_attribute,
                                priceTtc: d.priceTtc,
                                quantity: d.quantity,
                            })),
                            customer.id,
                            customer.email,
                            date
                        )

                        if (order) {
                            await CartService.patchDate(cart.id, date)
                            await OrderService.updateOrderDate(order.id, date)

                            const parts = date.split('/')
                            const formattedOrderDate = parts.length === 3
                                ? `${parts[2]}-${parts[1]}-${parts[0]} 12:00:00`
                                : date

                            if (etatLower === 'annulé') {
                                try {
                                    // await OrderHistoryService.changeOrderState(order.id, 6)
                                    await OrderStateChangeService.annuler(order.id, 1, formattedOrderDate);
                                } catch (histErr) {
                                    console.error(`[importFichier3] Échec changement état annulé pour commande ${order.id}:`, histErr)
                                }
                            }
                            if (etatLower === 'livré') {
                                try {
                                    await OrderStateChangeService.livrer(order.id, 1, formattedOrderDate);
                                } catch (histErr) {
                                    console.error(`[importFichier3] Échec changement état livré pour commande ${order.id}:`, histErr)
                                }
                            }
                            await OrderHistoryService.updateOrderHistoriesDate(order.id, date)
                            results.push({ success: true, order, line })
                        } else {
                            results.push({ success: false, error: 'Échec de la création de la commande (retour vide)', line, column: 'etat' })
                        }
                    } catch (err: any) {
                        results.push({ success: false, error: `Erreur commande: ${err?.message || err}`, line, column: 'etat' })
                    }

                }
            } catch (err: any) {
                const errorMsg = err?.message || err?.toString() || 'Erreur inconnue'
                results.push({ success: false, error: errorMsg, line, column: err?.column || 'Inconnue' })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length
        return results
    },

    /**
     * Import des images depuis un fichier ZIP.
     * Le nom de chaque fichier (sans extension) correspond à la référence du produit.
     * Ex: "T_01.png" → cherche le produit de référence "T_01" et lui associe l'image.
     */
    async importImagesZip(zipFile: File): Promise<ImageImportResult[]> {
        const results: ImageImportResult[] = []

        // ── Cache local pour éviter les appels API redondants ──
        const productCache = new Map<string, Product | null>()  // reference → Product | null

        const zip = await JSZip.loadAsync(zipFile)

        const entries = Object.entries(zip.files).filter(([_, f]) => !f.dir)

        for (const [path, file] of entries) {
            // Ignorer les fichiers cachés et métadonnées macOS
            const fileName = path.split('/').pop() || path
            if (fileName.startsWith('._') || fileName.startsWith('.') || path.startsWith('__MACOSX/')) {
                continue
            }

            // Extraire la référence = nom du fichier sans extension
            const refMatch = fileName.match(/^(.+)\.(png|jpe?g|gif|webp|bmp)$/i)
            if (!refMatch || !refMatch[1] || !refMatch[2]) {
                console.warn(`[importImagesZip] "${fileName}" ignoré (extension non supportée)`)
                results.push({ success: false, reference: '', fileName, error: 'Extension non supportée' })
                continue
            }

            const reference = refMatch[1]
            const ext = refMatch[2]
            try {
                // ── Trouver le produit par référence (cache) ──
                let product: Product | null | undefined = productCache.get(reference)
                if (product === undefined) {
                    const found = await ProductService.findByReference(reference)
                    product = found ?? null
                    productCache.set(reference, product)
                }
                if (!product) {
                    // Ignorer si référence produit non trouvée
                    console.warn(`[importImagesZip] Produit introuvable pour la référence "${reference}" (fichier: "${fileName}"). Ignoré.`)
                    continue
                }

                // Extraire les données binaires
                const blob = await file.async('blob')
                const imageFile = new File([blob], fileName, { type: `image/${ext.toLowerCase().replace('jpg', 'jpeg')}` })

                // Uploader l'image
                const imageId = await ImageApi.uploadImage(product.id, imageFile)
                if (imageId) {
                    results.push({ success: true, reference, productId: product.id, imageId, fileName })
                } else {
                    results.push({ success: false, reference, fileName, error: 'Upload réussi mais pas d\'ID retourné' })
                }
            } catch (err: any) {
                results.push({ success: false, reference, fileName, error: err?.message || err?.toString() })
            }
        }

        const ok = results.filter(r => r.success).length
        const ko = results.filter(r => !r.success).length
        return results
    }
}

function checkColumns(fileLabel: string, actualHeaders: string[] | undefined, expectedColumns: string[]): void {
    if (!actualHeaders || actualHeaders.length === 0) {
        throw new Error('Nom de colonne non conforme')
    }

    // Version insensible à la casse (active par défaut)
    const actual = actualHeaders.map(h => h.trim().toLowerCase())
    const expected = expectedColumns.map(c => c.toLowerCase())

    // Version sensible à la casse (commentée)
    // const actual = actualHeaders.map(h => h.trim())
    // const expected = expectedColumns.map(c => c.trim())

    const missing = expected.filter(c => !actual.includes(c))
    const extra = actual.filter(h => h && !expected.includes(h))

    if (missing.length > 0 || extra.length > 0) {
        const expectedList = expectedColumns.join(', ')
        const actualList = actualHeaders.join(', ')
        const reason = `Colonnes attendues : [${expectedList}]\nColonnes reçues : [${actualList}]`

        throw {
            message: reason,
            line: 'Entête',
            column: missing.length > 0 ? missing[0] : (extra.length > 0 ? extra[0] : 'Inconnue')
        }
    }
}

function validateDateDDMMYYYY(value: string, columnName: string = 'date'): void {
    // 1. Vérification stricte du format textuel via Regex
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        throw { message: 'Format de date invalide (JJ/MM/AAAA attendu)', column: columnName }
    }

    const parts = value.split('/').map(Number)
    const day = parts[0]
    const month = parts[1]
    const year = parts[2]

    // 2. Vérification de l'existence et du type des segments
    if (day === undefined || month === undefined || year === undefined) {
        throw { message: 'Date incomplète ou segment manquant', column: columnName }
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw { message: 'Contenu non numérique dans la date', column: columnName }
    }

    // 3. Blocage explicite du format US (MM/DD/YYYY)
    if (month > 12) {
        throw {
            message: `Mois invalide (${month}). Le mois doit être entre 01 et 12 (Format JJ/MM/AAAA requis).`,
            column: columnName
        }
    }

    if (day > 31 || day < 1) {
        throw { message: `Jour invalide (${day}). Le jour doit être entre 01 et 31.`, column: columnName }
    }

    // 4. Validation logique finale via l'objet Date
    // const date = new Date(year, month - 1, day)
    // const isValid = date.getFullYear() === year &&
    //     date.getMonth() === month - 1 &&
    //     date.getDate() === day

    // if (!isValid) {
    //     throw { message: `La date "${value}" n'existe pas dans le calendrier (ex: 31/04 ou 29/02 non bissextile)`, column: columnName }
    // }
}

function validatePositiveAmount(value: string, columnName: string): void {
    const numericValue = Number(String(value).replace(',', '.'))
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw { message: `Montant positif requis`, column: columnName }
    }
}

/** Parse la colonne "achat" au format [("ref";qty;"spec"), ...] */
interface AchatItem {
    reference: string
    quantity: number
    specificite: string
}

function parseAchatColumn(raw: string): AchatItem[] {
    if (!raw) return []

    // Format attendu : [("T_01";3;"ngoza"),("C_03";1;"")]
    // On enlève les crochets extérieurs
    const inner = raw.replace(/^\[|\]$/g, '').trim()
    if (!inner) return []

    const items: AchatItem[] = []

    // Regex pour capturer chaque tuple ("ref";qty;"spec")
    const tupleRegex = /\(([^)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = tupleRegex.exec(inner)) !== null) {
        const content = match[1] // ex: "T_01";3;"ngoza"
        if (!content) continue
        // Split par point-virgule en respectant les guillemets
        const parts = content.split(';').map(p => p.trim().replace(/^"|"$/g, ''))
        if (parts.length >= 2 && parts[0] && parts[1]) {
            items.push({
                reference: parts[0],
                quantity: parseInt(parts[1]) || 1,
                specificite: parts[2] || '',
            })
        }
    }

    return items
}



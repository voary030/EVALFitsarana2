<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useClientAuthStore } from '@/stores/clientAuth'
import { OrderService } from '@/service/orders/OrderService'
import { CartService } from '@/service/cart/CartService'
import { ProductService } from '@/service/product/ProductService'
import type { Product } from '@/types/product'
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { OrderStateChangeService } from '@/service/order_state_change/OrderStateChangeService'
import { AddressService } from '@/service/adresse/AddressService'

const clientAuth = useClientAuthStore()
const isLoading = ref(true)
const orders = ref<any[]>([])
const allCombinedItems = ref<any[]>([])
const totalOrders = ref(0)
const currentPage = ref(1)
const itemsPerPage = 8

const orderStatusMap: Record<number, { label: string; badgeClass: string }> = {
    1: { label: 'En attente du paiement par chèque', badgeClass: 'bg-warning text-dark' },
    2: { label: 'Paiement accepté', badgeClass: 'bg-info text-white' },
    3: { label: 'En cours de préparation', badgeClass: 'bg-info text-white' },
    4: { label: 'Expédié', badgeClass: 'bg-primary text-white' },
    5: { label: 'Livré', badgeClass: 'bg-success text-white' },
    6: { label: 'Annulé', badgeClass: 'bg-danger text-white' },
    7: { label: 'Remboursé', badgeClass: 'bg-secondary text-white' },
    8: { label: 'Erreur de paiement', badgeClass: 'bg-danger text-white' },
    9: { label: 'En attente de réapprovisionnement (payé)', badgeClass: 'bg-warning text-dark' },
    10: { label: 'En attente de virement bancaire', badgeClass: 'bg-warning text-dark' },
    11: { label: 'Paiement à distance accepté', badgeClass: 'bg-success text-white' },
    12: { label: 'En attente de réapprovisionnement (non payé)', badgeClass: 'bg-warning text-dark' },
    13: { label: 'En attente de paiement à la livraison', badgeClass: 'bg-warning text-dark' },
    14: { label: 'En attente de paiement', badgeClass: 'bg-warning text-dark' },
    15: { label: 'Remboursement partiel', badgeClass: 'bg-secondary text-white' },
    16: { label: 'Paiement partiel', badgeClass: 'bg-info text-white' },
    17: { label: 'Autorisation — À capturer', badgeClass: 'bg-info text-white' },
    [-99]: { label: 'Dans le panier', badgeClass: 'bg-secondary text-white opacity-75' },
}

const showDuplicationPanel = ref(false)
const duplicationMultiplier = ref(1)
const duplicationStep = ref(1)
const duplicationProducts = ref<any[]>([])
const isDuplicating = ref(false)

const prepareDuplication = async () => {
    if (!selectedOrder.value || !selectedOrder.value.order_rows) return
    isDuplicating.value = true
    try {
        const items = []
        for (const row of selectedOrder.value.order_rows) {
            const needed = row.product_quantity * duplicationMultiplier.value
            const stock = await StockAvailableService.getByProductId(row.product_id, row.product_attribute_id || 0)
            const available = stock ? Number(stock.quantity) : 0
            items.push({
                product_id: row.product_id,
                product_attribute_id: row.product_attribute_id,
                product_name: row.product_name,
                unit_price_tax_incl: row.unit_price_tax_incl,
                needed,
                available,
                ok: needed <= available
            })
        }
        duplicationProducts.value = items
        duplicationStep.value = 2
    } catch (err: any) {
        console.error('Erreur préparation duplication:', err)
        alert('Erreur lors de la vérification des stocks : ' + (err?.message || err))
    } finally {
        isDuplicating.value = false
    }
}

const executeDuplication = async () => {
    if (!selectedOrder.value || !clientAuth.client?.id) return

    const hasInsufficientStock = duplicationProducts.value.some(p => !p.ok)
    if (hasInsufficientStock) {
        alert("Impossible de dupliquer : certains produits n'ont pas un stock suffisant.")
        return
    }

    isDuplicating.value = true
    try {
        const customerId = Number(clientAuth.client.id)
        const addresses = await AddressService.getByCustomerId(customerId)
        const addressId = addresses?.[0]?.id
        if (!addressId) {
            throw new Error("Aucune adresse valide pour ce client. Creez une adresse avant de dupliquer la commande.")
        }

        // 1. Création du panier de duplication
        const duplicatedCart = await CartService.create({
            id_customer: customerId,
            id_currency: 1,
            id_lang: 1,
            id_address_delivery: addressId,
            id_address_invoice: addressId,
            id_carrier: 1,
            id_shop: 1
        })
        if (!duplicatedCart) {
            alert("Erreur lors de la création du panier de duplication.")
            return
        }

        // 2. Ajout des articles
        let cartWithItems = duplicatedCart
        for (const p of duplicationProducts.value) {
            const added = await CartService.addToCart({
                id_customer: customerId,
                id_address_delivery: addressId,
                id_address_invoice: addressId,
                id_product: p.product_id,
                id_product_attribute: p.product_attribute_id,
                quantity: p.needed,
                cartId: duplicatedCart.id
            })
            if (added) {
                cartWithItems = added
            }
        }

        // 3. Créer la commande
        const itemsToOrder = duplicationProducts.value.map((p: any) => ({
            id_product: p.product_id,
            id_product_attribute: p.product_attribute_id,
            priceTtc: p.unit_price_tax_incl,
            quantity: p.needed
        }))

        const newOrder = await OrderService.createOrderFromCart(
            cartWithItems,
            itemsToOrder,
            customerId,
            clientAuth.client.email || ''
        )


        if (newOrder) {
            await OrderStateChangeService.livrer(newOrder.id)
            alert("La commande a été dupliquée et livrée avec succès !")
            closeDetailModal()
            await fetchOrders()
        } else {
            alert("Erreur lors de la création de la commande.")
        }
    } catch (error: any) {
        console.error('Erreur duplication:', error)
        alert('Erreur lors de la duplication : ' + (error?.message || error))
    } finally {
        isDuplicating.value = false
    }
}


const selectedOrder = ref<any | null>(null)

const openDetailModal = (order: any) => {
    selectedOrder.value = order
}

const dupliquerCommande = (order: any) => {
    selectedOrder.value = order
    showDuplicationPanel.value = true
}

const closeDetailModal = () => {
    selectedOrder.value = null
    showDuplicationPanel.value = false
    duplicationMultiplier.value = 1
    duplicationStep.value = 1
    duplicationProducts.value = []
}

const resteAPayer = (order: any): number => {
    return order.total_products_wt - order.total_paid_real
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalOrders.value / itemsPerPage)))

const paginationPages = computed(() => {
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
})

const paginateItems = () => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    orders.value = allCombinedItems.value.slice(start, end)
}

const changePage = async (page: number) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    paginateItems()
}

const getStatusLabel = (status: number): string => {
    return orderStatusMap[status]?.label || `Statut ${status}`
}

const getStatusBadgeClass = (status: number): string => {
    return orderStatusMap[status]?.badgeClass || 'bg-secondary text-white'
}

const fetchOrders = async () => {
    isLoading.value = true
    try {
        if (clientAuth.client?.id) {
            // Récupérer toutes les commandes du client
            const allOrders = await OrderService.getByCustomerId(clientAuth.client.id)

            // Récupérer tous les paniers du client
            const customerCarts = await CartService.getByCustomerId(clientAuth.client.id)

            // Trouver les IDs des paniers déjà convertis en commandes
            const orderedCartIds = allOrders.map(o => Number(o.id_cart))

            // Filtrer les paniers non convertis
            const unconvertedCarts = customerCarts.filter(c => !orderedCartIds.includes(Number(c.id)))

            // Récolter les IDs de produits uniques dans les paniers non convertis
            const productIds = new Set<number>()
            unconvertedCarts.forEach(cart => {
                cart.cart_rows?.forEach(row => {
                    if (row.id_product && row.id_product > 0) {
                        productIds.add(row.id_product)
                    }
                })
            })

            // Récupérer les produits en parallèle
            const productsMap = new Map<number, Product>()
            if (productIds.size > 0) {
                const productPromises = Array.from(productIds).map(id => ProductService.getById(String(id)))
                const productResults = await Promise.all(productPromises)
                productResults.forEach(p => {
                    if (p) productsMap.set(p.id, p)
                })
            }

            // Convertir les paniers en commandes fictives
            const mockOrdersFromCarts = await Promise.all(unconvertedCarts.map(async (cart) => {
                let totalCartTtc = 0

                const orderRows = await Promise.all((cart.cart_rows || []).map(async (row) => {
                    const product = productsMap.get(row.id_product)
                    let priceTtc = product?.price || 0
                    try {
                        priceTtc = await ProductService.getPrixTtc(String(row.id_product), row.id_product_attribute)
                    } catch {
                        priceTtc = product?.price || 0
                    }

                    const rowTotal = priceTtc * row.quantity
                    totalCartTtc += rowTotal

                    return {
                        id: Number(`${cart.id}${row.id_product}${row.id_product_attribute}`),
                        product_id: row.id_product,
                        product_attribute_id: row.id_product_attribute,
                        product_name: product?.name || `Produit #${row.id_product}`,
                        product_reference: product?.reference || '',
                        unit_price_tax_incl: priceTtc,
                        product_quantity: row.quantity
                    }
                }))

                return {
                    id: cart.id,
                    id_cart: cart.id,
                    reference: `PANIER-${cart.id}`,
                    date_add: cart.date_add,
                    payment: 'Non finalisé',
                    id_carrier: cart.id_carrier,
                    total_paid_tax_incl: 0,
                    total_paid_tax_excl: 0,
                    total_paid_real: 0,
                    total_shipping_tax_incl: 0,
                    total_discounts_tax_incl: 0,
                    total_products_wt: totalCartTtc,
                    current_state: -99,
                    order_rows: orderRows,
                    isCart: true
                }
            }))

            // Combiner les deux listes
            const combined = [...mockOrdersFromCarts, ...allOrders]

            // Trier par date d'ajout décroissante
            combined.sort((a, b) => new Date(b.date_add).getTime() - new Date(a.date_add).getTime())

            allCombinedItems.value = combined
            totalOrders.value = combined.length
            paginateItems()
        }
    } catch (error) {
        console.error('Erreur lors du chargement des commandes et paniers:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchOrders)
</script>

<template>
    <div class="d-flex align-items-center mb-4">
        <div class="icon-box me-3">
            <i class="bi bi-box-seam-fill fs-4 text-primary"></i>
        </div>
        <h2 class="h4 mb-0 fw-bold">État de mes commandes</h2>
    </div>

    <!-- Squelettes de chargement -->
    <div v-if="isLoading" class="table-responsive">
        <table class="table table-hover align-middle">
            <thead>
                <tr>
                    <th class="ps-4">Commande</th>
                    <th>Date</th>
                    <th>Total à payer</th>
                    <th>Total payé</th>
                    <th>Reste à payer</th>
                    <th>Statut</th>
                    <th class="text-end pe-4">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="n in 3" :key="n">
                    <td class="ps-4" colspan="7">
                        <div class="skeleton-text bg-secondary opacity-10 rounded" style="height: 20px; width: 100%;">
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-else-if="orders.length > 0" class="table-responsive">
        <table class="table table-hover align-middle">
            <thead>
                <tr>
                    <th class="ps-4">Commande</th>
                    <th>Date</th>
                    <th>Total à payer</th>
                    <th>Total payé</th>
                    <th>Reste à payer</th>
                    <th>Statut</th>
                    <th class="text-end pe-4">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in orders" :key="order.id" class="order-row">
                    <td class="ps-4">
                        <span class="fw-bold">#{{ order.reference }}</span>
                    </td>
                    <td>
                        <span class="text-muted">{{ new Date(order.date_add).toLocaleDateString('fr-FR') }}</span>
                    </td>
                    <td>
                        <span class="fw-bold">{{ order.total_products_wt.toFixed(2) }} €</span>
                    </td>
                    <td>
                        <span class="fw-bold text-success">{{ order.total_paid_real.toFixed(2) }} €</span>
                    </td>
                    <td>
                        <span class="fw-bold" :class="resteAPayer(order) > 0 ? 'text-danger' : 'text-success'">
                            {{ resteAPayer(order).toFixed(2) }} €
                        </span>
                    </td>
                    <td>
                        <span class="badge rounded-pill px-3 py-2" :class="getStatusBadgeClass(order.current_state)">
                            {{ getStatusLabel(order.current_state) }}
                        </span>
                    </td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-outline-light rounded-3 me-1" @click="openDetailModal(order)">
                            <i class="bi bi-eye"></i>
                            Détails
                        </button>
                        <button class="btn btn-sm btn-outline-primary rounded-3" @click="dupliquerCommande(order)">
                            Dupliquer
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="d-flex justify-content-center align-items-center mt-4 gap-1">
            <button class="btn btn-sm btn-outline-light rounded-3 px-3" :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)">
                <i class="bi bi-chevron-left"></i>
            </button>
            <button v-for="page in paginationPages" :key="page" class="btn btn-sm rounded-3 px-3"
                :class="page === currentPage ? 'btn-primary' : 'btn-outline-light'" @click="changePage(page)">
                {{ page }}
            </button>
            <button class="btn btn-sm btn-outline-light rounded-3 px-3" :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)">
                <i class="bi bi-chevron-right"></i>
            </button>
        </div>
    </div>

    <!-- Modal Détail Commande -->
    <div v-if="selectedOrder" class="modal-backdrop fade show" @click="closeDetailModal"></div>
    <div v-if="selectedOrder" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title fw-bold">
                        <!-- <i :class="selectedOrder.isCart ? 'bi bi-cart3 text-info' : 'bi bi-bicycle text-primary'"
                            class="me-2"></i>
                        {{ selectedOrder.isCart ? 'Détail Panier' : 'Détail Commande' }} #{{ selectedOrder.reference }} -->
                    </h5>
                    <button type="button" class="btn-close btn-close-white" @click="closeDetailModal"></button>
                </div>
                <div class="modal-body">
                    <!-- Écran normal d'informations / Articles (Étape 1 ou non duplication) -->
                    <div v-if="!showDuplicationPanel || duplicationStep === 1">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="bi bi-info-circle me-2 text-primary"></i>Informations
                                </h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">{{ selectedOrder ? 'ID Panier' : 'ID Commande' }}</span>
                                    <span class="fw-bold">{{ selectedOrder.id }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Référence</span>
                                    <span class="fw-bold">{{ selectedOrder.reference }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Date</span>
                                    <span>{{ new Date(selectedOrder.date_add).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long', year: 'numeric'
                                    }) }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Paiement</span>
                                    <span>{{ selectedOrder.payment }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Transporteur</span>
                                    <span>ID: {{ selectedOrder.id_carrier }}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="bi bi-cash-stack me-2 text-success"></i>Montants
                                </h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Total payé (TTC)</span>
                                    <span class="fw-bold text-success">{{ selectedOrder.total_paid_tax_incl.toFixed(2)
                                    }}
                                        €</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Total payé (HT)</span>
                                    <span>{{ selectedOrder.total_paid_tax_excl.toFixed(2) }} €</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Montant réel payé</span>
                                    <span class="fw-bold text-primary">{{ selectedOrder.total_paid_real.toFixed(2) }}
                                        €</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Frais de port</span>
                                    <span>{{ selectedOrder.total_shipping_tax_incl > 0 ?
                                        selectedOrder.total_shipping_tax_incl.toFixed(2) + ' €' : 'Gratuit' }}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Réductions</span>
                                    <span class="text-danger">{{ selectedOrder.total_discounts_tax_incl > 0 ? '-' +
                                        selectedOrder.total_discounts_tax_incl.toFixed(2) + ' €' : '0,00 €' }}</span>
                                </div>
                                <hr class="border-secondary opacity-25 my-2">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-bold">Total à payer (TTC)</span>
                                    <span class="fw-bold">{{ selectedOrder.total_products_wt.toFixed(2) }} €</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-bold">Reste à payer</span>
                                    <span class="fw-bold"
                                        :class="resteAPayer(selectedOrder) > 0 ? 'text-danger' : 'text-success'">
                                        {{ resteAPayer(selectedOrder).toFixed(2) }} €
                                    </span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="fw-bold">Statut</span>
                                    <span class="badge rounded-pill px-3"
                                        :class="getStatusBadgeClass(selectedOrder.current_state)">
                                        {{ getStatusLabel(selectedOrder.current_state) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- Articles -->
                        <div v-if="selectedOrder.order_rows && selectedOrder.order_rows.length > 0" class="mt-4">
                            <h6 class="fw-bold mb-3">
                                <i class="bi bi-box me-2 text-warning"></i>
                                <!-- {{ selectedOrder.isCart ? 'Articles dans le panier' : 'Articles commandés' }} -->
                            </h6>
                            <div v-for="row in selectedOrder.order_rows" :key="row.id"
                                class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary-subtle">
                                <div>
                                    <span class="fw-bold">{{ row.product_name }}</span>
                                    <span v-if="row.product_reference" class="text-muted ms-2 small">(Réf: {{
                                        row.product_reference }})</span>
                                </div>
                                <div class="text-end">
                                    <span class="text-muted small">{{ row.unit_price_tax_incl.toFixed(2) }} € × {{
                                        row.product_quantity }}</span>
                                    <span class="fw-bold ms-3">{{ (row.unit_price_tax_incl *
                                        row.product_quantity).toFixed(2) }} €</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Écran de validation des stocks pour duplication (Étape 2) -->
                    <div v-else-if="showDuplicationPanel && duplicationStep === 2" class="mt-2">
                        <h6 class="fw-bold mb-3 text-info">
                            <i class="bi bi-shield-check me-2"></i>Validation des stocks pour duplication (x{{
                                duplicationMultiplier }})
                        </h6>
                        <div class="table-responsive rounded-3 border border-secondary-subtle">
                            <table class="table table-dark table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th class="ps-3 py-2 small">Produit</th>
                                        <th class="py-2 text-center small">Besoin</th>
                                        <th class="py-2 text-center small">Disponible</th>
                                        <th class="pe-3 py-2 text-end small">État</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="p in duplicationProducts"
                                        :key="p.product_id + '-' + p.product_attribute_id">
                                        <td class="ps-3 py-2 align-middle text-white fw-semibold small">
                                            {{ p.product_name }}
                                        </td>
                                        <td class="py-2 text-center align-middle small">
                                            {{ p.needed }}
                                        </td>
                                        <td class="py-2 text-center align-middle small text-muted">
                                            {{ p.available }}
                                        </td>
                                        <td class="pe-3 py-2 text-end align-middle">
                                            <span v-if="p.ok"
                                                class="badge bg-success border border-success rounded-pill px-2 py-1 small">
                                                Stock OK
                                            </span>
                                            <span v-else
                                                class="badge bg-danger border border-danger rounded-pill px-2 py-1 small">
                                                Insuffisant
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Message d'alerte global si stock insuffisant -->
                        <div v-if="duplicationProducts.some(p => !p.ok)"
                            class="alert alert-danger mt-3 mb-0 d-flex align-items-center py-2 px-3">
                            <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                            <span class="small">Stock insuffisant : certains articles n'ont pas le stock disponible
                                minimum requis. La duplication est bloquée.</span>
                        </div>
                        <div v-else class="alert alert-success mt-3 mb-0 d-flex align-items-center py-2 px-3">
                            <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                            <span class="small">Tous les articles sont disponibles en stock. Vous pouvez valider et
                                livrer la commande.</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-secondary flex-column align-items-stretch">
                    <!-- Si on n'est pas en train de dupliquer -->
                    <div v-if="!showDuplicationPanel" class="d-flex justify-content-end w-100">
                        <button class="btn btn-primary rounded-3 me-2" @click="showDuplicationPanel = true">
                            <i class="bi bi-files me-1"></i>Dupliquer
                        </button>
                        <button class="btn btn-secondary rounded-3" @click="closeDetailModal()">
                            <i class="bi bi-x-circle me-1"></i>Fermer
                        </button>
                    </div>

                    <!-- Étape 1 : Saisie du multiplicateur -->
                    <div v-else-if="showDuplicationPanel && duplicationStep === 1" class="w-100">
                        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <label class="text-white small mb-0">Multiplicateur :</label>
                                <input type="number" v-model.number="duplicationMultiplier"
                                    class="form-control form-control-sm bg-dark text-white border-secondary"
                                    style="width: 75px;" min="1" />
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-primary" :disabled="isDuplicating"
                                    @click="prepareDuplication">
                                    <span v-if="isDuplicating"
                                        class="spinner-border spinner-border-sm me-1"></span>Vérifier le stock
                                </button>
                                <button class="btn btn-sm btn-outline-secondary"
                                    @click="showDuplicationPanel = false">Annuler</button>
                            </div>
                        </div>
                    </div>

                    <!-- Étape 2 : Écran de validation et de confirmation de commande -->
                    <div v-else-if="showDuplicationPanel && duplicationStep === 2" class="w-100">
                        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-secondary" @click="duplicationStep = 1">
                                <i class="bi bi-arrow-left me-1"></i>Retour
                            </button>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-success"
                                    :disabled="isDuplicating || duplicationProducts.some(p => !p.ok)"
                                    @click="executeDuplication">
                                    <span v-if="isDuplicating"
                                        class="spinner-border spinner-border-sm me-1"></span>Confirmer et livrer
                                </button>
                                <button class="btn btn-sm btn-secondary" @click="closeDetailModal()">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div v-if="!isLoading && orders.length === 0" class="text-center py-5">
        <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
        <h3 class="text-muted mt-3">Aucune commande</h3>
        <p class="text-muted mb-4">Vous n'avez pas encore passé de commande.</p>
        <RouterLink to="/boutique/produit" class="btn btn-primary rounded-pill px-4">
            Découvrir nos produits
        </RouterLink>
    </div>

</template>

<style scoped>
@keyframes pulse {
    0% {
        opacity: 0.6;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        opacity: 0.6;
    }
}

.skeleton-text {
    animation: pulse 1.5s infinite ease-in-out;
}

.icon-box {
    width: 45px;
    height: 45px;
    background: rgba(var(--bs-primary-rgb), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.table {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.075);
}

.table thead th {
    background-color: rgba(var(--bs-emphasis-color-rgb), 0.03);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    padding-top: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(var(--bs-emphasis-color-rgb), 0.1);
}

.table tbody td {
    padding-top: 15px;
    padding-bottom: 15px;
}

.table-hover tbody tr:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.detail-row td {
    border-bottom: 2px solid rgba(var(--bs-primary-rgb), 0.15);
}

.order-row {
    transition: background-color 0.15s ease;
}

.modal-backdrop {
    z-index: 1040;
}

.modal {
    z-index: 1050;
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { OrderService } from '@/service/orders/OrderService'
import { OrderHistoryService } from '@/service/order_history/OrderHistoryService'
import { CustomerService } from '@/service/customer/CustomerService'
import type { Order } from '@/types/orders'
import type { OrderHistory } from '@/types/order_history'
import { OrderStateChangeService } from '@/service/order_state_change/OrderStateChangeService'

const isLoading = ref(true)
const orders = ref<Order[]>([])
const totalOrders = ref(0)
const currentPage = ref(1)
const itemsPerPage = 10
const updatingId = ref<number | null>(null)
const customerNames = ref<Record<number, string>>({})

const selectedOrder = ref<Order | null>(null)
const selectedOrderHistory = ref<OrderHistory[]>([])
const isHistoryLoading = ref(false)

const orderStatusMap: Record<number, { label: string; badgeClass: string }> = {
    1: { label: 'En attente du paiement par chèque', badgeClass: 'bg-warning text-dark' },
    2: { label: 'Paiement accepté', badgeClass: 'bg-info text-white' },
    3: { label: 'En cours de préparation', badgeClass: 'bg-info text-white' },
    4: { label: 'Expédié', badgeClass: 'bg-primary text-white' },
    5: { label: 'Livré', badgeClass: 'bg-primary text-white' },
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
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalOrders.value / itemsPerPage)))

const paginationPages = computed(() => {
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
})

const getStatusLabel = (status: number): string => {
    return orderStatusMap[status]?.label || `Statut ${status}`
}

const getStatusBadgeClass = (status: number): string => {
    return orderStatusMap[status]?.badgeClass || 'bg-secondary text-white'
}

const changePage = async (page: number) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    await fetchOrders()
}

const openDetailModal = async (order: Order) => {
    selectedOrder.value = order
    isHistoryLoading.value = true
    try {
        selectedOrderHistory.value = await OrderHistoryService.getByOrderId(order.id)
        selectedOrderHistory.value.sort((a, b) => new Date(b.date_add || '').getTime() - new Date(a.date_add || '').getTime())
    } catch (err) {
        console.error('Erreur chargement historique', err)
        selectedOrderHistory.value = []
    } finally {
        isHistoryLoading.value = false
    }
}

const closeDetailModal = () => {
    selectedOrder.value = null
    selectedOrderHistory.value = []
}

const resteAPayer = (order: Order): number => {
    return order.total_products_wt - order.total_paid_real
}

const annulerCommande = async (order: Order) => {

    if (order.current_state === 6) {
        alert("Cette commande est déjà annulée");
        return
    }

    if (order.current_state === 5) {
        alert("Une commande déjà livrée ne peut pas être annulée");
        return
    }

    if (updatingId.value) return
    updatingId.value = order.id
    try {
        await OrderStateChangeService.annuler(order.id)
        order.current_state = 6
    } catch (err: any) {
        alert('Erreur lors de l\'annulation de la commande : ' + (err?.message || err))
    } finally {
        updatingId.value = null
    }
}

const livrerCommande = async (order: Order) => {

    if (order.current_state === 6) {
        alert("Cette commande est annulée, elle ne peut pas être livrée");
        return
    }

    if (order.current_state === 5) {
        alert("Cette commande est déjà livrée");
        return
    }

    if (updatingId.value) return
    updatingId.value = order.id
    try {
        await OrderStateChangeService.livrer(order.id)
        order.current_state = 5
    } catch (err: any) {
        alert('Erreur lors de la livraison de la commande : ' + (err?.message || err))
    } finally {
        updatingId.value = null
    }
}

const fetchOrders = async () => {
    isLoading.value = true
    try {
        totalOrders.value = await OrderService.countAll()
        orders.value = await OrderService.getPaginated(currentPage.value, itemsPerPage)

        // Récupérer les noms des clients
        const newCustomerIds = new Set(orders.value.map(o => o.id_customer).filter(id => !customerNames.value[id]))
        for (const customerId of newCustomerIds) {
            const customer = await CustomerService.getById(customerId)
            if (customer) {
                customerNames.value[customerId] = `${customer.firstname} ${customer.lastname}`
            } else {
                customerNames.value[customerId] = 'Client inconnu'
            }
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchOrders)
</script>

<template>
    <div class="container-fluid py-4">
        <div class="d-flex align-items-center mb-4">
            <div class="icon-box me-3">
                <i class="bi bi-box-seam-fill fs-4 text-primary"></i>
            </div>
            <h2 class="h3 mb-0 fw-bold">Gestion des commandes</h2>
        </div>

        <!-- Squelettes -->
        <div v-if="isLoading" class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th class="ps-4">Référence</th>
                        <th>Client</th>
                        <th>Total TTC</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th class="text-end pe-4">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="n in 5" :key="n">
                        <td colspan="6" class="ps-4">
                            <div class="skeleton-text rounded" style="height: 20px; width: 100%;"></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else-if="orders.length > 0" class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th class="ps-4">Référence</th>
                        <th>Client</th>
                        <th>Total TTC</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th class="text-end pe-4">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orders" :key="order.id" class="order-row">
                        <td class="ps-4">
                            <span class="fw-bold">{{ order.reference || '#' + order.id }}</span>
                        </td>
                        <td>
                            <div class="fw-bold">{{ customerNames[order.id_customer] || 'Chargement...' }}</div>
                            <span class="text-muted x-small">#{{ order.id_customer }}</span>
                        </td>
                        <td>
                            <span class="fw-bold">{{ order.total_products_wt.toFixed(2) }} €</span>
                        </td>
                        <td>
                            <span class="text-muted">{{ new Date(order.date_add).toLocaleDateString('fr-FR') }}</span>
                        </td>
                        <td>
                            <span class="badge rounded-pill px-3 py-2"
                                :class="getStatusBadgeClass(order.current_state)">
                                {{ getStatusLabel(order.current_state) }}
                            </span>
                        </td>
                        <td class="text-end pe-4">
                            <div class="d-flex justify-content-end align-items-center gap-2">
                                <button class="btn btn-sm btn-outline-info rounded-3 px-3 action-btn"
                                    @click="openDetailModal(order)">
                                    <i class="bi bi-eye me-1"></i> Détails
                                </button>
                                <button class="btn btn-sm btn-outline-danger rounded-3 px-3 action-btn"
                                    @click="annulerCommande(order)" :disabled="updatingId === order.id">
                                    <i class="bi bi-x-circle me-1"></i> Annuler
                                </button>
                                <button class="btn btn-sm btn-outline-primary rounded-3 px-3 action-btn"
                                    @click="livrerCommande(order)" :disabled="updatingId === order.id">
                                    <i class="bi bi-check-circle me-1"></i> Livrer
                                </button>
                                <span v-if="updatingId === order.id"
                                    class="spinner-border spinner-border-sm text-primary" role="status"></span>
                            </div>
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

        <div v-else class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <h3 class="text-muted mt-3">Aucune commande</h3>
        </div>
    </div>

    <!-- Modal Détail Commande -->
    <div v-if="selectedOrder" class="modal-backdrop fade show" @click="closeDetailModal"></div>
    <div v-if="selectedOrder" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title fw-bold">
                        <i class="bi bi-bicycle text-primary me-2"></i>
                        Détail Commande #{{ selectedOrder.reference || selectedOrder.id }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" @click="closeDetailModal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <h6 class="fw-bold mb-3">
                                <i class="bi bi-info-circle me-2 text-primary"></i>Informations
                            </h6>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">ID Commande</span>
                                <span class="fw-bold">{{ selectedOrder.id }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Référence</span>
                                <span class="fw-bold">{{ selectedOrder.reference }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Client</span>
                                <span class="fw-bold text-info">{{ customerNames[selectedOrder.id_customer] || `#${selectedOrder.id_customer}` }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Date</span>
                                <span>{{ new Date(selectedOrder.date_add).toLocaleDateString('fr-FR', {
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
                                }) }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Paiement</span>
                                <span>{{ selectedOrder.payment }}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6 class="fw-bold mb-3">
                                <i class="bi bi-cash-stack me-2 text-success"></i>Montants
                            </h6>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Total payé (TTC)</span>
                                <span class="fw-bold text-success">{{ selectedOrder.total_paid_tax_incl.toFixed(2) }} €</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Montant réel payé</span>
                                <span class="fw-bold text-primary">{{ selectedOrder.total_paid_real.toFixed(2) }} €</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">Frais de port</span>
                                <span>{{ selectedOrder.total_shipping_tax_incl > 0 ? selectedOrder.total_shipping_tax_incl.toFixed(2) + ' €' : 'Gratuit' }}</span>
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
                            <div class="d-flex justify-content-between mt-3">
                                <span class="fw-bold">Statut Actuel</span>
                                <span class="badge rounded-pill px-3 py-2"
                                    :class="getStatusBadgeClass(selectedOrder.current_state)">
                                    {{ getStatusLabel(selectedOrder.current_state) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Historique des statuts -->
                    <div class="mt-4">
                        <h6 class="fw-bold mb-3">
                            <i class="bi bi-clock-history me-2 text-info"></i>Historique des statuts
                        </h6>
                        <div v-if="isHistoryLoading" class="text-center py-3">
                            <div class="spinner-border text-info spinner-border-sm" role="status"></div>
                            <span class="ms-2 text-muted small">Chargement de l'historique...</span>
                        </div>
                        <div v-else-if="selectedOrderHistory.length > 0" class="border border-secondary-subtle rounded-3 overflow-hidden">
                            <table class="table table-dark table-sm mb-0">
                                <thead>
                                    <tr class="text-secondary opacity-75">
                                        <th class="ps-3 py-2 fw-normal small">Date & Heure</th>
                                        <th class="py-2 fw-normal small">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(history, index) in selectedOrderHistory" :key="history.id || index" class="border-top border-secondary-subtle">
                                        <td class="ps-3 py-2 align-middle text-muted small">
                                            {{ history.date_add ? new Date(history.date_add).toLocaleString('fr-FR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            }) : 'Date inconnue' }}
                                        </td>
                                        <td class="py-2 align-middle">
                                            <span class="badge rounded-pill px-2 py-1" style="font-size: 0.75rem"
                                                :class="getStatusBadgeClass(history.id_order_state)">
                                                {{ getStatusLabel(history.id_order_state) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="text-muted small italic px-2">
                            Aucun historique trouvé.
                        </div>
                    </div>

                    <!-- Articles (si présents) -->
                    <div v-if="selectedOrder.order_rows && selectedOrder.order_rows.length > 0" class="mt-4">
                        <h6 class="fw-bold mb-3">
                            <i class="bi bi-box me-2 text-warning"></i>Articles commandés
                        </h6>
                        <div v-for="row in selectedOrder.order_rows" :key="row.id"
                            class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary-subtle">
                            <div>
                                <span class="fw-bold">{{ row.product_name || `Produit #${row.product_id}` }}</span>
                                <span v-if="row.product_reference" class="text-muted ms-2 small">(Réf: {{ row.product_reference }})</span>
                            </div>
                            <div class="text-end">
                                <span class="text-muted small">{{ row.unit_price_tax_incl.toFixed(2) }} € × {{ row.product_quantity }}</span>
                                <span class="fw-bold ms-3">{{ (row.unit_price_tax_incl * row.product_quantity).toFixed(2) }} €</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-secondary">
                    <button class="btn btn-secondary rounded-3" @click="closeDetailModal()">
                        <i class="bi bi-x-circle me-1"></i>Fermer
                    </button>
                </div>
            </div>
        </div>
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

.order-row {
    transition: background-color 0.15s ease;
}

.state-select {
    width: 180px;
    background-color: #2b2b2b;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    cursor: pointer;
}

.state-select:focus {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

.state-select option {
    background-color: #2b2b2b;
    color: #ffffff;
}
</style>

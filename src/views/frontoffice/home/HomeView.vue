<script setup lang="ts">
import { CustomerService } from '@/service/customer/CustomerService';
import type { Customer } from '@/types/customer';
import { onMounted, ref } from 'vue';
import { useClientAuthStore } from '@/stores/clientAuth';
import { useRouter } from 'vue-router';

const customers = ref<Customer[] | undefined>(undefined)
const clientAuth = useClientAuthStore()
const router = useRouter()

const fetchCustomer = async () => {
    try {
        customers.value = await CustomerService.getAll();
    } catch (error: any) {
        alert(error);
    }
}

const handleLogin = async (customer: Customer) => {
    await clientAuth.setClient({
        id: customer.id,
        email: customer.email,
        firstname: customer.firstname,
        lastname: customer.lastname,
        birthday: customer.birthday,
        newsletter: !!customer.newsletter
    }, 'dummy-token-' + customer.id)
    router.push('/boutique/produit')
}

const handleAnonymous = async () => {
    try {
        const anonymousCustomer = await CustomerService.getById(1)
        if (anonymousCustomer) {
            await handleLogin(anonymousCustomer)
        }
    } catch (error) {
        console.error('Erreur lors de la connexion anonyme:', error)
        // clientAuth.setAnonymous()
        router.push('/boutique/produit')
    }
}

onMounted(fetchCustomer)

</script>

<template>
    <!-- <div class="user-selection-card"> -->
    <div class="d-flex align-items-center mb-4">
        <div class="icon-box me-3">
            <i class="bi bi-people-fill fs-4 text-primary"></i>
        </div>
        <h2 class="h4 mb-0 fw-bold">Choisir un utilisateur</h2>
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle">
            <thead>
                <tr>
                    <th class="ps-4">ID</th>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th class="text-end pe-4">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="c in customers" :key="c.id" v-show="c.id != 1">
                    <td class="ps-4 fw-medium text-muted">#{{ c.id }}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm me-3">
                                {{ c.firstname[0] }}{{ c.lastname[0] }}
                            </div>
                            <span class="fw-bold">{{ c.firstname }} {{ c.lastname }}</span>
                        </div>
                    </td>
                    <td>{{ c.email }}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" @click="handleLogin(c)">
                            <i class="bi bi-box-arrow-in-right me-1"></i> Se connecter
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <br><br>
    <br><br>
    <br><br>
    <br><br>
    <div class="anonymous-section mt-5 text-center p-4 rounded-4 bg-body-tertiary border border-dashed">
        <p class="text-muted mb-3">Vous ne voulez pas vous identifier ?</p>
        <button class="btn btn-outline-secondary rounded-pill px-4 shadow-sm" @click="handleAnonymous">
            <i class="bi bi-incognito me-2"></i> Continuer en tant qu'Anonyme
        </button>
    </div>
    <!-- </div> -->
</template>

<style scoped>
.icon-box {
    width: 45px;
    height: 45px;
    background: rgba(var(--bs-primary-rgb), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.avatar-sm {
    width: 35px;
    height: 35px;
    background: linear-gradient(135deg, var(--bs-primary));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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

.anonymous-section {
    border-style: dashed !important;
    border-color: rgba(var(--bs-emphasis-color-rgb), 0.2) !important;
}

.btn-primary {
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb), 0.4) !important;
}

/* Adaptation spécifique pour le texte muet en mode sombre */
[data-bs-theme="dark"] .text-muted {
    color: #a1a1aa !important;
}
</style>
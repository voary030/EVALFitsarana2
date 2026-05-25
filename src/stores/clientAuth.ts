import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CartService } from '@/service/cart/CartService'
import { OrderService } from '@/service/orders/OrderService'

interface Client {
    id: number
    email: string
    firstname: string
    lastname: string
    birthday?: string
    newsletter?: boolean
}

export const useClientAuthStore = defineStore('clientAuth', () => {
    const client = ref<Client | null>(JSON.parse(localStorage.getItem('client') || 'null'))
    const token = ref<string | null>(localStorage.getItem('client_token'))
    const isAnonymous = ref<boolean>(localStorage.getItem('is_anonymous') === 'true')

    const isAuthenticated = computed(() => !!client.value && !!token.value)

    const clientInitials = computed(() => {
        if (isAnonymous.value) return '?'
        if (!client.value) return 'CU'
        return `${client.value.firstname[0]}${client.value.lastname[0]}`.toUpperCase()
    })

    async function setClient(newClient: Client, newToken: string) {
        client.value = newClient
        token.value = newToken
        isAnonymous.value = false
        localStorage.setItem('client', JSON.stringify(newClient))
        localStorage.setItem('client_token', newToken)
        localStorage.removeItem('is_anonymous')

        if (newClient.id !== 1) {
            try {
                const latestCart = await CartService.findLatestActiveCart(newClient.id)
                if (latestCart) {
                    localStorage.setItem('current_cart_id', String(latestCart.id))
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du panier au login:', error)
            }
        }
    }

    function setAnonymous() {
        client.value = null
        token.value = null
        isAnonymous.value = true
        localStorage.setItem('is_anonymous', 'true')
    }

    function logout() {
        client.value = null
        token.value = null
        isAnonymous.value = false
        localStorage.removeItem('client')
        localStorage.removeItem('client_token')
        localStorage.removeItem('is_anonymous')
        localStorage.removeItem('current_cart_id')
    }

    async function fetchProfile() {
        if (!token.value) return
    }

    return {
        client,
        token,
        isAnonymous,
        isAuthenticated,
        clientInitials,
        setClient,
        setAnonymous,
        logout,
        fetchProfile
    }
})

import apiClient from '@/api/client'

export const OrdersApi = {
    async create(xmlBody: string): Promise<string> {
        try {
            const response = await apiClient.post('/orders', xmlBody)
            return response.data as string
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error)
            throw error
        }
    },

    async update(id: number, xmlBody: string): Promise<string> {
        try {
            const response = await apiClient.put(`/orders/${id}`, xmlBody)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la commande ${id}:`, error)
            throw error
        }
    },

    async patch(id: number, xmlBody: string): Promise<string> {
        try {
            const response = await apiClient.patch(`/orders/${id}`, xmlBody)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors du patch de la commande ${id}:`, error)
            throw error
        }
    },

    async getByCustomerId(customerId: number): Promise<string> {
        try {
            const response = await apiClient.get(`/orders?filter[id_customer]=${customerId}&display=full&sort=[id_DESC]`)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors de la récupération des commandes du client ${customerId}:`, error)
            throw error
        }
    },

    async getByCustomerIdPaginated(customerId: number, page: number, limit: number): Promise<string> {
        try {
            const response = await apiClient.get(`/orders?filter[id_customer]=${customerId}&display=full&sort=[id_DESC]&limit=${(page - 1) * limit},${limit}`)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors de la récupération paginée des commandes du client ${customerId}:`, error)
            throw error
        }
    },

    async countByCustomerId(customerId: number): Promise<number> {
        try {
            const response = await apiClient.get(`/orders?filter[id_customer]=${customerId}&display=[id]`)
            const xml = response.data as string
            const matchCount = (xml.match(/<order>/g) || []).length
            return matchCount
        } catch (error) {
            console.error(`Erreur lors du comptage des commandes du client ${customerId}:`, error)
            return 0
        }
    },

    async getById(id: number): Promise<string> {
        try {
            const response = await apiClient.get(`/orders/${id}`)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors de la récupération de la commande ${id}:`, error)
            throw error
        }
    },

    async getAll(): Promise<string> {
        try {
            const response = await apiClient.get('/orders?display=full&sort=[id_DESC]')
            return response.data as string
        } catch (error) {
            console.error('Erreur lors de la récupération de toutes les commandes:', error)
            throw error
        }
    },

    async getPaginated(page: number, limit: number): Promise<string> {
        try {
            const response = await apiClient.get(`/orders?display=full&sort=[id_DESC]&limit=${(page - 1) * limit},${limit}`)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors de la récupération paginée des commandes:`, error)
            throw error
        }
    },

    async countAll(): Promise<number> {
        try {
            const response = await apiClient.get(`/orders?display=[id]`)
            const xml = response.data as string
            const matchCount = (xml.match(/<order>/g) || []).length
            return matchCount
        } catch (error) {
            console.error(`Erreur lors du comptage de toutes les commandes:`, error)
            return 0
        }
    },

    async getByDateRange(dateFrom: string, dateTo: string): Promise<string> {
        try {
            const dateFromEncoded = encodeURIComponent(dateFrom)
            const dateToEncoded = encodeURIComponent(dateTo)
            const url = `/orders?display=full&sort=[id_DESC]&filter[date_add]=[${dateFromEncoded},${dateToEncoded}]&date=1`
            const response = await apiClient.get(url)
            return response.data as string
        } catch (error) {
            console.error(`Erreur getByDateRange ${dateFrom} → ${dateTo}:`, error)
            throw error
        }
    }
}

import apiClient from '@/api/client'

export const OrderHistoryApi = {
    async create(xmlBody: string): Promise<string> {
        try {
            const response = await apiClient.post('/order_histories', xmlBody)
            return response.data as string
        } catch (error) {
            console.error('Erreur lors de la création de l\'historique de commande:', error)
            throw error
        }
    },

    async patch(id: number, xmlBody: string): Promise<string> {
        try {
            const response = await apiClient.patch(`/order_histories/${id}`, xmlBody)
            return response.data as string
        } catch (error) {
            console.error(`Erreur lors du patch de l'order_history ${id}:`, error)
            throw error
        }
    },

    async getByOrderId(orderId: number): Promise<string> {
        try {
            const response = await apiClient.get(`/order_histories?display=full&filter[id_order]=${orderId}&sort=[id_DESC]`)
            return response.data as string
        } catch (error) {
            console.error(`Erreur récupération order_histories pour commande ${orderId}:`, error)
            throw error
        }
    }
}

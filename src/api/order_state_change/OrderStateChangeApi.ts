import apiClient from '@/api/client'

export const OrderStateChangeApi = {
    async create(xmlBody: string): Promise<string> {
        // console.log('[OrderStateChangeApi] POST /order_state_changes payload:', xmlBody)
        try {
            const response = await apiClient.post('/order_state_changes', xmlBody)
            // console.log('[OrderStateChangeApi] POST /order_state_changes response:', response.data)
            return response.data as string
        } catch (error: any) {
            // console.error('[OrderStateChangeApi] POST /order_state_changes FAILED:', {
            //     status: error?.response?.status,
            //     data: error?.response?.data,
            //     message: error?.message || error
            // })
            throw error
        }
    },

    async getByOrderId(orderId: number): Promise<string> {
        // console.log('[OrderStateChangeApi] GET /order_state_changes for order:', orderId)
        try {
            const response = await apiClient.get(`/order_state_changes?display=full&filter[id_order]=${orderId}&sort=[id_DESC]`)
            // console.log('[OrderStateChangeApi] GET /order_state_changes response:', response.data)
            return response.data as string
        } catch (error: any) {
            // console.error('[OrderStateChangeApi] GET /order_state_changes FAILED:', {
            //     status: error?.response?.status,
            //     data: error?.response?.data,
            //     message: error?.message || error
            // })
            throw error
        }
    }
}

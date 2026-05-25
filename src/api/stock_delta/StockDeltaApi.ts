import apiClient from '@/api/client'

export const StockDeltaApi = {
    async getAll(): Promise<string> {
        const response = await apiClient.get('/stock_deltas?display=full')
        return response.data as string
    },

    async create(xmlBody: string): Promise<string> {
        const response = await apiClient.post('/stock_deltas', xmlBody)
        return response.data as string
    }
}

import apiClient from '@/api/client'

export const StockMvtApi = {
    async getAll(): Promise<string> {
        const response = await apiClient.get('/stock_movements?display=full')
        return response.data as string
    },

    async getById(id: string | number): Promise<string> {
        const response = await apiClient.get(`/stock_movements/${id}`)
        return response.data as string
    },

    async create(xmlBody: string): Promise<string> {
        const response = await apiClient.post('/stock_movements', xmlBody)
        return response.data as string
    },

    async update(id: string | number, xmlBody: string): Promise<string> {
        const response = await apiClient.put(`/stock_movements/${id}`, xmlBody)
        return response.data as string
    },

    async patch(id: string | number, xmlBody: string): Promise<string> {
        const response = await apiClient.patch(`/stock_movements/${id}`, xmlBody)
        return response.data as string
    },

    async delete(id: string | number): Promise<string> {
        const response = await apiClient.delete(`/stock_movements/${id}`)
        return response.data as string
    },

    async getByStockId(stockId: number | string): Promise<string> {
        const response = await apiClient.get(`/stock_movements?display=full&filter[id_stock]=[${stockId}]`)
        return response.data as string
    }
}

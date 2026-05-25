import apiClient from '@/api/client'

export const StockAvailableApi = {
    async getByProductId(productId: number, productAttributeId: number = 0): Promise<string> {
        const url = `/stock_availables?display=full&filter[id_product]=${productId}&filter[id_product_attribute]=${productAttributeId}`
        const response = await apiClient.get(url)
        return response.data as string
    },

    async getAll(): Promise<string> {
        const response = await apiClient.get('/stock_availables?display=full')
        return response.data as string
    },

    async update(id: number, xmlBody: string): Promise<string> {
        const response = await apiClient.put(`/stock_availables/${id}`, xmlBody)
        return response.data as string
    }
}

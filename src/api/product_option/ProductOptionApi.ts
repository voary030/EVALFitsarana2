import apiClient from '../client'

export const ProductOptionApi = {
    async getAll() {
        const response = await apiClient.get('/product_options?display=full')
        return response.data
    },

    async getById(id: string | number) {
        const response = await apiClient.get(`/product_options/${id}`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/product_options', xmlBody)
        return response.data
    },

    async update(id: string | number, xmlBody: string) {
        const response = await apiClient.put(`/product_options/${id}`, xmlBody)
        return response.data
    },

    async delete(id: string | number) {
        const response = await apiClient.delete(`/product_options/${id}`)
        return response.data
    }
}

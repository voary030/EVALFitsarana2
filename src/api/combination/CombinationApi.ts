import apiClient from '../client'

export const CombinationApi = {
    async getAll() {
        const response = await apiClient.get('/combinations?display=full')
        return response.data
    },

    async getById(id: string | number) {
        const response = await apiClient.get(`/combinations/${id}`)
        return response.data
    },

    async getByProductId(productId: string | number) {
        const response = await apiClient.get(`/combinations?display=full&filter[id_product]=${productId}`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/combinations', xmlBody)
        return response.data
    },

    async update(id: string | number, xmlBody: string) {
        const response = await apiClient.put(`/combinations/${id}`, xmlBody)
        return response.data
    },

    async patch(id: string | number, xmlBody: string) {
        const response = await apiClient.patch(`/combinations/${id}`, xmlBody)
        return response.data
    },

    async delete(id: string | number) {
        const response = await apiClient.delete(`/combinations/${id}`)
        return response.data
    }
}
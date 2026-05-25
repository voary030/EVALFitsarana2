import apiClient from '../client'

export const CartApi = {
    async getAll() {
        const response = await apiClient.get('/carts?display=full')
        return response.data
    },

    async getById(id: string | number) {
        const response = await apiClient.get(`/carts/${id}?display=full`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/carts', xmlBody)
        return response.data
    },

    async update(id: string | number, xmlBody: string) {
        const response = await apiClient.put(`/carts/${id}`, xmlBody)
        return response.data
    },

    async patch(id: string | number, xmlBody: string) {
        const response = await apiClient.patch(`/carts/${id}`, xmlBody)
        return response.data
    },

    async delete(id: string | number) {
        const response = await apiClient.delete(`/carts/${id}`)
        return response.data
    }
}

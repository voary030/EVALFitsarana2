import apiClient from '../client'

const ressources = 'customers';

export const CustomerApi = {

    async getAll() {
        const response = await apiClient.get(`/${ressources}?display=full`)
        return response.data
    },

    async getById(id: string | number) {
        const response = await apiClient.get(`/${ressources}/${id}`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post(`/${ressources}`, xmlBody)
        return response.data
    },

    async update(id: string | number, xmlBody: string) {
        const response = await apiClient.put(`/${ressources}/${id}`, xmlBody)
        return response.data
    },

    async getByEmail(email: string) {
        const response = await apiClient.get(`/${ressources}?filter[email]=${encodeURIComponent(email)}&display=full`)
        return response.data
    },

    async delete(id: string | number) {
        const response = await apiClient.delete(`/${ressources}/${id}`)
        return response.data
    }
}
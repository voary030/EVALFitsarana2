import apiClient from '@/api/client'

const ressource = 'addresses'

export const AddressApi = {
    async getAll(): Promise<string> {
        const response = await apiClient.get(`/${ressource}?display=full`)
        return response.data as string
    },

    async getById(id: string | number): Promise<string> {
        const response = await apiClient.get(`/${ressource}/${id}`)
        return response.data as string
    },

    async create(xmlBody: string): Promise<string> {
        const response = await apiClient.post(`/${ressource}`, xmlBody)
        return response.data as string
    },

    async update(id: string | number, xmlBody: string): Promise<string> {
        const response = await apiClient.put(`/${ressource}/${id}`, xmlBody)
        return response.data as string
    },

    async getByCustomerId(customerId: number): Promise<string> {
        const response = await apiClient.get(`/${ressource}?filter[id_customer]=${customerId}&display=full`)
        return response.data as string
    },

    async delete(id: string | number): Promise<string> {
        const response = await apiClient.delete(`/${ressource}/${id}`)
        return response.data as string
    }
}

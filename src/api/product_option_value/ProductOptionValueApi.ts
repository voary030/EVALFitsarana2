import apiClient from '../client'

export const ProductOptionValueApi = {
    async getAll() {
        const response = await apiClient.get('/product_option_values?display=full')
        return response.data
    },

    async getByColonne(column: string, value: string) {
        const response = await apiClient.get(
            `/product_option_values?filter[${column}]=[${encodeURIComponent(value)}]&display=full`
        )
        return response.data
    },

    async getById(id: string | number) {
        const response = await apiClient.get(`/product_option_values/${id}`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/product_option_values', xmlBody)
        return response.data
    },

    async update(id: string | number, xmlBody: string) {
        const response = await apiClient.put(`/product_option_values/${id}`, xmlBody)
        return response.data
    },

    async getByName(name: string) {
        return this.getByColonne('name', name)
    },

    async delete(id: string | number) {
        const response = await apiClient.delete(`/product_option_values/${id}`)
        return response.data
    }
}

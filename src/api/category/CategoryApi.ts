import apiClient from '../client'

export const CategoryApi = {

    async getAll() {
        const response = await apiClient.get(`/categories?display=full&sort=[id_ASC]`)
        return response.data
    },

    async getById(id: string) {
        const response = await apiClient.get(`/categories/${id}`)
        return response.data
    },

    async getByName(name: string) {
        const response = await apiClient.get(`/categories/`, {
            params: {
                display: 'full',
                'filter[name]': name,
            }
        })
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/categories', xmlBody)
        return response.data
    },

    async update(id: string, xmlBody: string) {
        const response = await apiClient.put(`/ categories / ${id}`, xmlBody)
        return response.data
    },

    async patch(id: string, xmlBody: string) {
        const response = await apiClient.patch(`/ categories / ${id}`, xmlBody)
        return response.data
    },

    async delete(id: string) {
        const response = await apiClient.delete(`/ categories / ${id}`)
        return response.data
    },

    async deleteMultiple(ids: string[]) {
        if (ids.length !== 2) {
            throw new Error(`Erreur: Exactement 2 IDs requis, ${ids.length} reçu(s)`)
        }
        const response = await apiClient.delete(`/ categories / [${ids[0]}, ${ids[1]}]`)
        return response.data
    }
}

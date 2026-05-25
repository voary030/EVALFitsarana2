import apiClient from '../client'

export interface ProductFilters {
    name?: string
    category?: string
    priceMin?: number
    priceMax?: number
}

export const ProductApi = {

    async getAll() {
        const response = await apiClient.get('/products?display=full&sort=[id_ASC]')
        return response.data
    },

    async countAll() {
        const response = await apiClient.get('/products?display=[id]')
        return response.data
    },

    async getAllDynamique(page: number, nombre = 8, filters?: ProductFilters) {
        const offset = (page - 1) * nombre
        let url = `/products?display=full&limit=${offset},${nombre}&sort=[id_DESC]`

        if (filters) {
            // Filtre par nom
            if (filters.name && filters.name.trim()) {
                url += `&filter[name]=%[${encodeURIComponent(filters.name.trim())}]%`
            }

            // Filtre par catégorie
            if (filters.category && filters.category.trim()) {
                url += `&filter[id_category_default]=[${filters.category}]`
            }
        }

        const response = await apiClient.get(url)
        return response.data
    },

    async getById(id: string) {
        const response = await apiClient.get(`/products/${id}`)
        return response.data
    },

    async getByReference(reference: string) {
        const response = await apiClient.get(`/products?display=full&filter[reference]=[${encodeURIComponent(reference)}]`)
        return response.data
    },

    async getByIdCategory(categoryId: number | string) {
        const response = await apiClient.get(`/products?display=full&filter[id_category_default]=[${categoryId}]`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post('/products', xmlBody)
        return response.data
    },

    async update(id: string, xmlBody: string) {
        const response = await apiClient.put(`/products/${id}`, xmlBody)
        return response.data
    },

    async patch(id: string, xmlBody: string) {
        const response = await apiClient.patch(`/products/${id}`, xmlBody)
        return response.data
    },

    async delete(id: string) {
        const response = await apiClient.delete(`/products/${id}`)
        return response.data
    },
}

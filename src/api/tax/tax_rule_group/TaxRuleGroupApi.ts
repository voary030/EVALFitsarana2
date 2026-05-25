import apiClient from '../../client'

const RESSSOURCES = 'tax_rule_groups';

export const TaxRuleGroupApi = {

    async getAll() {
        const response = await apiClient.get(`/${RESSSOURCES}?display=full&sort=[id_ASC]`)
        return response.data
    },

    async getById(id: string) {
        const response = await apiClient.get(`/${RESSSOURCES}/${id}`)
        return response.data
    },

    async create(xmlBody: string) {
        const response = await apiClient.post(`/${RESSSOURCES}`, xmlBody.trim())
        return response.data
    },

    async update(id: string, xmlBody: string) {
        const response = await apiClient.put(`/${RESSSOURCES}/${id}`, xmlBody)
        return response.data
    },

    async patch(id: string, xmlBody: string) {
        const response = await apiClient.patch(`/${RESSSOURCES}/${id}`, xmlBody)
        return response.data
    },

    async delete(id: string) {
        const response = await apiClient.delete(`/${RESSSOURCES}/${id}`)
        return response.data
    },

    async deleteMultiple(ids: string[]) {
        if (ids.length !== 2) {
            throw new Error(`Erreur: Exactement 2 IDs requis, ${ids.length} reçu(s)`)
        }
        const response = await apiClient.delete(`/${RESSSOURCES}/[${ids[0]},${ids[1]}]`)
        return response.data
    }
}

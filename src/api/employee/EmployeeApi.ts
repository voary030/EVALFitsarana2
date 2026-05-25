import apiClient from '../client'

export const EmployeeApi = {
    async getByEmail(email: string) {
        const response = await apiClient.get('/employees', {
            params: {
                display: 'full',
                'filter[email]': email,
            },
        })
        return response.data
    },
}

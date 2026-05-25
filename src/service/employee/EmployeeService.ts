import { EmployeeApi } from '@/api/employee/EmployeeApi'
import { parseEmployeeListXml } from '@/mappers/employee'
import type { Employee } from '@/types/employee'
import bcryptjs from 'bcryptjs'

export const EmployeeService = {

    async login(email: string, password: string): Promise<Employee | null> {
        try {
            const xml = await EmployeeApi.getByEmail(email)
            const employees = parseEmployeeListXml(xml)
            if (employees.length === 0) {
                console.error('Employé non trouvé')
                return null
            }
            const employee = employees[0]
            if (!employee) {
                console.error('Employé non trouvé')
                return null
            }
            if (employee.active === 0) {
                console.error('Employé inactif')
                return null
            }

            const passwordMatch = await bcryptjs.compare(password, employee.passwd)

            if (!passwordMatch) {
                console.error('Mot de passe incorrect')
                return null
            }

            return employee
        } catch (error) {
            console.error('Erreur lors de la connexion:', error)
            return null
        }
    },

}

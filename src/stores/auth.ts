import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
    id: number
    email: string
    password: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const isAuthenticated = computed(() => user.value !== null)

    const login = (credentials: User) => {
        user.value = credentials
        localStorage.setItem('user', JSON.stringify(credentials))
    }

    const logout = () => {
        user.value = null
        localStorage.removeItem('user')
    }

    const initializeAuth = () => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            user.value = JSON.parse(storedUser)
        }
    }

    return {
        user,
        isAuthenticated,
        login,
        logout,
        initializeAuth,
    }
})

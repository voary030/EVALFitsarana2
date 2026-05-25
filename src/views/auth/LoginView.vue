<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { EmployeeService } from '@/service/employee/EmployeeService'
import AppSpinner from '@/components/spinner/AppSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('itu@gmail.com')
const password = ref('andreas3248**')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
        const employee = await EmployeeService.login(email.value, password.value)
        if (employee) {
            authStore.login({ id: employee.id, email: employee.email, password: password.value })
            isLoading.value = false
            router.push('/')
        } else {
            isLoading.value = false
            errorMessage.value = 'Email ou mot de passe incorrect'
        }
    } catch (error) {
        isLoading.value = false
        errorMessage.value = 'Une erreur est survenue lors de la connexion'
        console.error('Erreur de connexion:', error)
    }
}

</script>

<template>
    <div class="login-card shadow-sm bg-body-tertiary border">
        <div class="text-center mb-4">
            <h2 class="fw-bold text-uppercase h4 mb-1">
                <span class="text-primary">Vue</span>Shop
            </h2>
        </div>

        <form @submit.prevent="handleLogin">
            <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                {{ errorMessage }}
                <button type="button" class="btn-close" @click="errorMessage = ''"></button>
            </div>

            <div class="mb-3">
                <label for="email" class="form-label small fw-semibold">Adresse Email</label>
                <input v-model="email" type="email" class="form-control form-control-lg bg-body shadow-none" id="email"
                    placeholder="nom@exemple.com" required>
            </div>

            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label for="password" class="form-label small fw-semibold mb-0">Mot de passe</label>
                    <a href="#" class="text-primary small text-decoration-none">Oublié ?</a>
                </div>
                <input v-model="password" type="password" class="form-control form-control-lg bg-body shadow-none"
                    id="password" placeholder="••••••••" required>
            </div>

            <div class="mb-4 form-check">
                <input type="checkbox" class="form-check-input shadow-none" id="remember">
                <label class="form-check-label small text-muted" for="remember">Se souvenir de moi</label>
            </div>

            <button type="submit"
                class="btn btn-primary btn-lg w-100 shadow-sm fw-bold d-flex align-items-center justify-content-center"
                :disabled="isLoading">
                <AppSpinner v-if="isLoading" size="sm" color="light" class="me-2" />
                <span>{{ isLoading ? '' : 'Se connecter' }}</span>
            </button>

            <div class="text-center mt-4">
                <p class="small text-muted mb-0">
                    Pas encore de compte ?
                    <a href="#" class="text-primary fw-semibold text-decoration-none">Créer un compte</a>
                </p>
            </div>
        </form>
    </div>
</template>

<style scoped>
.login-card {
    width: 100%;
    padding: 2rem;
    border-radius: 12px;
}

h2 {
    letter-spacing: -0.5px;
}
</style>

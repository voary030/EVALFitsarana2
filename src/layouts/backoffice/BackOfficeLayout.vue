<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BackSidebar from './fragments/BackSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
    authStore.logout()
    router.push('/login')
}
</script>

<template>
    <div class="d-flex min-vh-100 bg-body">
        <BackSidebar />

        <div class="flex-grow-1 d-flex flex-column" style="height: 100vh;">
            <header
                class="bg-body-tertiary border-bottom px-4 d-flex justify-content-between align-items-center shadow-sm"
                style="height: 70px;">
                <div class="mb-0 fw-semibold"></div>
                <div class="d-flex align-items-center gap-3">
                    <RouterLink class="btn btn-outline-secondary btn-sm" to="/boutique">Voir la boutique</RouterLink>

                    <div class="dropdown">
                        <a href="#" class="d-flex align-items-center text-body text-decoration-none dropdown-toggle"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-circle fs-4"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow">
                            <li><a class="dropdown-item d-flex align-items-center gap-2" href="#"><i
                                        class="bi bi-person"></i> Profil</a></li>
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li>
                                <button
                                    class="dropdown-item text-danger d-flex align-items-center gap-2 border-0 bg-transparent w-100 text-start"
                                    @click="handleLogout"><i class="bi bi-box-arrow-right"></i> Déconnexion</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

            <main class="p-4 overflow-auto flex-grow-1 bg-body">
                <div class="container-fluid bg-body-tertiary border rounded p-4 shadow-sm" style="min-height: 100%;">
                    <slot></slot>
                </div>
            </main>
        </div>
    </div>
</template>
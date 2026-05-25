<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppChevron from '@/components/chevron/AppChevron.vue'

const route = useRoute()

interface MenuItem {
    title: string
    route?: string
    icon?: string
    children?: MenuItem[]
}

const menuItems = ref<(MenuItem & { isOpen?: boolean })[]>([
    {
        title: 'Tableau de bord',
        route: '/',
        icon: 'bi-speedometer2'
    },
    {
        title: 'Commandes',
        route: '/commandes',
        icon: 'bi-cart'
    },
    {
        title: 'Statistiques',
        route: '/statistiques',
        icon: 'bi-bar-chart-line'
    },
    {
        title: 'Stock',
        icon: 'bi-box-seam',
        children: [
            {
                title: 'Gestion des stocks',
                route: '/stocks',
                icon: 'bi-boxes'
            },
            {
                title: 'Évolution journalière',
                route: '/stocks/evolution',
                icon: 'bi-graph-up'
            },
            {
                title: 'Réservations par catégorie',
                route: '/stocks/reservation',
                icon: 'bi-journal-check'
            }
        ]
    },
    {
        title: 'Paramètres avancés',
        icon: 'bi-gear',
        children: [
            {
                title: 'Import de données',
                route: '/import',
                icon: 'bi-cloud-upload'
            },
            {
                title: 'Réinitialisation',
                route: '/reset',
                icon: 'bi-arrow-clockwise'
            }
        ]
    }
])

const isActive = (itemRoute?: string) => {
    if (!itemRoute) return false
    return route.path === itemRoute
}

const isChildActive = (children?: MenuItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.route))
}

const toggleMenu = (item: any) => {
    item.isOpen = !item.isOpen
}
</script>

<template>
    <nav class="d-flex flex-column flex-shrink-0 bg-body-tertiary border-end min-vh-100" style="width: 250px;">
        <div class="d-flex align-items-center px-4" style="height: 70px;">
            <RouterLink to="/" class="text-decoration-none w-100 text-center">
                <h2 class="fw-bold text-uppercase h4 mb-0 text-white">
                    <span class="text-primary">Vue</span>Shop
                </h2>
            </RouterLink>
        </div>
        <hr class="m-0">
        <div class="p-3 d-flex flex-column flex-grow-1 overflow-auto">
            <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item mb-1" v-for="(item, index) in menuItems" :key="index">

                    <RouterLink v-if="!item.children" :to="item.route!"
                        class="nav-link text-light d-flex align-items-center gap-2"
                        :class="{ 'active': isActive(item.route) }">
                        <i class="bi" :class="item.icon || 'bi-circle'"></i>
                        {{ item.title }}
                    </RouterLink>

                    <div v-else>
                        <button
                            class="nav-link text-light d-flex justify-content-between align-items-center w-100 border-0"
                            :class="[isChildActive(item.children) ? 'active' : 'bg-transparent']"
                            @click="toggleMenu(item)">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi" :class="item.icon || 'bi-circle'"></i>
                                <span>{{ item.title }}</span>
                            </div>
                            <AppChevron :is-open="!!item.isOpen" />
                        </button>
                        <div class="collapse" :class="{ 'show': item.isOpen || isChildActive(item.children) }">
                            <ul class="nav flex-column ms-3 mt-1">
                                <li class="nav-item" v-for="(child, childIndex) in item.children" :key="childIndex">
                                    <RouterLink
                                        class="nav-link text-light py-1 opacity-75 d-flex align-items-center gap-2"
                                        :class="{ 'active fw-bold opacity-100': isActive(child.route) }"
                                        :to="child.route!">
                                        <i class="fs-6 bi" :class="child.icon || 'bi-dash'"></i>
                                        {{ child.title }}
                                    </RouterLink>
                                </li>
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </nav>
</template>

<style scoped>
.nav-pills .nav-link.active {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
}
</style>
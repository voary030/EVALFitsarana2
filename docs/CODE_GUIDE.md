# 📘 CODE_GUIDE — Recettes de code pour ce projet

> **Demandez ces patterns de code** quand vous voulez ajouter/modifier une fonctionnalité.  
> Chaque section = un template prêt à copier-coller-adapter.

---

## 📑 Index des recettes

| #   | Recette                                                                  | Usage                              |
| --- | ------------------------------------------------------------------------ | ---------------------------------- |
| 1   | [Créer une nouvelle entité (CRUD complet)](#1-créer-une-nouvelle-entité) | Ajouter un nouveau type de données |
| 2   | [Ajouter une page liste avec pagination](#2-page-liste-avec-pagination)  | Afficher une liste paginée         |
| 3   | [Ajouter une page avec filtres](#3-page-avec-filtres)                    | Filtrer une liste                  |
| 4   | [Ajouter un formulaire de création](#4-formulaire-de-création)           | Formulaire POST                    |
| 5   | [Ajouter une modal de détails](#5-modal-de-détails)                      | Popup avec infos                   |
| 6   | [Changer l'état d'une commande](#6-changer-létat-dune-commande)          | POST /order_histories              |
| 7   | [Ajouter au panier](#7-ajouter-au-panier)                                | Logique panier                     |
| 8   | [Récupérer des données avec filtres API](#8-données-avec-filtres-api)    | Requêtes filtrées                  |
| 9   | [Dashboard avec statistiques](#9-dashboard-statistiques)                 | Tableau de bord                    |
| 10  | [Import CSV](#10-import-csv)                                             | Importation de données             |

---

## 1. Créer une nouvelle entité

### Demande

> "Crée l'entité `[Nom]` complète : type, API, mapper, service, vue liste backoffice"

### Code généré typiquement

**Type** (`src/types/mon_entite/index.ts`) :

```ts
export interface MonEntite {
  id: number
  name: string
  active: number
  date_add: string
}
```

**API** (`src/api/mon_entite/MonEntiteApi.ts`) :

```ts
import apiClient from '@/api/client'

export const MonEntiteApi = {
  async getAll(): Promise<string> {
    const response = await apiClient.get('/mon_entites?display=full')
    return response.data as string
  },
  async getById(id: number): Promise<string> {
    const response = await apiClient.get(`/mon_entites/${id}`)
    return response.data as string
  },
}
```

**Mapper** (`src/mappers/mon_entite/index.ts`) :

```ts
import type { MonEntite } from '@/types/mon_entite'

export const parseMonEntiteListXml = (xml: string): MonEntite[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items: MonEntite[] = []
  doc.querySelectorAll('mon_entite').forEach((el) => {
    items.push({
      id: parseInt(el.querySelector('id')?.textContent || '0'),
      name: el.querySelector('name')?.textContent || '',
      active: parseInt(el.querySelector('active')?.textContent || '0'),
      date_add: el.querySelector('date_add')?.textContent || '',
    })
  })
  return items
}
```

**Service** (`src/service/mon_entite/MonEntiteService.ts`) :

```ts
import { MonEntiteApi } from '@/api/mon_entite/MonEntiteApi'
import { parseMonEntiteListXml } from '@/mappers/mon_entite'
import type { MonEntite } from '@/types/mon_entite'

export const MonEntiteService = {
  async getAll(): Promise<MonEntite[]> {
    const xml = await MonEntiteApi.getAll()
    return parseMonEntiteListXml(xml)
  },
}
```

---

## 2. Page liste avec pagination

### Demande

> "Crée une page liste pour `[entité]` avec pagination côté client, 10 par page, squelette de chargement"

### Structure Vue

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { MonEntiteService } from '@/service/mon_entite/MonEntiteService'
import type { MonEntite } from '@/types/mon_entite'

const items = ref<MonEntite[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(items.value.length / itemsPerPage))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return items.value.slice(start, start + itemsPerPage)
})

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

onMounted(async () => {
  isLoading.value = true
  try {
    items.value = await MonEntiteService.getAll()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading">
    <!-- Skeleton -->
    <div v-for="n in 5" :key="n" class="skeleton-text"></div>
  </div>
  <table v-else>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nom</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in paginatedItems" :key="item.id">
        <td>{{ item.id }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.date_add }}</td>
      </tr>
    </tbody>
  </table>
  <!-- Pagination -->
  <nav>
    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">←</button>
    <button
      v-for="p in totalPages"
      :key="p"
      @click="changePage(p)"
      :class="{ active: p === currentPage }"
    >
      {{ p }}
    </button>
    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">→</button>
  </nav>
</template>
```

---

## 3. Page avec filtres

### Demande

> "Ajoute des filtres (catégorie, nom, prix) sur la page produit"

### Code

```ts
const filters = ref({
  category: 'Tout',
  searchName: '',
  priceMin: 0,
  priceMax: 1000,
})

// Watch les filtres
watch([() => filters.value.category, () => filters.value.searchName], () => {
  currentPage.value = 1
  fetchProducts()
})

const fetchProducts = async () => {
  const data = await ProductService.getAllDynamique(currentPage.value, itemsPerPage, filters.value)
  products.value = data
}

const resetFilters = () => {
  filters.value = { category: 'Tout', searchName: '', priceMin: 0, priceMax: 1000 }
}
```

```html
<select v-model="filters.category">
  <option value="Tout">Tout</option>
  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
</select>
<input v-model="filters.searchName" placeholder="Rechercher..." />
<button @click="resetFilters">Réinitialiser</button>
```

---

## 4. Formulaire de création

### Demande

> "Crée un formulaire pour créer un `[entité]` avec validation"

### Code

```ts
const form = ref({
  name: '',
  price: 0,
  active: 1,
})
const isSubmitting = ref(false)
const error = ref('')

const submit = async () => {
  if (!form.value.name.trim()) {
    error.value = 'Le nom est requis'
    return
  }
  isSubmitting.value = true
  error.value = ''
  try {
    await MonEntiteService.create(form.value)
    router.push('/liste')
  } catch (err: any) {
    error.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
```

```html
<form @submit.prevent="submit">
  <div v-if="error" class="alert alert-danger">{{ error }}</div>
  <input v-model="form.name" placeholder="Nom" required />
  <input v-model.number="form.price" type="number" step="0.01" />
  <button type="submit" :disabled="isSubmitting">
    <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
    Créer
  </button>
</form>
```

---

## 5. Modal de détails

### Demande

> "Ajoute une modal qui affiche les détails de `[entité]`"

### Code

```ts
const selectedItem = ref<MonEntite | null>(null)

const openModal = (item: MonEntite) => {
  selectedItem.value = item
}
const closeModal = () => {
  selectedItem.value = null
}
```

```html
<!-- Bouton -->
<button @click="openModal(item)"><i class="bi bi-eye"></i> Détails</button>

<!-- Modal -->
<div v-if="selectedItem" class="modal-backdrop fade show" @click="closeModal"></div>
<div v-if="selectedItem" class="modal fade show d-block" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark text-white border-secondary">
      <div class="modal-header border-secondary">
        <h5>Détail #{{ selectedItem.id }}</h5>
        <button class="btn-close btn-close-white" @click="closeModal"></button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col-md-6">
            <p>Nom : <strong>{{ selectedItem.name }}</strong></p>
            <p>Date : {{ new Date(selectedItem.date_add).toLocaleDateString('fr-FR') }}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer border-secondary">
        <button class="btn btn-secondary" @click="closeModal">Fermer</button>
      </div>
    </div>
  </div>
</div>
```

---

## 6. Changer l'état d'une commande

### Demande

> "Permet de changer l'état d'une commande via un select"

### Code

```ts
import { OrderHistoryService } from '@/service/order_history/OrderHistoryService'

const updateOrderState = async (order: Order, newState: number) => {
  try {
    await OrderHistoryService.changeOrderState(order.id, newState)
    order.current_state = newState // mise à jour locale
  } catch (err: any) {
    alert('Erreur : ' + err.message)
  }
}
```

```html
<select
  :value="order.current_state"
  @change="updateOrderState(order, Number(($event.target as HTMLSelectElement).value))"
>
  <option value="2">Paiement accepté</option>
  <option value="6">Annulé</option>
</select>
```

---

## 7. Ajouter au panier

### Demande

> "Logique pour ajouter un produit au panier"

### Code

```ts
import { CartService } from '@/service/cart/CartService'

const addToCart = async () => {
  const cartId = localStorage.getItem('current_cart_id')

  if (cartId) {
    // Panier existant → ajouter produit
    await CartService.addToCart({
      cartId: parseInt(cartId),
      id_product: product.id,
      id_product_attribute: selectedCombination.value?.id || 0,
      quantity: quantity.value,
    })
  } else {
    // Nouveau panier
    const newCart = await CartService.create({
      id_customer: clientId,
      id_currency: 1,
      id_lang: 1,
      id_carrier: 1,
    })
    if (newCart) {
      localStorage.setItem('current_cart_id', String(newCart.id))
      await CartService.addToCart({
        cartId: newCart.id,
        id_product: product.id,
        id_product_attribute: selectedCombination.value?.id || 0,
        quantity: quantity.value,
      })
    }
  }
  window.dispatchEvent(new CustomEvent('cart-updated'))
}
```

---

## 8. Données avec filtres API

### Demande

> "Récupère les données filtrées par `[critère]`"

### Code API

```ts
async getAllDynamique(page: number, nombre: number, filters?: ProductFilters): Promise<string> {
    let url = `/products?display=full&sort=[id_DESC]&limit=${(page-1)*nombre},${nombre}`

    if (filters?.name) {
        url += `&filter[name]=[${encodeURIComponent(filters.name)}]%`
    }
    if (filters?.category && filters.category !== 'Tout') {
        url += `&filter[id_category_default]=${filters.category}`
    }

    const response = await apiClient.get(url)
    return response.data as string
}
```

---

## 9. Dashboard statistiques

### Demande

> "Dashboard avec nb commandes, montant TTC, filtrage par date"

### Code

```ts
const dateDebut = ref(new Date().toISOString().slice(0, 10))
const dateFin = ref(new Date().toISOString().slice(0, 10))
const ordersDay = ref<Order[]>([])

const nbCommandesJour = computed(() => ordersDay.value.length)

const montantTTCJour = computed(() =>
  ordersDay.value.reduce((sum, o) => sum + o.total_products_wt, 0),
)

const fetchOrdersByDate = async () => {
  const from = dateDebut.value + ' 00:00:00'
  const to = dateFin.value + ' 23:59:59'
  ordersDay.value = await OrderService.getByDateRange(from, to)
}

watch([dateDebut, dateFin], fetchOrdersByDate)
```

```html
<Card title="Nb commandes" :value="nbCommandesJour" color="primary" />
<Card title="Montant TTC" :value="montantTTCJour.toFixed(2) + ' €'" color="info" />
```

---

## 10. Import CSV

### Demande

> "Importe un CSV et des images"

### Structure typique

```ts
const csvFile = ref<File | null>(null)
const zipFile = ref<File | null>(null)

- [ ] **Import** propre (pas de `any`)
- [ ] **Rollback** géré en cas d'erreur (si import)
- [ ] **Dates** persistées via PATCH (si création de commande/historique)
- [ ] **console.log** retirés avant commit
- [ ] Testé avec `npm run dev`

const handleImport = async () => {
  if (!csvFile.value) return

  const text = await csvFile.value.text()
  const lines = text.split('\n')
  const headers = lines[0].split(',')

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const record: Record<string, string> = {}
    headers.forEach((h, idx) => (record[h.trim()] = values[idx]?.trim()))
    // Traiter chaque ligne...
  }
}
```

---

## ✅ Résumé

| Recette         | Template disponible                 |
| --------------- | ----------------------------------- |
| Nouvelle entité | Type + API + Mapper + Service + Vue |
| Liste paginée   | Skeleton + pagination côté client   |
| Filtres         | watch + reset                       |
| Formulaire      | Validation + submit + spinner       |
| Modal détails   | Backdrop + centered + footer        |
| Changement état | POST /order_histories               |
| Panier          | localStorage + CartService          |
| Filtres API     | encodeURIComponent                  |
| Dashboard       | computed + watch dates              |
| Import CSV      | FileReader + split                  |

---

_Utilisez ces templates comme base pour vos demandes de code !_

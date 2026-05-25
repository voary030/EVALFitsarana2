# 🛠️ DOC_HELP — Aide au développement Vue.js + TypeScript + PrestaShop

> **Guide pratique pour coder sans IA** — Patterns, syntaxes, exemples concrets

---

## 📑 Table des matières

1. [Structure du projet](#structure)
2. [Ajouter une nouvelle entité](#nouvelle-entité)
3. [Patterns Vue 3](#patterns-vue)
4. [Patterns TypeScript](#patterns-ts)
5. [API PrestaShop](#api-prestashop)
6. [Parsing XML](#parsing-xml)
7. [Génération XML](#generation-xml)
8. [Stores Pinia](#stores-pinia)
9. [Router](#router)
10. [Composants](#composants)
11. [Checklist](#checklist)

---

## <a id="structure"></a>1. Structure du projet

```
src/
├── api/           → Appels HTTP (Axios)
├── service/       → Logique métier
├── types/         → Interfaces TypeScript
├── mappers/       → XML → JSON
├── stores/        → Pinia
├── components/    → Composants réutilisables
├── views/         → Pages
└── router/        → Routes
```

## Architecture en couches

```
View → Service → API → PrestaShop REST
              ↓
           Mapper (XML → Type)
              ↓
           Type (interface TS)
```

---

## <a id="nouvelle-entité"></a>2. Ajouter une nouvelle entité (étape par étape)

Disons que vous voulez ajouter **"Addresses"**.

### Étape 1 : Créer le type

`src/types/address/index.ts`

```ts
export interface Address {
  id: number
  id_customer: number
  address1: string
  city: string
  postcode: string
  // ... tous les champs
}
```

### Étape 2 : Créer l'API

`src/api/address/AddressApi.ts`

```ts
import apiClient from '@/api/client'

export const AddressApi = {
  async getAll(): Promise<string> {
    const response = await apiClient.get('/addresses?display=full')
    return response.data as string
  },
  async getById(id: number): Promise<string> {
    const response = await apiClient.get(`/addresses/${id}`)
    return response.data as string
  },
}
```

### Étape 3 : Créer le mapper

`src/mappers/address/index.ts`

```ts
import type { Address } from '@/types/address'

export const parseAddressListXml = (xml: string): Address[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const addresses: Address[] = []
  const elements = doc.querySelectorAll('address')
  elements.forEach((el) => {
    addresses.push({
      id: parseInt(el.querySelector('id')?.textContent || '0'),
      id_customer: parseInt(el.querySelector('id_customer')?.textContent || '0'),
      address1: el.querySelector('address1')?.textContent || '',
      city: el.querySelector('city')?.textContent || '',
      postcode: el.querySelector('postcode')?.textContent || '',
    })
  })
  return addresses
}
```

### Étape 4 : Créer le service

`src/service/address/AddressService.ts`

```ts
import { AddressApi } from '@/api/address/AddressApi'
import { parseAddressListXml } from '@/mappers/address'
import type { Address } from '@/types/address'

export const AddressService = {
  async getAll(): Promise<Address[]> {
    try {
      const xml = await AddressApi.getAll()
      return parseAddressListXml(xml)
    } catch (error) {
      console.error('Erreur getAll addresses:', error)
      return []
    }
  },
}
```

### Étape 5 : Créer la vue

`src/views/backoffice/address/AddressList.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AddressService } from '@/service/address/AddressService'
import type { Address } from '@/types/address'

const addresses = ref<Address[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    addresses.value = await AddressService.getAll()
  } finally {
    isLoading.value = false
  }
})
</script>
```

---

## <a id="patterns-vue"></a>3. Patterns Vue 3 (Composition API)

### `<script setup>` — Reactivity

```ts
import { ref, computed, watch, onMounted } from 'vue'

const count = ref(0) // reactive value
const doubled = computed(() => count.value * 2) // computed

watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`)
})

onMounted(() => {
  console.log('Component mounted!')
})
```

### Props & Events

```ts
// Child component
const props = defineProps<{
  product: Product
  showPrice?: boolean
}>()

const emit = defineEmits<{
  'update:product': [product: Product]
  delete: [id: number]
}>()

// Usage: emit('delete', 42)
```

### v-if / v-for / v-model

```html
<div v-if="isLoading">Chargement...</div>
<div v-else v-for="item in items" :key="item.id">{{ item.name }}</div>
<input v-model="searchQuery" />
<select v-model="selectedOption">
  <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
</select>
```

### Async dans onMounted

```ts
onMounted(async () => {
  isLoading.value = true
  try {
    data.value = await Service.getAll()
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
})
```

---

## <a id="patterns-ts"></a>4. Patterns TypeScript

### Interfaces

```ts
export interface Product {
  id: number
  name: string
  price: number
  active: boolean
  images?: string[]
}
```

### Optional chaining

```ts
const name = product?.category?.name ?? 'Sans catégorie'
const firstImage = product.images?.[0] ?? 'placeholder.jpg'
```

### Type guards

```ts
function isProduct(obj: any): obj is Product {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string'
}
```

### Enums

```ts
const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Actif', color: 'success' },
  2: { label: 'Inactif', color: 'danger' },
}
```

---

## <a id="api-prestashop"></a>5. API PrestaShop

### Format d'URL

```
/api/{resource}?display=full&filter[field]=value&sort=[field_ASC|DESC]&limit=offset,count&ws_key=KEY
```

### Filtres disponibles

```
filter[id]=5                    → ID exact
filter[name]=[toto]             → Contient "toto"
filter[id]=[1,10]               → ID entre 1 et 10
filter[active]=1                → Actif
filter[id_customer]=42          → Client 42
```

### Pagination

```
limit=0,10     → 10 premiers (page 1)
limit=10,10    → 10 suivants (page 2)
limit=20,10    → page 3
// Formule: limit={(page-1)*limit},{limit}
```

### Tri

```
sort=[id_DESC]       → Plus récent d'abord
sort=[name_ASC]      → Alphabétique
sort=[date_add_DESC] → Plus récent
```

### Display

```
display=full    → Tous les champs
display=[id,name,price]  → Champs spécifiques
```

---

## <a id="parsing-xml"></a>6. Parsing XML (Pattern standard)

```ts
const parseSomething = (xml: string): Something => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const el = doc.querySelector('something') // ou doc.querySelectorAll

  return {
    id: parseInt(el.querySelector('id')?.textContent || '0'),
    name: el.querySelector('name')?.textContent || '',
    price: parseFloat(el.querySelector('price')?.textContent || '0'),
  }
}
```

### Pour une liste

```ts
export const parseSomethingListXml = (xml: string): Something[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items: Something[] = []
  const elements = doc.querySelectorAll('something')
  elements.forEach((el) => {
    items.push({
      id: parseInt(el.querySelector('id')?.textContent || '0'),
      // ...
    })
  })
  return items
}
```

---

## <a id="generation-xml"></a>7. Génération XML (Pattern standard)

```ts
const buildCreateXml = (data: SomethingData): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        <something>
            <name><![CDATA[${data.name}]]></name>
            <price><![CDATA[${data.price}]]></price>
            <active><![CDATA[1]]></active>
        </something>
    </prestashop>`.trim()
}
```

### Pour une commande (POST /order_histories)

```ts
const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order_history>
        <id_employee><![CDATA[1]]></id_employee>
        <id_order_state><![CDATA[${newState}]]></id_order_state>
        <id_order><![CDATA[${orderId}]]></id_order>
        <date_add><![CDATA[${now}]]></date_add>
    </order_history>
</prestashop>`.trim()
```

---

## <a id="stores-pinia"></a>8. Stores Pinia

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMyStore = defineStore('myStore', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)

  // Computed
  const count = computed(() => items.value.length)

  // Actions
  async function fetchAll() {
    isLoading.value = true
    try {
      items.value = await Service.getAll()
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, count, fetchAll }
})
```

---

## <a id="router"></a>9. Router

### Ajouter une route

```ts
// src/router/index.ts
{
    path: '/ma-page',
    name: 'MaPage',
    component: () => import('@/views/backoffice/MaPage.vue'),
    meta: { requiresAuth: true }  // nécessite connexion admin
}
```

### Navigation

```ts
import { useRouter } from 'vue-router'
const router = useRouter()
router.push('/autre-page')
router.push({ name: 'ProductDetail', params: { id: product.id } })
```

---

## <a id="composants"></a>10. Patterns Composants

### Composant simple

```vue
<script setup lang="ts">
interface Props {
  title: string
  count: number
}
const props = defineProps<Props>()
</script>

<template>
  <div class="card">
    <h5>{{ title }}</h5>
    <span>{{ count.toLocaleString() }}</span>
  </div>
</template>

<style scoped>
.card {
  /* styles */
}
</style>
```

### Composant avec slot

```vue
<template>
  <div class="card">
    <slot name="header" />
    <div class="card-body">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>
```

---

## <a id="checklist"></a>11. Checklist — Ajouter une feature

Quand vous ajoutez une nouvelle fonctionnalité, vérifiez :

- [ ] **Type** créé dans `src/types/...`
- [ ] **API** créée dans `src/api/...`
- [ ] **Mapper** créé dans `src/mappers/...`
- [ ] **Service** créé dans `src/service/...`
- [ ] **Vue** créée dans `src/views/...`
- [ ] **Route** ajoutée dans `src/router/index.ts`
- [ ] **Store** mis à jour si nécessaire
- [ ] **Import** propre (pas de `any`)
- [ ] **console.log** retirés avant commit
- [ ] Testé avec `npm run dev`

---

## 🔧 Commandes utiles

```bash
npm run dev        # Lancer le serveur dev
npm run build      # Build production
```

---

_Ce guide est là pour vous aider à coder sans dépendre d'une IA. Gardez-le à portée de main !_

# Gestion de la Trace de Stock à la Livraison

Ce document présente la solution de contournement (workaround) pour enregistrer un mouvement de stock via l'API PrestaShop personnalisée (`stock_delta`), sans impacter deux fois le stock disponible (`stock_available`).

## Le contexte

Lorsqu'une commande est passée en "Paiement accepté", PrestaShop diminue automatiquement le `stock_available`.
Lorsqu'on passe ensuite la commande en "Livré" (statut `5`), on souhaite enregistrer une trace (un mouvement) pour dire que le stock physique est parti. Cependant, appeler le service `stock_delta` diminue _à nouveau_ le `stock_available`.

## La solution

Pour insérer le mouvement tout en gardant un stock disponible correct :

1. **Sauvegarder** la quantité actuelle de `stock_available`.
2. **Insérer** le mouvement via `stock_delta` (qui va altérer le stock).
3. **Restaurer** le `stock_available` à sa quantité d'origine via `updateStock`.

## Implémentation (Vue.js / TypeScript)

```typescript
import { StockAvailableService } from '@/service/stock_available/StockAvailableService'
import { StockDeltaService } from '@/service/stock_delta/StockDeltaService'

const updateOrderState = async (order: Order, newState: number) => {
    if (updatingId.value) return
    updatingId.value = order.id

    try {
        // 1. Changer l'état dans l'historique de la commande
        await OrderHistoryService.changeOrderState(order.id, newState)

        // 2. Si on passe en statut "Livré" (5), on gère le mouvement de stock sans fausser le total
        if (newState === 5) {
            // Récupérer les détails de la commande pour connaître les produits et les quantités
            const orderDetails = await OrderService.getById(order.id)
            const orderRows = orderDetails?.associations?.order_rows || []

            for (const row of orderRows) {
                const idProduct = parseInt(row.product_id)
                const idProductAttribute = parseInt(row.product_attribute_id)
                const qtyDelivered = parseInt(row.product_quantity)

                // A. Lire le stock exact actuel
                const currentStock = await StockAvailableService.getByProductId(idProduct, idProductAttribute)

                if (currentStock) {
                    const originalQty = currentStock.quantity

                    // B. Insérer le mouvement via StockDelta (laisse une trace mais diminue le stock)
                    const pad = (n: number) => n.toString().padStart(2, '0')
                    const now = new Date()
                    const dateActuel = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

                    await StockDeltaService.create({
                        id_product: idProduct,
                        id_product_attribute: idProductAttribute,
                        delta: -qtyDelivered, // ou +qtyDelivered, selon votre logique
                        date_add: dateActuel
                    })

                    // C. Remettre immédiatement le stock available à son niveau d'origine
                    await StockAvailableService.updateStock(idProduct, idProductAttribute, originalQty)
                }
            }
        }

        // 3. Mettre à jour l'affichage localement
        order.current_state = newState
    } catch (err: any) {
        alert('Erreur lors du changement d\\'état : ' + err.message)
    } finally {
        updatingId.value = null
    }
}
```

---

# Gestion d'un "Nouveau Panier" (Bouton et Action)

Ce document présente comment ajouter un bouton "Nouveau Panier" pour permettre à un utilisateur (identifié ou anonyme) de réinitialiser son panier en cours et de démarrer un panier tout neuf.

## Le principe

Pour créer un nouveau panier :

1. On **supprime** l'identifiant du panier actif (`current_cart_id`) stocké dans le `localStorage`.
2. On **vide** la liste des articles du panier localement dans l'état (ou dans le store).
3. (Optionnel) Si l'utilisateur est connecté, on peut également appeler l'API de création pour instancier directement un panier vide en base, ou laisser la création automatique s'opérer lors du prochain ajout au panier (`addToCart`).

---

## 1. Action de réinitialisation dans le Service ou Store

Dans un service de panier ou dans votre composant, implémentez la fonction suivante pour vider et forcer la création d'un nouveau panier :

```typescript
// Exemple de fonction à intégrer dans vos services ou composant
export const resetCart = () => {
  // 1. Effacer le panier actuel du cache du navigateur
  localStorage.removeItem('current_cart_id')

  // 2. Optionnel : recharger la page ou réinitialiser le state local
  // ex: cartItems.value = []
  window.location.reload() // Recharge pour appliquer un état propre
}
```

---

## 2. Intégration du bouton dans la vue Panier

Fichier à éditer : [CartView.vue](file:///home/deku/Documents/S6/EVAL/vue-prestashop/src/views/frontoffice/cart/CartView.vue)

### Le code HTML (Template)

Ajoutez un bouton à côté de vos actions de panier :

```html
<button @click="handleNewCart" class="btn btn-outline-secondary rounded-pill px-4 me-2">
  <i class="bi bi-cart-plus me-2"></i>Nouveau Panier
</button>
```

### Le code TypeScript (Script setup)

Dans le bloc `<script setup lang="ts">`, ajoutez la méthode d'action :

```typescript
const handleNewCart = () => {
  if (confirm('Voulez-vous vraiment abandonner ce panier et en commencer un nouveau ?')) {
    // Supprimer la référence locale
    localStorage.removeItem('current_cart_id')

    // Vider les articles locaux
    cartItems.value = []
    cart.value = null

    // Rediriger vers la page d'accueil ou notifier
    alert('Nouveau panier créé ! Vous pouvez continuer vos achats.')
    router.push('/')
  }
}
```

---

## 3. Intégration du bouton dans la barre de navigation

Fichier à éditer : [FrontNavbar.vue](file:///home/deku/Documents/S6/EVAL/vue-prestashop/src/layouts/frontoffice/fragments/FrontNavbar.vue)

Vous pouvez également proposer l'action directement dans la barre supérieure de navigation :

```html
<!-- Bouton Nouveau Panier dans la Navbar -->
<button @click="triggerNewCart" class="btn btn-sm btn-outline-light rounded-pill px-3 ms-2">
  <i class="bi bi-trash3 me-1"></i>Nouveau panier
</button>
```

Dans la partie script de la Navbar :

```typescript
const triggerNewCart = () => {
  localStorage.removeItem('current_cart_id')
  // Optionnel : émettre un événement ou rafraîchir la session active
  window.location.href = '/'
}
```

---

# Charger un Panier de l'Historique comme "Panier Actuel"

Dans la liste des commandes, les paniers en attente non finalisés du client sont listés comme des commandes simulées avec l'état **"Dans le panier"** (ID `-99`).
Ce guide explique comment ajouter un bouton pour permettre à l'utilisateur de charger l'un de ses anciens paniers comme son **panier actif/actuel** pour pouvoir finaliser sa commande ou modifier ses produits.

## Le principe

Pour réactiver un ancien panier de l'historique :

1. On récupère l'identifiant du panier (`id_cart` ou `id` du panier simulé).
2. On définit cet identifiant dans le `localStorage` sous la clé `current_cart_id`.
3. On redirige l'utilisateur vers la page du panier (`/cart`) pour qu'il voie instantanément les produits de ce panier et puisse procéder au checkout.

---

## Implémentation de l'action réactivation

Fichier principal à éditer : [OrdersView.vue](file:///home/deku/Documents/S6/EVAL/vue-prestashop/src/views/frontoffice/orders/OrdersView.vue)

### 1. Le code HTML (Bouton dans la liste ou dans le modal de détails)

Dans le template de la liste des commandes, si la ligne correspond à un panier (status `-99`), ou dans le modal de détails du panier simulé, ajoutez le bouton d'action :

```html
<!-- Bouton à afficher uniquement pour les paniers simulés (statut -99) -->
<button
  v-if="order.current_state === -99"
  @click.stop="reactivateCart(order.id)"
  class="btn btn-sm btn-primary rounded-pill px-3"
>
  <i class="bi bi-cart-check-fill me-1"></i>Utiliser comme panier actuel
</button>
```

---

### 2. Le code TypeScript (Script setup)

Dans le bloc `<script setup lang="ts">` de [OrdersView.vue](file:///home/deku/Documents/S6/EVAL/vue-prestashop/src/views/frontoffice/orders/OrdersView.vue), importez le `useRouter` et définissez la méthode de réactivation :

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

/**
 * Réactive un panier de l'historique pour en faire le panier actif principal.
 * @param cartId L'identifiant du panier à réactiver
 */
const reactivateCart = (cartId: number) => {
  // 1. Définir le panier sélectionné comme panier actif actuel
  localStorage.setItem('current_cart_id', String(cartId))

  // 2. Notification de succès chaleureuse
  alert(
    'Ce panier a été activé comme votre panier actuel. Vous allez être redirigé pour finaliser vos achats !',
  )

  // 3. Redirection automatique vers la page du panier
  router.push('/cart')
}
```

---

## 3. Mise à jour de la Navbar pour refléter le changement

Une fois redirigé, le composant [FrontNavbar.vue](file:///home/deku/Documents/S6/EVAL/vue-prestashop/src/layouts/frontoffice/fragments/FrontNavbar.vue) détectera automatiquement la nouvelle clé `current_cart_id` au montage ou lors d'un rafraîchissement d'état, affichant le bon nombre d'articles en haut à droite.

```

```

# 📦 VUE-PRESTASHOP

> **Application Vue 3 + TypeScript + PrestaShop WebService API**  
> E-commerce complet avec Front Office (boutique client) et Back Office (administration)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VUE 3 (Vite)                     │
├─────────────────────────────────────────────────────┤
│  Views (pages)          Components (réutilisables)  │
├─────────────────────────────────────────────────────┤
│  Stores (Pinia)         Router (vue-router)         │
├─────────────────────────────────────────────────────┤
│  Services (logique métier)                          │
├─────────────────────────────────────────────────────┤
│  Mappers (XML → JSON)   Types (interfaces TS)       │
├─────────────────────────────────────────────────────┤
│  APIs (Axios + PrestaShop WebService)               │
├─────────────────────────────────────────────────────┤
│  PrestaShop REST API (XML)                          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Technologies

| Technologie         | Usage                               |
| ------------------- | ----------------------------------- |
| **Vue 3**           | Composition API (`<script setup>`)  |
| **TypeScript**      | Typage strict                       |
| **Pinia**           | State Management (auth, clientAuth) |
| **Vue Router**      | Routing + guards                    |
| **Axios**           | Client HTTP                         |
| **DOMParser**       | Parsing XML natif                   |
| **Bootstrap 5**     | Styling + responsive                |
| **Bootstrap Icons** | Icones                              |
| **Vite**            | Build tool                          |

---

## 📁 Structure du projet

```
src/
├── api/           # 13 APIs — Accès PrestaShop WebService
├── service/       # 11 Services — Logique métier + XML
├── types/         # 11 fichiers d'interfaces TypeScript
├── mappers/       # 11 parseurs XML → JSON
├── stores/        # 2 stores Pinia (auth, clientAuth)
├── components/    # 4 composants réutilisables
├── layouts/       # 5 layouts (frontoffice, backoffice, centered)
├── views/         # 15 pages/vues
├── router/        # Configuration Vue Router
└── assets/        # Ressources statiques
```

---

## 🔌 APIs

### [CartApi](src/api/cart/CartApi.ts)

```
getAll() | getById(id) | create(xml) | update(id, xml) | patch(id, xml) | delete(id)
```

### [CategoryApi](src/api/category/CategoryApi.ts)

```
getAll() | getById(id) | getByName(name) | create(xml) | update(id, xml) | patch(id, xml) | delete(id) | deleteMultiple(ids)
```

### [CombinationApi](src/api/combination/CombinationApi.ts)

```
getAll() | getById(id) | getByProductId(prodId) | create(xml) | update(id, xml) | delete(id)
```

### [CustomerApi](src/api/customer/CustomerApi.ts)

```
getAll() | getById(id) | create(xml) | update(id, xml) | delete(id)
```

### [EmployeeApi](src/api/employee/EmployeeApi.ts)

```
getByEmail(email)
```

### [ImageApi](src/api/image/ImageApi.ts)

```
getProductImageUrl(productId, imageId?) | getAllProductImages(product)
```

### [OrderHistoryApi](src/api/order_history/OrderHistoryApi.ts)

```
create(xml) | getByOrderId(orderId)
```

### [OrdersApi](src/api/orders/OrdersApi.ts)

```
create(xml) | getByCustomerId(id) | getByCustomerIdPaginated(id, page, limit) | countByCustomerId(id) | getById(id) | getAll() | getByDateRange(from, to)
```

### [ProductApi](src/api/product/ProductApi.ts)

```
getAll() | countAll() | getAllDynamique(page, nb, filters?) | getById(id) | create(xml) | update(id, xml) | patch(id, xml) | delete(id)
```

### [ProductOptionApi](src/api/product_option/ProductOptionApi.ts)

```
getAll() | getById(id) | create(xml) | update(id, xml) | delete(id)
```

### [ProductOptionValueApi](src/api/product_option_value/ProductOptionValueApi.ts)

```
getAll() | getById(id) | create(xml) | update(id, xml) | delete(id)
```

### [TaxApi](src/api/tax/taxe/TaxeApi.ts)

```
getAll() | getByRate(rate) | getById(id) | create(xml) | update(id, xml) | patch(id, xml) | delete(id) | deleteMultiple(ids)
```

### [TaxRuleApi](src/api/tax/tax_rules/TaxRuleApi.ts)

```
getAll() | getById(id) | getByIdTax(idTax, idCountry) | getByTaxRuleGroupAndCountry(group, country) | create(xml) | update(id, xml) | patch(id, xml) | delete(id) | deleteMultiple(ids)
```

### [TaxRuleGroupApi](src/api/tax/tax_rule_group/TaxRuleGroupApi.ts)

```
getAll() | getById(id) | create(xml) | update(id, xml) | patch(id, xml) | delete(id) | deleteMultiple(ids)
```

---

## 🧠 Services (Logique métier)

### [CartService](src/service/cart/CartService.ts)

- `getAll()` → Tous les paniers
- `getById(id)` → Panier par ID
- `getByCustomerId(customerId)` → Paniers d'un client
- `create(data)` → Créer un panier (génère XML)
- `addToCart(data)` → Ajouter un produit au panier
- `removeFromCart(cartId, id_product, id_attr)` → Retirer du panier
- `updateQuantity(cartId, id_product, id_attr, qty)` → Changer quantité
- `count()` → Nombre total de paniers

### [CategoryService](src/service/category/CategoryService.ts)

- `create(name)` → Créer une catégorie
- `getByName(name)` → Recherche par nom
- `getById(id)` → Catégorie par ID
- `getAll()` → Toutes les catégories
- `count()` → Nombre total

### [CombinationService](src/service/combination/CombinationService.ts)

- `getAll()` | `getById(id)` | `getByProductId(prodId)`

### [CustomerService](src/service/customer/CustomerService.ts)

- `getAll()` → Tous les clients
- `getById(id)` → Client par ID
- `create(data)` → Créer un client (XML généré)
- `update(id, data)` → Modifier un client
- `delete(id)` → Supprimer

### [EmployeeService](src/service/employee/EmployeeService.ts)

- `login(email, password)` → Authentification admin (bcryptjs)

### [OrderHistoryService](src/service/order_history/OrderHistoryService.ts)

- `changeOrderState(orderId, newState, employeeId?)` → **POST** `/order_histories` — Change l'état d'une commande
- `getByOrderId(orderId)` → Historique d'une commande

### [OrderService](src/service/orders/OrderService.ts)

- `createOrderFromCart(cart, items, clientId, email)` → Génère XML complet (reference, totals, state=11)
- `getByCustomerId(id)` → Commandes d'un client
- `getByCustomerIdPaginated(id, page, limit)` → Paginé
- `countByCustomerId(id)` → Nombre de commandes
- `getById(id)` | `getAll()` → Toutes les commandes
- `getByDateRange(from, to)` → Filtré par période

### [ProductService](src/service/product/ProductService.ts)

- `creerProduit(data)` → Création avancée (taxe, catégorie)
- `create(data)` → Création simple
- `getById(id)` | `getAll()` | `count()` | `countAll()`
- `getAllDynamique(page, nb, filters?)` → Paginé + filtres
- `getProductOptionGroups(prodId)` → Options du produit
- `getIdProductOption(prodId)` → IDs des options
- `getPrixTtc(prodId, attrId)` / `getPrix(prodId, attrId)` → Prix

### [ProductOptionService](src/service/product_option/ProductOptionService.ts)

- `getAll()` | `getById(id)` | `create(data)`

### [ProductOptionValueService](src/service/product_option_value/ProductOptionValueService.ts)

- `getAll()` | `getById(id)` | `create(data)`

### [TaxService](src/service/tax/taxe/TaxService.ts)

- `getAll()` | `getById(id)` | `getByRate(rate)`
- `getIdTaxeRulesGroupByRateTax(rate)` → Trouver groupe fiscal
- `mamoronaTaxeSyNyZanany(name, rate, country)` → Créer taxe + règle + groupe
- `create(data)` | `delete(id)`

### [TaxRuleService](src/service/tax/tax_rule/TaxRuleService.ts)

- `getAll()` | `getById(id)` | `getByIdTax(idTax)`
- `getByTaxRuleGroupAndCountry(group, country)`
- `create(groupId, taxId, countryId)` | `delete(id)`

### [TaxRuleGroupService](src/service/tax/tax_rule_group/TaxRuleGroupService.ts)

- `getAll()` | `getById(id)` | `create(name)` | `update(id, xml)` | `delete(id)`

---

## 🏪 Stores (Pinia)

### [authStore](src/stores/auth.ts)

- **Admin** authentication
- `user` (Employee | null)
- `isAuthenticated` (computed)
- `login(credentials)` / `logout()` / `initializeAuth()`

### [clientAuthStore](src/stores/clientAuth.ts)

- **Client** authentication
- `client` (Customer | null), `token`, `isAnonymous`
- `isAuthenticated`, `clientInitials` (computed)
- `setClient(c, token)` / `setAnonymous()` / `logout()` / `fetchProfile()`

---

## 📄 Pages / Views

### 🛒 Front Office (Boutique)

| Page              | Route                   | Description                                                                  |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------- |
| **HomeView**      | `/boutique`             | Accueil — Sélection client (liste + anonyme)                                 |
| **ProductList**   | `/boutique/produit`     | Produits paginés (11/page) + filtres (catégorie, nom, prix) + badges HOT/NEW |
| **ProductDetail** | `/boutique/produit/:id` | Détail produit + options + prix combiné + ajout panier                       |
| **CartView**      | `/boutique/panier`      | Panier avec +/- qty, suppression, total TTC, bouton "Valider commande"       |
| **OrdersView**    | `/boutique/commandes`   | Commandes client paginées (8/page) + modal détail                            |
| **ForbiddenView** | `/boutique/forbidden`   | Erreur 403 boutique                                                          |

### ⚙️ Back Office (Admin)

| Page             | Route         | Description                                                                |
| ---------------- | ------------- | -------------------------------------------------------------------------- |
| **Dashboard**    | `/`           | Stats par période (2 dates) + Total général (commandes, montant TTC)       |
| **LoginView**    | `/login`      | Connexion admin (email + mot de passe, bcryptjs)                           |
| **OrdersList**   | `/commandes`  | Gestion commandes — Tableau + sélecteur d'état (Paiement accepté / Annulé) |
| **ListCategory** | `/categories` | Liste catégories XML/JSON                                                  |
| **ListProduct**  | `/produits`   | Liste produits XML/JSON                                                    |
| **Teste**        | `/taxe`       | Gestion taxes                                                              |
| **ImportData**   | `/import`     | Import CSV + ZIP images                                                    |
| **ResetData**    | `/reset`      | Réinitialisation données                                                   |
| **Dev**          | `/dev`        | Outils développeur                                                         |
| **NotFoundView** | `*`           | Erreur 404                                                                 |

---

## 🧩 Composants

| Composant       | Props                      | Description                                               |
| --------------- | -------------------------- | --------------------------------------------------------- |
| **Card**        | `title`, `value`, `color?` | Carte statistique (dashboard)                             |
| **ProductCard** | `product: Product`         | Carte produit avec image, catégorie, prix + badge HOT/NEW |
| **AppChevron**  | `isOpen: boolean`          | Chevron rotatif animé                                     |
| **AppSpinner**  | `size`, `color`, `text?`   | Spinner de chargement                                     |

---

## 🏷️ Badges HOT / NEW

Les produits ont automatiquement des badges selon leur `available_date` :

| Badge      | Condition | Style             |
| ---------- | --------- | ----------------- |
| 🔥 **HOT** | 0-1 jour  | `bg-danger` rouge |
| ⭐ **NEW** | 0-7 jours | `bg-info` bleu    |

---

## 📊 Statuts de commande (17 états)

| ID  | État                              | Badge       |
| --- | --------------------------------- | ----------- |
| 1   | En attente du paiement par chèque | `warning`   |
| 2   | Paiement accepté                  | `info`      |
| 3   | En cours de préparation           | `info`      |
| 4   | Expédié                           | `primary`   |
| 5   | Livré                             | `success`   |
| 6   | Annulé                            | `danger`    |
| 7   | Remboursé                         | `secondary` |
| 8   | Erreur de paiement                | `danger`    |
| 9   | En attente de réappro. (payé)     | `warning`   |
| 10  | En attente de virement            | `warning`   |
| 11  | Paiement à distance accepté       | `success`   |
| 12  | En attente de réappro. (non payé) | `warning`   |
| 13  | En attente de paiement livraison  | `warning`   |
| 14  | En attente de paiement            | `warning`   |
| 15  | Remboursement partiel             | `secondary` |
| 16  | Paiement partiel                  | `info`      |
| 17  | Autorisation — À capturer         | `info`      |

---

## 🔐 Authentification

### Admin

- `EmployeeService.login(email, password)`
- Hash bcryptjs comparé au passwd stocké
- Store `auth` Pinia

### Client

- Sélection client existant OU anonyme
- Store `clientAuth` Pinia
- Guard `requiresClientAuth` sur routes boutique

---

## 📥 Importation de données

L'import (`/import`) permet d'importer :

- **3 fichiers CSV** (produits, clients, commandes) avec validation stricte (JJ/MM/AAAA, montants positifs).
- **1 archive ZIP** (images produits).
- **Rollback automatique** : En cas d'erreur lors d'un import, un reset complet est déclenché via `ResetService` pour préserver l'intégrité de la base.
- **Correction des dates** : Stratégie de `PATCH` systématique après création (`POST`) pour contourner l'écrasement automatique des dates par PrestaShop.

---

## 🚦 Router Guards

| Guard                | Usage                                              |
| -------------------- | -------------------------------------------------- |
| `requiresAuth`       | Routes admin — Vérifie `authStore.isAuthenticated` |
| `requiresClientAuth` | Routes boutique — Accepte authentifié OU anonyme   |

---

## 📈 Statistiques

| Métrique           | Valeur                      |
| ------------------ | --------------------------- |
| **APIs**           | 13 fichiers, ~100 méthodes  |
| **Services**       | 11 fichiers, ~80 méthodes   |
| **Types**          | 11 fichiers, ~50 interfaces |
| **Mappers**        | 11 fichiers, ~50 fonctions  |
| **Pages**          | 15 vues                     |
| **Composants**     | 4 composants                |
| **Stores**         | 2 stores Pinia              |
| **Routes**         | 20+ routes                  |
| **Total fichiers** | ~68                         |

---

## 🚀 Démarrage

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build
```

---

## ⚙️ Configuration

Créer un fichier `.env` :

```env
VITE_PRESTASHOP_KEY=votre_ws_key
```

L'API PrestaShop est accessible via `/api` (proxy Vite configuré dans `vite.config.ts`).

---

_Documentation générée le 14 mai 2026_

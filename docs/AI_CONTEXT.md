# 🤖 AI_CONTEXT — Résumé technique du projet Vue-PrestaShop

Ce document fournit un contexte technique complet du projet **Vue-PrestaShop** pour les développeurs et assistants IA. Il décrit l'architecture, les contraintes PrestaShop, les modules principaux et les bonnes pratiques à suivre.

---

## 🎯 Objectif du projet

- Plateforme e‑commerce front + back permettant de synchroniser des données CSV/ZIP (produits, combinaisons, stocks, clients, paniers, commandes, images) vers une boutique PrestaShop via son WebService XML.
- Import massif, validations strictes, réconciliation des dates et mécanisme de rollback pour éviter des états partiels.

---

## 🏗️ Principes d'architecture

1. Pipeline en couches :

- **Types** : interfaces TS (`src/types/`) — JSON-first.
- **API** : wrappers Axios qui parlent XML (`src/api/`) et renvoient XML brut.
- **Mappers** : parseurs XML → objets TS (`src/mappers/`) (DOMParser / fast-xml-parser).
- **Services** : logique métier, templates XML, validations (`src/service/`).
- **Views** : composants Vue 3 (Composition API) consomment les Services (`src/views/`).

2. Contrainte PrestaShop :

- Le WebService utilise exclusivement XML ; toutes les mutations (POST/PUT/PATCH) sont construites à la main via templates XML et utilisent CDATA pour les champs texte.

3. Date persistence :

- PrestaShop remplace `date_add` lors d'un POST → stratégie standard : créer (POST) puis corriger la date via un PATCH ciblé si nécessaire.

4. Atomicité des imports :

- Pas de transaction multi-ressources côté PrestaShop. Les imports se font ligne par ligne. En cas d'erreur sur un batch, `ResetService.resetAll()` est appelé pour rollback.

---

## 🚦 Patterns et bonnes pratiques

- Validation stricte côté client :
  - Dates en `DD/MM/YYYY` (`validateDateDDMMYYYY`), montants strictement positifs (`validatePositiveAmount`), format de la colonne `achat` pour les paniers.
- Préférer les filtres serveur (`filter[]`) plutôt que `getAll()` + filtrage local pour limiter le trafic.
- Utiliser des caches mémoire locaux dans `ImportService` pour réduire les appels répétés (produits, combos, valeurs d'option).
- Préfetch par lot des combos / valeurs d'option pour références présentes dans le CSV.
- Traitement parallèle contrôlé (concurrency limit) pour augmenter le débit sans saturer le WebService.
- POST → PATCH immédiat quand il faut corriger `date_add` ou compléter des associations.

---

## 📁 Structure du dépôt (extrait)

```
src/
├── api/             # Requêtes HTTP (Axios) vers PrestaShop (XML)
├── service/         # Logique métier + génération de XML
├── types/           # Interfaces TypeScript
├── mappers/         # XML → JSON converters
├── stores/          # Pinia stores (auth, client, cart)
├── views/           # Pages Vue (backoffice / frontoffice)
├── components/      # UI réutilisable
├── layouts/         # Layouts admin / shop
└── router/          # Routes & guards
```

---

## 🛠️ Inventaire des modules (complet / consolidé)

### API (`src/api/`)

- CartApi
- CategoryApi
- CombinationApi
- CustomerApi
- EmployeeApi
- ImageApi
- OrdersApi
- OrderHistoryApi
- ProductApi
- ProductOptionApi
- ProductOptionValueApi
- TaxApi
- TaxRuleApi
- TaxRuleGroupApi

### Services (`src/service/`)

- ImportService (CSV, ZIP d'images, validations, orchestration)
- ResetService (nettoyage / rollback)
- ProductService (création / patch produit, récupération prix, ref lookup)
- CategoryService
- TaxService, TaxRuleService, TaxRuleGroupService
- ProductOptionService
- ProductOptionValueService
- CombinationService (création combos, association option values)
- StockAvailableService
- StockMvtService (s'il existe pour mouvements de stock)
- CartService (création / patch / ajout articles)
- OrderService (création commande via cart + patch date)
- OrderHistoryService
- CustomerService, AddressService
- Image helpers / ImageApi wrappers
- DashboardService (financial metrics, cart conversions, TTC/HT aggregation)

### Types (`src/types/`)

- product, combination, cart, order, customer, address, product_option, product_option_value, stock, tax, etc.

### Mappers / utilitaires (`src/mappers/`)

- XML → JSON parsers
- Helpers : `parseAchatColumn`, `normalizeText`, `validateDateDDMMYYYY`, `validatePositiveAmount`.

### Views / UI (`src/views/`)

- Backoffice : `ImportData.vue`, `ResetData.vue`, `ListProduct`, `ListCategory`, `OrdersList`, `Dev`...
- Frontoffice : `HomeView`, `ProductList`, `ProductDetail`, `CartView`, `OrdersView`.

### Stores (`src/stores/`)

- `auth.ts` (admin/employee)
- `clientAuth.ts` (client session)
- cart-related stores

---

## 🔍 Points d'attention techniques

- Toujours privilégier les appels filtrés côté serveur (`filter[]`) pour lookups (ex : recherche produit par référence, recherche valeur d'option par nom).
- Les créations massives doivent être idempotentes autant que possible (utiliser références uniques, vérifier existence avant création).
- Le `ResetService` doit préserver les entités racines nécessaires (adresse id=1, customer id=1, catégories racines) si le déploiement l'exige.

---

## ⚙️ Optimisations recommandées

- Caches locaux (maps) pour références répétées pendant un import.
- Prefetch des combos/valeurs d'option pour toutes les références du CSV avant boucle principale.
- Traitement parallèle avec limite de concurrence (p.ex. 5) pour résoudre les lignes du CSV.
- Regrouper les patches (si possible) et limiter la taille des requêtes XML envoyées.

---

## Où stocker et comment utiliser

- Fichier : `docs/AI_CONTEXT.md` — garder à jour après modifications structurelles majeures.
- Usage : onboarding, aide IA, génération automatique de documentation, scripts CI qui vérifient conventions.

---

Si vous voulez, j'écris ce contenu directement dans `docs/AI_CONTEXT.md` (déjà fait), et je peux aussi créer un petit changelog ou un commit Git. Voulez-vous que je crée un commit avec ce changement ?

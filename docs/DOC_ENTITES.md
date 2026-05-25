# 📋 DOC_ENTITES — Toutes les entités du projet

> **Liste exhaustive de toutes les entités PrestaShop utilisées dans l'application**, leurs champs, leurs types TypeScript et leurs relations.

---

## 🗂️ Table des entités

| #   | Entité                                       | Table PrestaShop       | API endpoint             | Fichier TypeScript                    |
| --- | -------------------------------------------- | ---------------------- | ------------------------ | ------------------------------------- |
| 1   | [Category](#1-category)                      | `ps_category`          | `/categories`            | `types/category/index.ts`             |
| 2   | [Product](#2-product)                        | `ps_product`           | `/products`              | `types/product/index.ts`              |
| 3   | [Combination](#3-combination)                | `ps_product_attribute` | `/combinations`          | `types/combination/index.ts`          |
| 4   | [Customer](#4-customer)                      | `ps_customer`          | `/customers`             | `types/customer/index.ts`             |
| 5   | [Employee](#5-employee)                      | `ps_employee`          | `/employees`             | `types/employee/index.ts`             |
| 6   | [Cart](#6-cart)                              | `ps_cart`              | `/carts`                 | `types/cart/index.ts`                 |
| 7   | [Order](#7-order)                            | `ps_orders`            | `/orders`                | `types/orders/index.ts`               |
| 8   | [OrderHistory](#8-orderhistory)              | `ps_order_history`     | `/order_histories`       | `types/order_history/index.ts`        |
| 9   | [ProductOption](#9-productoption)            | `ps_attribute_group`   | `/product_options`       | `types/product_option/index.ts`       |
| 10  | [ProductOptionValue](#10-productoptionvalue) | `ps_attribute`         | `/product_option_values` | `types/product_option_value/index.ts` |
| 11  | [Tax](#11-tax)                               | `ps_tax`               | `/taxes`                 | `types/tax/taxe/index.ts`             |
| 12  | [TaxRule](#12-taxrule)                       | `ps_tax_rule`          | `/tax_rules`             | `types/tax/tax_rule/index.ts`         |
| 13  | [TaxRuleGroup](#13-taxrulegroup)             | `ps_tax_rules_group`   | `/tax_rule_groups`       | `types/tax/tax_rule_group/index.ts`   |

---

## 1. Category

| Champ                    | Type TS    | Description                        |
| ------------------------ | ---------- | ---------------------------------- |
| `id`                     | `number`   | Identifiant unique                 |
| `id_parent`              | `number`   | Catégorie parente (0 = racine)     |
| `level_depth`            | `number`   | Profondeur dans l'arbre            |
| `nb_products_recursive`  | `number`   | Nombre de produits (récursif)      |
| `active`                 | `number`   | Actif (0 ou 1)                     |
| `id_shop_default`        | `number`   | Boutique par défaut                |
| `is_root_category`       | `number`   | Catégorie racine ?                 |
| `position`               | `number`   | Ordre d'affichage                  |
| `date_add`               | `string`   | Date de création                   |
| `date_upd`               | `string`   | Date de modification               |
| `name`                   | `string`   | Nom (multilingue → 1 seule langue) |
| `link_rewrite`           | `string`   | URL simplifiée                     |
| `description`            | `string`   | Description                        |
| `additional_description` | `string`   | Description additionnelle          |
| `meta_title`             | `string`   | Titre SEO                          |
| `meta_description`       | `string`   | Description SEO                    |
| `meta_keywords`          | `string`   | Mots-clés SEO                      |
| `children_ids`           | `number[]` | IDs catégories enfants             |
| `product_ids`            | `number[]` | IDs produits associés              |

**Fichier Type** : `src/types/category/index.ts`
**API** : `src/api/category/CategoryApi.ts`
**Service** : `src/service/category/CategoryService.ts`
**Mapper** : `src/mappers/category/index.ts`

---

## 2. Product

| Champ                                   | Type TS                | Description                            |
| --------------------------------------- | ---------------------- | -------------------------------------- |
| `id`                                    | `number`               | Identifiant unique                     |
| `id_manufacturer`                       | `number`               | ID fabricant                           |
| `id_supplier`                           | `number`               | ID fournisseur                         |
| `id_category_default`                   | `number`               | Catégorie par défaut                   |
| `id_default_image`                      | `string`               | Image par défaut                       |
| `id_default_combination`                | `number`               | Combinaison par défaut                 |
| `id_tax_rules_group`                    | `number`               | Groupe de règles fiscales              |
| `reference`                             | `string`               | Référence produit (SKU)                |
| `price`                                 | `number`               | Prix de vente                          |
| `wholesale_price`                       | `number`               | Prix d'achat (gros)                    |
| `width` / `height` / `depth` / `weight` | `number`               | Dimensions                             |
| `active`                                | `number`               | Actif (0 ou 1)                         |
| `on_sale`                               | `number`               | En promotion                           |
| `online_only`                           | `number`               | Exclusivité web                        |
| `available_for_order`                   | `number`               | Commandable                            |
| `available_date`                        | `string`               | Date de disponibilité                  |
| `condition`                             | `string`               | `new` / `used` / `refurbished`         |
| `visibility`                            | `string`               | `both` / `catalog` / `search` / `none` |
| `date_add`                              | `string`               | Date d'ajout                           |
| `date_upd`                              | `string`               | Date de mise à jour                    |
| `name`                                  | `string`               | Nom                                    |
| `description`                           | `string`               | Description longue                     |
| `description_short`                     | `string`               | Description courte                     |
| `meta_title` / `meta_description`       | `string`               | SEO                                    |
| `link_rewrite`                          | `string`               | URL simplifiée                         |
| `images`                                | `string[]`             | URLs des images (calculé)              |
| `category_name`                         | `string`               | Nom catégorie (calculé)                |
| `features`                              | `ProductFeatureItem[]` | Caractéristiques                       |
| `stock_availables`                      | `StockAvailableItem[]` | Stocks                                 |
| `product_bundles`                       | `ProductBundleItem[]`  | Produits liés                          |

**Fichier Type** : `src/types/product/index.ts`
**API** : `src/api/product/ProductApi.ts`
**Service** : `src/service/product/ProductService.ts`
**Mapper** : `src/mappers/product/index.ts`

---

## 3. Combination

| Champ                            | Type TS    | Description                |
| -------------------------------- | ---------- | -------------------------- |
| `id`                             | `number`   | Identifiant unique         |
| `id_product`                     | `number`   | Produit parent             |
| `ean13` / `isbn` / `upc` / `mpn` | `string`   | Codes-barres               |
| `reference`                      | `string`   | Référence                  |
| `supplier_reference`             | `string`   | Réf. fournisseur           |
| `wholesale_price`                | `number`   | Prix de gros               |
| `price`                          | `number`   | Impact prix (différentiel) |
| `ecotax`                         | `number`   | Écotaxe                    |
| `weight`                         | `number`   | Poids                      |
| `unit_price_impact`              | `number`   | Impact prix unitaire       |
| `minimal_quantity`               | `number`   | Quantité minimum           |
| `default_on`                     | `boolean`  | Combinaison par défaut ?   |
| `available_date`                 | `string`   | Date disponibilité         |
| `product_option_value_ids`       | `number[]` | IDs valeurs d'attributs    |
| `image_ids`                      | `number[]` | IDs images                 |

**Fichier Type** : `src/types/combination/index.ts`
**API** : `src/api/combination/CombinationApi.ts`
**Service** : `src/service/combination/CombinationService.ts`

---

## 4. Customer

| Champ                   | Type TS    | Description                           |
| ----------------------- | ---------- | ------------------------------------- |
| `id`                    | `number`   | Identifiant unique                    |
| `id_default_group`      | `number`   | Groupe par défaut                     |
| `id_lang`               | `number`   | Langue                                |
| `id_gender`             | `number`   | Genre (1=H, 2=F)                      |
| `firstname`             | `string`   | Prénom                                |
| `lastname`              | `string`   | Nom                                   |
| `email`                 | `string`   | Adresse email                         |
| `passwd`                | `string`   | Mot de passe (optionnel dans le type) |
| `birthday`              | `string`   | Date de naissance                     |
| `company`               | `string`   | Société                               |
| `siret` / `ape`         | `string`   | SIRET / Code APE                      |
| `website`               | `string`   | Site web                              |
| `active`                | `number`   | Compte actif                          |
| `is_guest`              | `number`   | Compte invité                         |
| `newsletter` / `optin`  | `number`   | Newsletter / Opt-in                   |
| `secure_key`            | `string`   | Clé de sécurité                       |
| `date_add` / `date_upd` | `string`   | Dates                                 |
| `group_ids`             | `number[]` | IDs groupes                           |

**Fichier Type** : `src/types/customer/index.ts`
**API** : `src/api/customer/CustomerApi.ts`
**Service** : `src/service/customer/CustomerService.ts`

---

## 5. Employee

| Champ                                | Type TS  | Description            |
| ------------------------------------ | -------- | ---------------------- |
| `id`                                 | `number` | Identifiant unique     |
| `id_lang`                            | `number` | Langue                 |
| `id_profile`                         | `number` | Profil (1=Admin, etc.) |
| `firstname`                          | `string` | Prénom                 |
| `lastname`                           | `string` | Nom                    |
| `email`                              | `string` | Email (login)          |
| `passwd`                             | `string` | Mot de passe (hashé)   |
| `active`                             | `number` | Actif                  |
| `bo_color` / `bo_theme` / `bo_css`   | `string` | Thème backoffice       |
| `bo_width`                           | `number` | Largeur menu           |
| `default_tab`                        | `number` | Onglet par défaut      |
| `id_last_order` / `id_last_customer` | `number` | Dernières actions      |

**Fichier Type** : `src/types/employee/index.ts`
**API** : `src/api/employee/EmployeeApi.ts`
**Service** : `src/service/employee/EmployeeService.ts`

---

## 6. Cart

| Champ                                  | Type TS     | Description            |
| -------------------------------------- | ----------- | ---------------------- |
| `id`                                   | `number`    | Identifiant unique     |
| `id_address_delivery`                  | `number`    | Adresse de livraison   |
| `id_address_invoice`                   | `number`    | Adresse de facturation |
| `id_currency`                          | `number`    | Devise                 |
| `id_customer`                          | `number`    | Client                 |
| `id_guest`                             | `number`    | Visiteur               |
| `id_lang`                              | `number`    | Langue                 |
| `id_carrier`                           | `number`    | Transporteur           |
| `secure_key`                           | `string`    | Clé sécurité           |
| `delivery_option`                      | `string`    | Option livraison       |
| `gift` / `recyclable` / `mobile_theme` | `boolean`   | Options                |
| `date_add` / `date_upd`                | `string`    | Dates                  |
| `cart_rows`                            | `CartRow[]` | Lignes du panier       |
| `cart_rows[].id_product`               | `number`    | Produit                |
| `cart_rows[].id_product_attribute`     | `number`    | Déclinaison            |
| `cart_rows[].quantity`                 | `number`    | Quantité               |

**Fichier Type** : `src/types/cart/index.ts`
**API** : `src/api/cart/CartApi.ts`
**Service** : `src/service/cart/CartService.ts`

---

## 7. Order

| Champ                                                                       | Type TS      | Description             |
| --------------------------------------------------------------------------- | ------------ | ----------------------- |
| `id`                                                                        | `number`     | Identifiant unique      |
| `id_address_delivery` / `id_address_invoice`                                | `number`     | Adresses                |
| `id_cart`                                                                   | `number`     | Panier source           |
| `id_currency` / `id_lang`                                                   | `number`     | Devise / Langue         |
| `id_customer`                                                               | `number`     | Client                  |
| `id_carrier`                                                                | `number`     | Transporteur            |
| `current_state`                                                             | `number`     | État actuel (1-17)      |
| `module`                                                                    | `string`     | Module de paiement      |
| `payment`                                                                   | `string`     | Mode de paiement        |
| `reference`                                                                 | `string`     | Référence commande      |
| `invoice_number`                                                            | `number`     | N° facture              |
| `invoice_date`                                                              | `string`     | Date facture            |
| `delivery_number`                                                           | `number`     | N° livraison            |
| `delivery_date`                                                             | `string`     | Date livraison          |
| `date_add` / `date_upd`                                                     | `string`     | Dates                   |
| `total_paid`                                                                | `number`     | Total payé              |
| `total_paid_tax_incl`                                                       | `number`     | Total payé TTC          |
| `total_paid_tax_excl`                                                       | `number`     | Total payé HT           |
| `total_paid_real`                                                           | `number`     | Montant réellement payé |
| `total_products`                                                            | `number`     | Total produits          |
| `total_products_wt`                                                         | `number`     | Total produits TTC      |
| `total_shipping` / `total_shipping_tax_incl` / `total_shipping_tax_excl`    | `number`     | Frais port              |
| `total_discounts` / `total_discounts_tax_incl` / `total_discounts_tax_excl` | `number`     | Réductions              |
| `total_wrapping`                                                            | `number`     | Emballage               |
| `conversion_rate`                                                           | `number`     | Taux conversion devise  |
| `note`                                                                      | `string`     | Note                    |
| `order_rows`                                                                | `OrderRow[]` | Lignes commande         |

---

## 8. OrderHistory

| Champ            | Type TS  | Description                         |
| ---------------- | -------- | ----------------------------------- |
| `id`             | `number` | Identifiant (optionnel en création) |
| `id_employee`    | `number` | Employé qui change l'état           |
| `id_order_state` | `number` | Nouvel état (1-17)                  |
| `id_order`       | `number` | Commande concernée                  |
| `date_add`       | `string` | Date du changement                  |

**Fichier Type** : `src/types/order_history/index.ts`
**API** : `src/api/order_history/OrderHistoryApi.ts`
**Service** : `src/service/order_history/OrderHistoryService.ts`

---

## 9. ProductOption

| Champ                      | Type TS    | Description                   |
| -------------------------- | ---------- | ----------------------------- |
| `id`                       | `number`   | Identifiant unique            |
| `is_color_group`           | `number`   | Groupe de couleur ?           |
| `group_type`               | `string`   | Type (select, radio, color)   |
| `position`                 | `number`   | Ordre                         |
| `name`                     | `string`   | Nom (ex: "Taille", "Couleur") |
| `public_name`              | `string`   | Nom public                    |
| `product_option_value_ids` | `number[]` | IDs valeurs                   |

---

## 10. ProductOptionValue

| Champ                | Type TS  | Description            |
| -------------------- | -------- | ---------------------- |
| `id`                 | `number` | Identifiant unique     |
| `id_attribute_group` | `number` | Groupe parent          |
| `color`              | `string` | Code couleur (#RRGGBB) |
| `position`           | `number` | Ordre                  |
| `name`               | `string` | Nom (ex: "M", "Rouge") |

---

## 11. Tax

| Champ     | Type TS  | Description         |
| --------- | -------- | ------------------- |
| `id`      | `number` | Identifiant unique  |
| `rate`    | `number` | Taux (ex: 20.000)   |
| `active`  | `number` | Actif (0 ou 1)      |
| `deleted` | `number` | Supprimé (0 ou 1)   |
| `name`    | `string` | Nom (ex: "TVA 20%") |

---

## 12. TaxRule

| Champ                         | Type TS  | Description            |
| ----------------------------- | -------- | ---------------------- |
| `id`                          | `number` | Identifiant unique     |
| `id_tax_rules_group`          | `number` | Groupe parent          |
| `id_country`                  | `number` | Pays                   |
| `id_state`                    | `number` | Région/État            |
| `id_tax`                      | `number` | Taxe associée          |
| `behavior`                    | `number` | Comportement (0, 1, 2) |
| `zipcode_from` / `zipcode_to` | `string` | Plage codes postaux    |
| `description`                 | `string` | Description            |

---

## 13. TaxRuleGroup

| Champ                   | Type TS  | Description                  |
| ----------------------- | -------- | ---------------------------- |
| `id`                    | `number` | Identifiant unique           |
| `name`                  | `string` | Nom (ex: "FR Standard Rate") |
| `active`                | `number` | Actif                        |
| `deleted`               | `number` | Supprimé                     |
| `date_add` / `date_upd` | `string` | Dates                        |

---

## 🔗 Relations entre entités

```
Category ───< Product ───< Combination ─── ProductOptionValue
                                    │
Customer ───< Cart ───> CartRow ─── Product
    │                                   │
    └───< Order ───> OrderRow ─────────┘
              │
              └───< OrderHistory

TaxRuleGroup ───< TaxRule ─── Tax
```

---

## 🏷️ États de commande

| ID  | État                              | Badge        |
| --- | --------------------------------- | ------------ |
| 1   | En attente du paiement par chèque | ⚠️ warning   |
| 2   | Paiement accepté                  | 🔵 info      |
| 3   | En cours de préparation           | 🔵 info      |
| 4   | Expédié                           | 🔷 primary   |
| 5   | Livré                             | 🟢 success   |
| 6   | Annulé                            | 🔴 danger    |
| 7   | Remboursé                         | ⚫ secondary |
| 8   | Erreur de paiement                | 🔴 danger    |
| 11  | Paiement à distance accepté       | 🟢 success   |

---

_Documentation générée le 14 mai 2026_

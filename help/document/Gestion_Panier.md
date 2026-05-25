## Table des matières

1. [Contexte métier (Fichier 3 — champ `achat`)](#1-contexte-métier-fichier-3--champ-achat)
2. [Endpoint](#2-endpoint)
   - [Méthodes supportées](#méthodes-supportées)
3. [Champs principaux de la ressource `carts`](#3-champs-principaux-de-la-ressource-carts)
4. [Pré-requis avant création d'un panier](#4-pré-requis-avant-création-dun-panier)
5. [Étape 1 — Créer le panier (POST)](#5-étape-1--créer-le-panier-post)
6. [Étape 2 — Ajouter des produits (cart_rows) via PUT](#6-étape-2--ajouter-des-produits-cart_rows-via-put)
   - [Structure de `cart_rows`](#structure-de-cart_rows)
7. [Exemples complets tirés du Fichier 3](#7-exemples-complets-tirés-du-fichier-3)
   - [Commande 1 — Rakoto : T_01 × 3 (ngoza)](#commande-1--rakoto--t_01--3-ngoza)
   - [Commande 2 — Rajao : T_01 × 2 (kely) + C_03 × 1](#commande-2--rajao--t_01--2-kely--c_03--1)
8. [Schéma JSON — Réponse GET (output_format=JSON)](#8-schéma-json--réponse-get-output_formatjson)
9. [Lier un panier à un client — Récapitulatif](#9-lier-un-panier-à-un-client--récapitulatif)

# Gestion_Panier.md — Ressource `carts` · PrestaShop 8.x WebService

## 1. Contexte métier (Fichier 3 — champ `achat`)

Le champ `achat` du Fichier 3 représente le contenu du panier sous la forme :

```
[("reference";quantité;"variante"), ...]
```

| Commande          | Client | Contenu du panier                                  | État                               |
|-------------------|--------|----------------------------------------------------|------------------------------------|
| Commande 1 (ligne 1) | Rakoto | T_01 × 3 (taille ngoza)                        | en attente paiement à la livraison |
| Commande 2 (ligne 2) | Rajao  | T_01 × 2 (taille kely) + C_03 × 1 (sans variante) | paiement accepté                   |
| Commande 3 (ligne 3) | Rakoto | T_01 × 1 (taille kely)                         | erreur de paiement                 |

Chaque ligne représente un panier distinct qui sera transformé en commande.

---

## 2. Endpoint

```
Base URL : https://{SHOP_DOMAIN}/api/carts
Auth     : Basic Auth — clé API en username, mot de passe vide
```

### Méthodes supportées

| Méthode | URL                       | Usage                              | Code retour |
|---------|---------------------------|------------------------------------|-------------|
| GET     | `/api/carts`              | Liste les IDs de paniers           | 200         |
| GET     | `/api/carts/{id}`         | Lit un panier complet              | 200         |
| GET     | `/api/carts?schema=blank` | Gabarit XML vide                   | 200         |
| POST    | `/api/carts`              | Crée un panier                     | 201         |
| PUT     | `/api/carts/{id}`         | Met à jour le panier (corps complet) | 200       |
| DELETE  | `/api/carts/{id}`         | Supprime un panier                 | 200         |

---

## 3. Champs principaux de la ressource `carts`

| Champ                   | Type    | Requis | Description                                         |
|-------------------------|---------|--------|-----------------------------------------------------|
| `id`                    | integer | Auto   | Identifiant généré                                  |
| `id_customer`           | integer | Non    | ID du client (lié à `/api/customers`)               |
| `id_currency`           | integer | Oui    | ID de la devise (ex. 1 = EUR)                       |
| `id_lang`               | integer | Oui    | ID de la langue (ex. 1 = français)                  |
| `id_address_delivery`   | integer | Non    | ID de l'adresse de livraison du client              |
| `id_address_invoice`    | integer | Non    | ID de l'adresse de facturation                      |
| `id_carrier`            | integer | Non    | ID du transporteur                                  |
| `id_shop`               | integer | Non    | ID de la boutique (défaut : 1)                      |
| `secure_key`            | string  | Non    | Clé de sécurité (max 32 chars)                      |
| `recyclable`            | boolean | Non    | Emballage recyclable                                |
| `gift`                  | boolean | Non    | Commande cadeau                                     |
| `gift_message`          | string  | Non    | Message cadeau                                      |
| `date_add`              | datetime| Auto   | Date de création                                    |
| `date_upd`              | datetime| Auto   | Date de modification                                |

---

## 4. Pré-requis avant création d'un panier

Avant de POSTer un panier, les IDs suivants doivent être résolus :

```
1. Client     → GET /api/customers?filter[email]={EMAIL}&display=[id]
2. Adresse    → GET /api/addresses?filter[id_customer]={ID_CLIENT}&display=full
3. Produits   → GET /api/products?filter[reference]={REF}&display=[id]
4. Déclinais. → GET /api/combinations?filter[id_product]={ID}&display=full
5. Devise     → GET /api/currencies?filter[active]=1&display=[id,iso_code]
6. Langue     → GET /api/languages?filter[active]=1&display=[id,iso_code]
```

---

## 5. Étape 1 — Créer le panier (POST)

```xml
<!-- POST /api/carts -->
<!-- Content-Type: application/xml -->

<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id_customer></id_customer>
    <id_currency></id_currency>
    <id_lang></id_lang>
    <id_address_delivery></id_address_delivery>
    <id_address_invoice></id_address_invoice>
    <id_carrier></id_carrier>
    <id_shop></id_shop>
    <recyclable>0</recyclable>
    <gift>0</gift>
    <gift_message></gift_message>
    <secure_key></secure_key>
    <associations>
      <cart_rows/>
    </associations>
  </cart>
</prestashop>
```

**Réponse 201 Created :**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id><![CDATA[15]]></id>
    <id_customer><![CDATA[3]]></id_customer>
    <id_currency><![CDATA[1]]></id_currency>
    <id_lang><![CDATA[1]]></id_lang>
    <id_address_delivery><![CDATA[5]]></id_address_delivery>
    <id_carrier><![CDATA[2]]></id_carrier>
    <date_add><![CDATA[2026-05-09 08:00:00]]></date_add>
    <date_upd><![CDATA[2026-05-09 08:00:00]]></date_upd>
    <associations>
      <cart_rows/>
    </associations>
  </cart>
</prestashop>
```

---

## 6. Étape 2 — Ajouter des produits (cart_rows) via PUT

Après création, le panier est mis à jour en y injectant les `cart_rows` dans l'association. Il faut fournir le corps **complet** du panier.

### Structure de `cart_rows`

| Champ                    | Type    | Requis | Description                                              |
|--------------------------|---------|--------|----------------------------------------------------------|
| `id_product`             | integer | Oui    | ID du produit                                            |
| `id_product_attribute`   | integer | Oui    | ID de la déclinaison (0 si produit sans déclinaison)     |
| `id_address_delivery`    | integer | Oui    | ID de l'adresse de livraison pour cette ligne            |
| `id_customization`       | integer | Non    | ID de personnalisation (0 si aucune)                     |
| `quantity`               | integer | Oui    | Quantité commandée                                       |

```xml
<!-- PUT /api/carts/{ID_PANIER} -->
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart>
    <id></id>
    <id_customer></id_customer>
    <id_currency></id_currency>
    <id_lang></id_lang>
    <id_address_delivery></id_address_delivery>
    <id_address_invoice></id_address_invoice>
    <id_carrier></id_carrier>
    <id_shop></id_shop>
    <recyclable>0</recyclable>
    <gift>0</gift>
    <gift_message></gift_message>
    <secure_key></secure_key>
    <associations>
      <cart_rows>
        <cart_row>
          <id_product></id_product>
          <id_product_attribute></id_product_attribute>
          <id_address_delivery></id_address_delivery>
          <id_customization>0</id_customization>
          <quantity></quantity>
        </cart_row>
      </cart_rows>
    </associations>
  </cart>
</prestashop>
```

---

## 7. Exemples complets tirés du Fichier 3

### Commande 1 — Rakoto : T_01 × 3 (ngoza)

```xml
<!-- PUT /api/carts/{ID} -->
<associations>
  <cart_rows>
    <cart_row>
      <id_product><!-- ID produit T_01 --></id_product>
      <id_product_attribute><!-- ID combinaison T_01/ngoza --></id_product_attribute>
      <id_address_delivery><!-- ID adresse Rakoto --></id_address_delivery>
      <id_customization>0</id_customization>
      <quantity>3</quantity>
    </cart_row>
  </cart_rows>
</associations>
```

### Commande 2 — Rajao : T_01 × 2 (kely) + C_03 × 1

```xml
<!-- PUT /api/carts/{ID} -->
<associations>
  <cart_rows>
    <cart_row>
      <id_product><!-- ID produit T_01 --></id_product>
      <id_product_attribute><!-- ID combinaison T_01/kely --></id_product_attribute>
      <id_address_delivery><!-- ID adresse Rajao --></id_address_delivery>
      <id_customization>0</id_customization>
      <quantity>2</quantity>
    </cart_row>
    <cart_row>
      <id_product><!-- ID produit C_03 --></id_product>
      <id_product_attribute>0</id_product_attribute>
      <id_address_delivery><!-- ID adresse Rajao --></id_address_delivery>
      <id_customization>0</id_customization>
      <quantity>1</quantity>
    </cart_row>
  </cart_rows>
</associations>
```

---

## 8. Schéma JSON — Réponse GET (output_format=JSON)

```json
{
  "cart": {
    "id": "15",
    "id_customer": "3",
    "id_currency": "1",
    "id_lang": "1",
    "id_address_delivery": "5",
    "id_address_invoice": "5",
    "id_carrier": "2",
    "id_shop": "1",
    "recyclable": "0",
    "gift": "0",
    "gift_message": "",
    "secure_key": "",
    "date_add": "2026-05-09 08:00:00",
    "date_upd": "2026-05-09 08:00:00",
    "associations": {
      "cart_rows": [
        {
          "id_product": "42",
          "id_product_attribute": "7",
          "id_address_delivery": "5",
          "id_customization": "0",
          "quantity": "3"
        }
      ]
    }
  }
}
```

---

## 9. Lier un panier à un client — Récapitulatif

```
1. Créer (ou récupérer) le client   → POST /api/customers  → id_customer
2. Créer (ou récupérer) son adresse → POST /api/addresses  → id_address_delivery
3. Créer le panier vide             → POST /api/carts       → id_cart
4. Ajouter les lignes               → PUT  /api/carts/{id}  avec cart_rows
```

> Le panier est ensuite référencé dans la commande via son `id` (champ `id_cart` de la ressource `orders`).

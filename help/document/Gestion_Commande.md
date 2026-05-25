## Table des matières

1. [Contexte métier (Fichier 3 — champ `etat`)](#1-contexte-métier-fichier-3--champ-etat)
2. [Endpoint](#2-endpoint)
   - [Méthodes supportées](#méthodes-supportées)
3. [Champs principaux de la ressource `orders`](#3-champs-principaux-de-la-ressource-orders)
4. [Processus de transformation panier → commande](#4-processus-de-transformation-panier--commande)
5. [Schéma XML — Création d'une commande (POST)](#5-schéma-xml--création-dune-commande-post)
6. [Schéma XML — Réponse après création (201 Created)](#6-schéma-xml--réponse-après-création-201-created)
7. [Schéma JSON — Réponse GET (output_format=JSON)](#7-schéma-json--réponse-get-output_formatjson)
8. [Mise à jour de l'état — `order_histories`](#8-mise-à-jour-de-létat--order_histories)
   - [Champs de `order_histories`](#champs-de-order_histories)
   - [Schéma XML — Création d'un historique (POST)](#schéma-xml--création-dun-historique-post)
   - [Schéma JSON — Réponse (output_format=JSON)](#schéma-json--réponse-output_formatjson)
9. [États de commande disponibles](#9-états-de-commande-disponibles)
10. [Mapping Fichier 3 → états](#10-mapping-fichier-3--états)

# Gestion_Commande.md — Ressource `orders` · PrestaShop 8.x WebService

## 1. Contexte métier (Fichier 3 — champ `etat`)

| Client | Panier                             | État (`etat`)                          | `id_order_state` probable |
|--------|------------------------------------|----------------------------------------|---------------------------|
| Rakoto | T_01 × 3 (ngoza)                  | en attente paiement à la livraison     | 8 (On backorder)          |
| Rajao  | T_01 × 2 (kely) + C_03 × 1       | paiement accepté                       | 2 (Payment accepted)      |
| Rakoto | T_01 × 1 (kely)                   | erreur de paiement                     | 8 ou statut personnalisé  |

> Les IDs d'états exacts dépendent de l'installation PrestaShop. Les récupérer via `GET /api/order_states`.

---

## 2. Endpoint

```
Base URL : https://{SHOP_DOMAIN}/api/orders
Auth     : Basic Auth — clé API en username, mot de passe vide
```

### Méthodes supportées

| Méthode | URL                        | Usage                                      | Code retour |
|---------|----------------------------|--------------------------------------------|-------------|
| GET     | `/api/orders`              | Liste les IDs de commandes                 | 200         |
| GET     | `/api/orders/{id}`         | Lit une commande complète                  | 200         |
| GET     | `/api/orders?schema=blank` | Gabarit XML vide                           | 200         |
| POST    | `/api/orders`              | Crée une commande à partir d'un panier     | 201         |
| PUT     | `/api/orders/{id}`         | Met à jour la commande (corps complet)     | 200         |

> **Limitation :** La ressource `orders` du WebService ne recalcule pas automatiquement les totaux à partir du panier. Tous les montants doivent être fournis dans le corps de la requête POST.

---

## 3. Champs principaux de la ressource `orders`

| Champ                       | Type    | Requis | Description                                                  |
|-----------------------------|---------|--------|--------------------------------------------------------------|
| `id`                        | integer | Auto   | Identifiant généré                                           |
| `id_address_delivery`       | integer | Oui    | ID de l'adresse de livraison                                 |
| `id_address_invoice`        | integer | Oui    | ID de l'adresse de facturation                               |
| `id_cart`                   | integer | Oui    | ID du panier source (lien entre panier et commande)          |
| `id_currency`               | integer | Oui    | ID de la devise                                              |
| `id_lang`                   | integer | Oui    | ID de la langue                                              |
| `id_customer`               | integer | Oui    | ID du client                                                 |
| `id_carrier`                | integer | Oui    | ID du transporteur                                           |
| `current_state`             | integer | Oui    | ID de l'état courant (`id_order_state`)                      |
| `payment`                   | string  | Oui    | Libellé du mode de paiement (ex. "Paiement à la livraison") |
| `module`                    | string  | Oui    | Nom technique du module de paiement (ex. "cod")              |
| `conversion_rate`           | decimal | Oui    | Taux de conversion de la devise (1.0 pour devise principale) |
| `total_paid`                | decimal | Oui    | Total TTC payé                                               |
| `total_paid_real`           | decimal | Oui    | Total réellement encaissé                                    |
| `total_products`            | decimal | Oui    | Total HT des produits                                        |
| `total_products_wt`         | decimal | Oui    | Total TTC des produits                                       |
| `total_discounts`           | decimal | Non    | Total des remises TTC                                        |
| `total_discounts_tax_incl`  | decimal | Non    | Remises TTC                                                  |
| `total_discounts_tax_excl`  | decimal | Non    | Remises HT                                                   |
| `total_shipping`            | decimal | Non    | Frais de port TTC                                            |
| `total_shipping_tax_incl`   | decimal | Non    | Frais de port TTC                                            |
| `total_shipping_tax_excl`   | decimal | Non    | Frais de port HT                                             |
| `total_wrapping`            | decimal | Non    | Frais d'emballage TTC                                        |
| `invoice_number`            | integer | Non    | Numéro de facture (auto si non fourni)                       |
| `invoice_date`              | datetime| Non    | Date de facture                                              |
| `valid`                     | boolean | Non    | Commande validée                                             |
| `date_add`                  | datetime| Auto   | Date de création                                             |

---

## 4. Processus de transformation panier → commande

```
┌─────────────────────────────────────────────────────────┐
│  1. POST /api/carts          → id_cart                  │
│  2. PUT  /api/carts/{id}     → cart_rows renseignées    │
│  3. Calcul des totaux côté client (HT/TTC, taxes)       │
│  4. POST /api/orders         → id_order (201 Created)   │
│  5. POST /api/order_histories → enregistrer l'état      │
└─────────────────────────────────────────────────────────┘
```

> PrestaShop ne convertit pas automatiquement un panier en commande via le WebService (contrairement au front-office). Le champ `id_cart` est un lien de référence ; les totaux financiers doivent être calculés et fournis explicitement.

---

## 5. Schéma XML — Création d'une commande (POST)

```xml
<!-- POST /api/orders -->
<!-- Content-Type: application/xml -->

<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id_address_delivery></id_address_delivery>
    <id_address_invoice></id_address_invoice>
    <id_cart></id_cart>
    <id_currency></id_currency>
    <id_lang></id_lang>
    <id_customer></id_customer>
    <id_carrier></id_carrier>
    <current_state></current_state>
    <payment></payment>
    <module></module>
    <recyclable>0</recyclable>
    <gift>0</gift>
    <gift_message></gift_message>
    <conversion_rate>1.000000</conversion_rate>
    <total_discounts>0.000000</total_discounts>
    <total_discounts_tax_incl>0.000000</total_discounts_tax_incl>
    <total_discounts_tax_excl>0.000000</total_discounts_tax_excl>
    <total_paid></total_paid>
    <total_paid_real>0.000000</total_paid_real>
    <total_paid_tax_incl></total_paid_tax_incl>
    <total_paid_tax_excl></total_paid_tax_excl>
    <total_products></total_products>
    <total_products_wt></total_products_wt>
    <total_shipping>0.000000</total_shipping>
    <total_shipping_tax_incl>0.000000</total_shipping_tax_incl>
    <total_shipping_tax_excl>0.000000</total_shipping_tax_excl>
    <total_wrapping>0.000000</total_wrapping>
    <total_wrapping_tax_incl>0.000000</total_wrapping_tax_incl>
    <total_wrapping_tax_excl>0.000000</total_wrapping_tax_excl>
    <valid>1</valid>
  </order>
</prestashop>
```

## 6. Schéma XML — Réponse après création (201 Created)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id><![CDATA[7]]></id>
    <id_address_delivery xlink:href="https://{SHOP}/api/addresses/5">
      <![CDATA[5]]>
    </id_address_delivery>
    <id_cart xlink:href="https://{SHOP}/api/carts/15">
      <![CDATA[15]]>
    </id_cart>
    <id_currency xlink:href="https://{SHOP}/api/currencies/1">
      <![CDATA[1]]>
    </id_currency>
    <id_customer xlink:href="https://{SHOP}/api/customers/3">
      <![CDATA[3]]>
    </id_customer>
    <current_state xlink:href="https://{SHOP}/api/order_states/8">
      <![CDATA[8]]>
    </current_state>
    <payment><![CDATA[Paiement à la livraison]]></payment>
    <module><![CDATA[cod]]></module>
    <total_paid><![CDATA[37.500000]]></total_paid>
    <total_products><![CDATA[33.615]]></total_products>
    <total_products_wt><![CDATA[37.500000]]></total_products_wt>
    <date_add><![CDATA[2026-05-09 08:00:00]]></date_add>
    <associations>
      <order_rows>
        <order_row>
          <id><![CDATA[1]]></id>
          <id_product><![CDATA[42]]></id_product>
          <id_product_attribute><![CDATA[7]]></id_product_attribute>
          <product_name><![CDATA[Tshirt - taille ngoza]]></product_name>
          <product_quantity><![CDATA[3]]></product_quantity>
          <product_price><![CDATA[11.205084]]></product_price>
          <unit_price_tax_incl><![CDATA[12.500000]]></unit_price_tax_incl>
          <unit_price_tax_excl><![CDATA[11.205084]]></unit_price_tax_excl>
        </order_row>
      </order_rows>
    </associations>
  </order>
</prestashop>
```

## 7. Schéma JSON — Réponse GET (output_format=JSON)

```json
{
  "order": {
    "id": "7",
    "id_address_delivery": "5",
    "id_address_invoice": "5",
    "id_cart": "15",
    "id_currency": "1",
    "id_lang": "1",
    "id_customer": "3",
    "id_carrier": "2",
    "current_state": "8",
    "payment": "Paiement à la livraison",
    "module": "cod",
    "conversion_rate": "1.000000",
    "total_paid": "37.500000",
    "total_paid_real": "0.000000",
    "total_products": "33.615252",
    "total_products_wt": "37.500000",
    "total_shipping": "0.000000",
    "valid": "1",
    "date_add": "2026-05-09 08:00:00",
    "date_upd": "2026-05-09 08:00:00",
    "associations": {
      "order_rows": [
        {
          "id": "1",
          "id_product": "42",
          "id_product_attribute": "7",
          "product_name": "Tshirt - taille ngoza",
          "product_quantity": "3",
          "product_price": "11.205084",
          "unit_price_tax_incl": "12.500000",
          "unit_price_tax_excl": "11.205084"
        }
      ]
    }
  }
}
```

---

## 8. Mise à jour de l'état — `order_histories`

Chaque changement d'état de commande doit être enregistré dans `/api/order_histories`. C'est ce mécanisme qui pilote les emails de notification et les transitions d'état.

### Champs de `order_histories`

| Champ             | Type     | Requis | Description                             |
|-------------------|----------|--------|-----------------------------------------|
| `id_order`        | integer  | Oui    | ID de la commande                       |
| `id_order_state`  | integer  | Oui    | ID du nouvel état                       |
| `id_employee`     | integer  | Non    | ID de l'employé responsable (0 = API)   |
| `date_add`        | datetime | Auto   | Date d'enregistrement de l'historique   |

### Schéma XML — Création d'un historique (POST)

```xml
<!-- POST /api/order_histories -->
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_history>
    <id_order></id_order>
    <id_order_state></id_order_state>
    <id_employee>0</id_employee>
  </order_history>
</prestashop>
```

### Schéma JSON — Réponse (output_format=JSON)

```json
{
  "order_history": {
    "id": "12",
    "id_order": "7",
    "id_order_state": "2",
    "id_employee": "0",
    "date_add": "2026-05-09 09:00:00"
  }
}
```

---

## 9. États de commande disponibles

```
GET /api/order_states?display=full&output_format=JSON
```

États standard PrestaShop (IDs peuvent varier selon l'installation) :

| id | Libellé courant                      |
|----|--------------------------------------|
| 1  | En attente de virement bancaire      |
| 2  | Paiement accepté                     |
| 3  | En cours de préparation              |
| 4  | Expédié                              |
| 5  | Livré                                |
| 6  | Annulé                               |
| 7  | Remboursé                            |
| 8  | Erreur de paiement                   |
| 9  | En attente de paiement PayPal        |

> Toujours vérifier les IDs réels sur l'instance cible avec `GET /api/order_states`.

---

## 10. Mapping Fichier 3 → états

| État CSV                             | Action WebService                                        |
|--------------------------------------|----------------------------------------------------------|
| `en attente paiement à la livraison` | `current_state` = ID état "en attente" + `order_history` |
| `paiement accepté`                   | `current_state` = ID état "paiement accepté" + `order_history` |
| `erreur de paiement`                 | `current_state` = ID état "erreur paiement" + `order_history` |

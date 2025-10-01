// OpenFoodFacts client and parser for shared use across web, RN, and server
// Returns a clean UI model and hides API-specific structure.

import { request } from 'undici'

export type OpenFoodFactsNutriments = {
  energyKcal?: number | null
  fat?: number | null
  saturatedFat?: number | null
  carbohydrates?: number | null
  sugars?: number | null
  fiber?: number | null
  proteins?: number | null
  salt?: number | null
  sodium?: number | null
}

export type ProductUIModel = {
  barcode: string
  productName: string | null
  brands: string | null
  ingredientsText: string | null
  nutriments: OpenFoodFactsNutriments
  allergens: string[]
  labels: string[]
  images: {
    front?: string | null
    ingredients?: string | null
  }
  raw?: any
}

export type ProductLookupResult =
  | { ok: true; product: ProductUIModel }
  | { ok: false; notFound: true }
  | { ok: false; error: string }

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<ProductLookupResult> {
  const sanitized = (barcode || '').trim()
  if (!sanitized) {
    return { ok: false, error: 'Missing barcode' }
  }
  const url = `${OFF_BASE}/${encodeURIComponent(sanitized)}.json`
  try {
    const { body, statusCode } = await request(url, { method: 'GET' })
    if (statusCode >= 500) {
      return { ok: false, error: 'Service unavailable' }
    }
    const json = await body.json()
    if (!json || typeof json !== 'object') {
      return { ok: false, error: 'Invalid response' }
    }
    if (json.status === 0) {
      return { ok: false, notFound: true }
    }
    const product = json.product || {}
    const ui: ProductUIModel = {
      barcode: sanitized,
      productName: nullableString(product.product_name) ?? null,
      brands: nullableString(product.brands) ?? null,
      ingredientsText: nullableString(product.ingredients_text) ?? null,
      nutriments: parseNutriments(product.nutriments || {}),
      allergens: parseAllergens(product),
      labels: parseLabels(product),
      images: {
        front: product.image_front_url || product.image_url || null,
        ingredients: product.image_ingredients_url || null,
      },
      raw: undefined,
    }
    return { ok: true, product: ui }
  } catch (err: any) {
    return { ok: false, error: 'Network error' }
  }
}

function nullableString(value: any): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return null
}

function parseNutriments(n: any): OpenFoodFactsNutriments {
  const toNum = (v: any): number | null => {
    const num = typeof v === 'number' ? v : parseFloat(String(v))
    return Number.isFinite(num) ? num : null
  }
  // OFF uses multiple keys; map common ones
  return {
    energyKcal: toNum(n['energy-kcal_100g'] ?? n.energy_kcal_100g ?? n.energy_100g),
    fat: toNum(n.fat_100g),
    saturatedFat: toNum(n['saturated-fat_100g'] ?? n.saturated_fat_100g),
    carbohydrates: toNum(n.carbohydrates_100g),
    sugars: toNum(n.sugars_100g),
    fiber: toNum(n.fiber_100g),
    proteins: toNum(n.proteins_100g),
    salt: toNum(n.salt_100g),
    sodium: toNum(n.sodium_100g),
  }
}

function parseAllergens(product: any): string[] {
  if (Array.isArray(product.allergens_hierarchy)) {
    return product.allergens_hierarchy.map((s: string) => cleanTag(s))
  }
  if (typeof product.allergens === 'string' && product.allergens.trim().length) {
    return product.allergens
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
  return []
}

function parseLabels(product: any): string[] {
  if (Array.isArray(product.labels_hierarchy)) {
    return product.labels_hierarchy.map((s: string) => cleanTag(s))
  }
  if (typeof product.labels === 'string' && product.labels.trim().length) {
    return product.labels
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
  return []
}

function cleanTag(tag: string): string {
  // OFF uses en:vegan, fr:bio; take part after colon if present
  if (typeof tag !== 'string') return ''
  const idx = tag.indexOf(':')
  if (idx >= 0) return tag.slice(idx + 1)
  return tag
}


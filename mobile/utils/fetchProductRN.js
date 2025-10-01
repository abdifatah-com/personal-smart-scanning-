// React Native client helper to fetch OpenFoodFacts product data
// - Uses AsyncStorage for 24h caching by barcode
// - Supports optional proxy server to avoid CORS and add stability

import AsyncStorage from '@react-native-async-storage/async-storage'

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export async function fetchProductRN(barcode, options = {}) {
  const sanitized = String(barcode || '').trim()
  if (!sanitized) {
    return { ok: false, error: 'Missing barcode' }
  }

  const cacheKey = `product:${sanitized}`
  try {
    const cachedStr = await AsyncStorage.getItem(cacheKey)
    if (cachedStr) {
      const cached = JSON.parse(cachedStr)
      if (cached && Date.now() - cached.ts < ONE_DAY_MS) {
        return cached.data
      }
    }
  } catch {}

  const proxyBase = options.proxyBaseUrl // e.g., http://localhost:4000
  const url = proxyBase
    ? `${proxyBase.replace(/\/$/, '')}/api/product/${encodeURIComponent(sanitized)}`
    : `${OFF_BASE}/${encodeURIComponent(sanitized)}.json`

  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      // If using proxy, the shape is already in UI model; if direct OFF, parse below
      if (proxyBase) {
        const data = await safeJson(res)
        const result = data && typeof data === 'object' ? data : { ok: false, error: 'Unable to fetch product info right now.' }
        await safeSet(cacheKey, result)
        return result
      }
      return { ok: false, error: 'Unable to fetch product info right now.' }
    }

    const json = await res.json()

    if (proxyBase) {
      // Proxy already returns UI model
      await safeSet(cacheKey, json)
      return json
    }

    // Direct OFF response; adapt to UI model
    if (json && json.status === 0) {
      const notFound = { ok: false, notFound: true, message: 'Product not found in database. Try expiry scan.' }
      await safeSet(cacheKey, notFound)
      return notFound
    }

    const product = (json && json.product) || {}
    const data = {
      ok: true,
      product: {
        barcode: sanitized,
        productName: nullableString(product.product_name),
        brands: nullableString(product.brands),
        ingredientsText: nullableString(product.ingredients_text),
        nutriments: parseNutriments(product.nutriments || {}),
        allergens: parseAllergens(product),
        labels: parseLabels(product),
        images: {
          front: product.image_front_url || product.image_url || null,
          ingredients: product.image_ingredients_url || null,
        },
      },
    }
    await safeSet(cacheKey, data)
    return data
  } catch (e) {
    return { ok: false, error: 'Unable to fetch product info right now.' }
  }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function safeSet(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

function nullableString(value) {
  if (typeof value === 'string') {
    const t = value.trim()
    return t.length ? t : null
  }
  return null
}

function parseNutriments(n) {
  const toNum = (v) => {
    const num = typeof v === 'number' ? v : parseFloat(String(v))
    return Number.isFinite(num) ? num : null
  }
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

function parseAllergens(product) {
  if (Array.isArray(product.allergens_hierarchy)) {
    return product.allergens_hierarchy.map((s) => cleanTag(s))
  }
  if (typeof product.allergens === 'string' && product.allergens.trim().length) {
    return product.allergens
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function parseLabels(product) {
  if (Array.isArray(product.labels_hierarchy)) {
    return product.labels_hierarchy.map((s) => cleanTag(s))
  }
  if (typeof product.labels === 'string' && product.labels.trim().length) {
    return product.labels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function cleanTag(tag) {
  if (typeof tag !== 'string') return ''
  const idx = tag.indexOf(':')
  if (idx >= 0) return tag.slice(idx + 1)
  return tag
}


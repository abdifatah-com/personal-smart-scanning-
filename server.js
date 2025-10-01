// Minimal Express proxy for OpenFoodFacts with in-memory caching (24h)
// Run with: npm run server

const express = require('express')
const cors = require('cors')
const { request } = require('undici')

const app = express()
app.use(cors())

const PORT = process.env.PORT || 4000
const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Simple in-memory cache: Map<barcode, { data, ts }>
const cache = new Map()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/product/:barcode', async (req, res) => {
  const barcode = String(req.params.barcode || '').trim()
  if (!barcode) {
    return res.status(400).json({ ok: false, error: 'Missing barcode' })
  }

  const cached = cache.get(barcode)
  if (cached && Date.now() - cached.ts < ONE_DAY_MS) {
    return res.json(cached.data)
  }

  const url = `${OFF_BASE}/${encodeURIComponent(barcode)}.json`
  try {
    const { body, statusCode } = await request(url, { method: 'GET' })
    if (statusCode >= 500) {
      return res.status(503).json({ ok: false, error: 'Service unavailable' })
    }
    const json = await body.json()
    if (!json || typeof json !== 'object') {
      return res.status(502).json({ ok: false, error: 'Invalid response' })
    }
    if (json.status === 0) {
      const notFound = { ok: false, notFound: true, message: 'Product not found in database. Try expiry scan.' }
      cache.set(barcode, { data: notFound, ts: Date.now() })
      return res.status(404).json(notFound)
    }
    const product = json.product || {}
    const data = {
      ok: true,
      product: {
        barcode,
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
    cache.set(barcode, { data, ts: Date.now() })
    res.json(data)
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Unable to fetch product info right now.' })
  }
})

app.listen(PORT, () => {
  console.log(`OpenFoodFacts proxy running on http://localhost:${PORT}`)
})

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


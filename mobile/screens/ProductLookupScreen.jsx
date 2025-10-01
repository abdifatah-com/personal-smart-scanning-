// Example React Native screen to test barcode lookup
// - Input field for manual barcode entry
// - Uses fetchProductRN with AsyncStorage caching
// - Displays loading, error, and product results

import React, { useState } from 'react'
import { View, Text, TextInput, Button, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { fetchProductRN } from '../utils/fetchProductRN'

export default function ProductLookupScreen() {
  const [barcode, setBarcode] = useState('737628064502') // sample UPC
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const onLookup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fetchProductRN(barcode, {
        // Optionally point to your proxy: uncomment when running the server
        // proxyBaseUrl: 'http://10.0.2.2:4000' // Android emulator
        // proxyBaseUrl: 'http://localhost:4000' // iOS simulator
      })
      setResult(data)
      if (!data.ok) {
        if (data.notFound) {
          setError('Product not found in database. Try expiry scan.')
        } else {
          setError(data.error || 'Unable to fetch product info right now.')
        }
      }
    } catch (e) {
      setError('Unable to fetch product info right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Scanning & Verification</Text>
      <Text style={styles.subtitle}>Enter a barcode to fetch product details</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. 737628064502"
        keyboardType="number-pad"
        value={barcode}
        onChangeText={setBarcode}
      />

      <Button title={loading ? 'Loading...' : 'Lookup'} onPress={onLookup} disabled={loading || !barcode.trim()} />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Fetching product…</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {result?.ok && result.product && (
        <View style={styles.card}>
          <Text style={styles.name}>{result.product.productName || 'Unnamed product'}</Text>
          <Text style={styles.meta}>Brand: {result.product.brands || 'Unknown'}</Text>

          <View style={styles.imagesRow}>
            {result.product.images?.front ? (
              <Image source={{ uri: result.product.images.front }} style={styles.image} resizeMode="contain" />
            ) : null}
            {result.product.images?.ingredients ? (
              <Image source={{ uri: result.product.images.ingredients }} style={styles.image} resizeMode="contain" />
            ) : null}
          </View>

          <Text style={styles.section}>Ingredients</Text>
          <Text style={styles.text}>{result.product.ingredientsText || '—'}</Text>

          <Text style={styles.section}>Nutriments per 100g</Text>
          <Text style={styles.text}>
            Energy: {nullableNum(result.product.nutriments.energyKcal, 'kcal')}{'\n'}
            Fat: {nullableNum(result.product.nutriments.fat, 'g')}{'\n'}
            Saturated Fat: {nullableNum(result.product.nutriments.saturatedFat, 'g')}{'\n'}
            Carbs: {nullableNum(result.product.nutriments.carbohydrates, 'g')}{'\n'}
            Sugars: {nullableNum(result.product.nutriments.sugars, 'g')}{'\n'}
            Fiber: {nullableNum(result.product.nutriments.fiber, 'g')}{'\n'}
            Proteins: {nullableNum(result.product.nutriments.proteins, 'g')}{'\n'}
            Salt: {nullableNum(result.product.nutriments.salt, 'g')}{'\n'}
            Sodium: {nullableNum(result.product.nutriments.sodium, 'g')}
          </Text>

          <Text style={styles.section}>Allergens</Text>
          <Text style={styles.text}>{(result.product.allergens || []).join(', ') || '—'}</Text>

          <Text style={styles.section}>Labels</Text>
          <Text style={styles.text}>{(result.product.labels || []).join(', ') || '—'}</Text>
        </View>
      )}
    </ScrollView>
  )
}

function nullableNum(n, unit) {
  if (typeof n === 'number' && Number.isFinite(n)) {
    return `${n} ${unit}`
  }
  return '—'
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#555', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  loadingText: { marginLeft: 8 },
  error: { color: '#b00020', marginTop: 12 },
  card: { marginTop: 16, backgroundColor: '#fff', borderRadius: 8, padding: 12, elevation: 1 },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { color: '#555', marginBottom: 8 },
  imagesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  image: { width: 120, height: 120, backgroundColor: '#f5f5f5', borderRadius: 6 },
  section: { marginTop: 10, fontWeight: '600' },
  text: { color: '#333', marginTop: 4 },
})


import { NextRequest } from "next/server";

type LookupResult = {
  product_name: string | null;
  brand: string | null;
  expiry_date?: string | null;
  is_expired?: boolean | null;
  source: "openfoodfacts" | "openfda" | "openbeautyfacts";
};

async function fetchFromOpenFoodFacts(barcode: string): Promise<LookupResult | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const resp = await fetch(url, { next: { revalidate: 3600 } });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data && data.product) {
    return {
      product_name: data.product.product_name || null,
      brand: (data.product.brands || "").split(",")[0] || null,
      expiry_date: data.product.expiration_date || null,
      is_expired: data.product.expiration_date ? (new Date(data.product.expiration_date) < new Date()) : null,
      source: "openfoodfacts" as const,
    };
  }
  return null;
}

async function fetchFromOpenBeautyFacts(barcode: string): Promise<LookupResult | null> {
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const resp = await fetch(url, { next: { revalidate: 3600 } });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data && data.product) {
    return {
      product_name: data.product.product_name || null,
      brand: (data.product.brands || "").split(",")[0] || null,
      expiry_date: data.product.expiration_date || null,
      is_expired: data.product.expiration_date ? (new Date(data.product.expiration_date) < new Date()) : null,
      source: "openbeautyfacts" as const,
    };
  }
  return null;
}

async function fetchFromOpenFDA(barcode: string): Promise<LookupResult | null> {
  // Try UPC match on drug/label; UPC coverage is incomplete
  const upcUrl = `https://api.fda.gov/drug/label.json?search=upc:%22${encodeURIComponent(barcode)}%22&limit=1`;
  let resp = await fetch(upcUrl, { next: { revalidate: 3600 } });
  if (resp.ok) {
    const data = await resp.json().catch(() => null);
    const result = data?.results?.[0];
    if (result) {
      return {
        product_name: result.openfda?.generic_name?.[0] || result.openfda?.brand_name?.[0] || null,
        brand: result.openfda?.brand_name?.[0] || null,
        source: "openfda" as const,
      };
    }
  }

  // If UPC fails, try searching NDC catalog via product_ndc directly as requested
  const ndcUrl = `https://api.fda.gov/drug/ndc.json?search=product_ndc:%22${encodeURIComponent(barcode)}%22&limit=1`;
  resp = await fetch(ndcUrl, { next: { revalidate: 3600 } });
  if (resp.ok) {
    const data = await resp.json().catch(() => null);
    const result = data?.results?.[0];
    if (result) {
      return {
        product_name: result.generic_name || result.brand_name || null,
        brand: result.brand_name || null,
        source: "openfda" as const,
      };
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const barcode = body?.barcode as string | undefined;
  const category = (body?.category as "food" | "medicine" | "cosmetic" | undefined) ?? undefined;
  if (!barcode) {
    return new Response(JSON.stringify({ error: "barcode required" }), { status: 400 });
  }

  // Try in order depending on category; fall back across others
  const tryOrder: Array<(b: string) => Promise<LookupResult | null>> = (() => {
    switch (category) {
      case 'food':
        return [fetchFromOpenFoodFacts, fetchFromOpenBeautyFacts, fetchFromOpenFDA];
      case 'medicine':
        return [fetchFromOpenFDA, fetchFromOpenFoodFacts, fetchFromOpenBeautyFacts];
      case 'cosmetic':
        return [fetchFromOpenBeautyFacts, fetchFromOpenFoodFacts, fetchFromOpenFDA];
      default:
        return [fetchFromOpenFoodFacts, fetchFromOpenBeautyFacts, fetchFromOpenFDA];
    }
  })();

  let result: LookupResult | null = null;
  for (const fn of tryOrder) {
    result = await fn(barcode);
    if (result) break;
  }

  if (!result) {
    return new Response(JSON.stringify({ notFound: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ barcode, ...result }), { status: 200 });
}

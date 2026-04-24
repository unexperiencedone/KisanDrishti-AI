/**
 * KisanDrishti AI - Shared API Client & React Hooks
 * All backend communication goes through this file.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

// ─── Generic fetcher ───────────────────────────────────────────────────────────

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${detail}`);
  }
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WeatherDay = {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_mm: number;
  precip_prob_pct: number;
  weather_code: number;
  safe_hours: string;
  sunrise?: string;
  sunset?: string;
};

export type WeatherForecast = {
  latitude: number;
  longitude: number;
  daily: WeatherDay[];
  today_hourly: { 
    time: string; 
    temp: number; 
    precip_mm: number;
    humidity?: number;
    wind_speed?: number;
  }[];
  current_units?: Record<string, string>;
};

export type WeatherResponse = {
  region: string;
  weather_forecast: WeatherForecast;
  ai_report?: string;
};

export type CommodityPrice = {
  commodity: string;
  price: number;
  unit: string;
  change_pct: number;
  trend: "up" | "down" | "stable";
  source: string;
  min_price?: number;
  max_price?: number;
  market?: string;
  date?: string;
};

export type MarketPricesResponse = {
  region: string;
  as_of: string;
  source: string;
  commodities: CommodityPrice[];
};

export type Alert = {
  id: string;
  type: "Weather" | "Irrigation" | "Pest" | string;
  severity: "high" | "medium" | "info";
  title: string;
  message: string;
  icon: string;
  color: string;
  timestamp: string;
};

export type AlertsResponse = {
  region: string;
  generated_at: string;
  total: number;
  alerts: Alert[];
};

export type SoilInput = {
  n_kg_ha: number;
  p_kg_ha: number;
  k_kg_ha: number;
  ph: number;
  ec_ds_m: number;
  oc_pct: number;
  zn_ppm: number;
  fe_ppm: number;
  s_ppm: number;
  fym_t_ha: number;
  compost_t_ha: number;
};

export type RecommendationRequest = {
  crop_name: string;
  target_yield_q_ha: number;
  region: string;
  soil_type: string;
  is_irrigated: boolean;
  language: string;
  farm_size: number;
  farm_unit: string;
  soil: SoilInput;
};

export type ProductResponse = {
  product_name: string;
  nutrient_source: string;
  kg_per_ha: number;
  bags_per_acre: number;
  is_organic: boolean;
  application_timing: string;
  notes: string;
};

export type RecommendationResponse = {
  status: string;
  recommendation_id: string;
  soil_health: Record<string, string>;
  priority_issues: { parameter: string; severity: string; action: string }[];
  is_cultivable: boolean;
  limiting_nutrient: string | null;
  prescription: { n_kg_ha: number; p_kg_ha: number; k_kg_ha: number; zn_kg_ha: number };
  products: ProductResponse[];
  organic_products: ProductResponse[];
  amendments: ProductResponse[];
  confidence_score: number;
  explanation: string;
  warnings: string[];
  weather_forecast: WeatherForecast | null;
};

// ─── Weather Cache ──────────────────────────────────────────────────────────
const weatherCache: Record<string, { data: WeatherResponse; timestamp: number }> = {};
const WEATHER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const api = {
  weather: async (region: string, language: string = "en"): Promise<WeatherResponse> => {
    const cached = weatherCache[region];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < WEATHER_CACHE_DURATION)) {
      console.log(`[Cache] Returning weather for ${region} from cache`);
      return cached.data;
    }

    const data = await get<WeatherResponse>("/api/v1/weather/", { region, language });
    weatherCache[region] = { data, timestamp: now };
    return data;
  },

  getWeatherCached: (region: string) => {
    const cached = weatherCache[region];
    const now = Date.now();
    if (cached && (now - cached.timestamp < WEATHER_CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  marketPrices: (region: string) =>
    get<MarketPricesResponse>("/api/v1/market-prices/", { region }),

  alerts: (region: string) =>
    get<AlertsResponse>("/api/v1/alerts/", { region }),

  recommend: (body: RecommendationRequest) =>
    post<RecommendationResponse>("/api/v1/recommendations", body),

  dealers: (product: string) =>
    get<{ dealers: { name: string; district: string; phone?: string }[] }>(
      "/api/v1/dealers",
      { product }
    ),

  crops: () => get<{ crops: { name: string }[] }>("/api/v1/crops"),

  chat: (message: string, language: string = "en") =>
    post<{ response: string }>("/api/v1/chat/", { message, language }),
    
  farmSummary: () => get<{
    farm_name: string;
    district: string;
    irrigation_type: string;
    recent_recommendations: Array<{
      id: string;
      created_at: string;
      n_kg: number;
      p_kg: number;
      k_kg: number;
    }>;
  }>("/api/v1/farm/summary"),
};

// ─── WMO Weather Code → Icon mapping ──────────────────────────────────────────

export function wmoToIcon(code: number): "sun" | "cloud" | "rain" | "storm" | "snow" {
  if (code === 0 || code === 1) return "sun";
  if (code <= 3) return "cloud";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  return "storm";
}

/** Returns current humidity/wind from first hourly record (approximate) */
export function extractCurrentConditions(forecast: WeatherForecast | null) {
  const today = forecast?.daily?.[0];
  return {
    tempMax: today?.temp_max ?? 31,
    tempMin: today?.temp_min ?? 22,
    precipitation: today?.precipitation_mm ?? 0,
    precipProb: today?.precip_prob_pct ?? 0,
    weatherCode: today?.weather_code ?? 0,
  };
}

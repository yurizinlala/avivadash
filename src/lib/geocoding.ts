/**
 * Geocoding utility using Nominatim (OpenStreetMap).
 * Nominatim is useful, but house-level precision is not guaranteed for every
 * Brazilian address. Prefer structured searches and keep manual map adjustment
 * available when the returned point is only street-level.
 */

export interface CellAddressInput {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  precision: "house" | "street" | "area" | "approximate";
  confidence: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
  importance?: number;
  place_rank?: number;
  class?: string;
  type?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
}

interface ScoredResult {
  result: NominatimResult;
  score: number;
  precision: GeocodingResult["precision"];
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function hasMinimumAddress(address: CellAddressInput) {
  return Boolean(address.street && address.city && address.state);
}

function streetTokensMatch(resultStreet: string | undefined, expectedStreet: string | null | undefined) {
  const result = normalizeText(resultStreet);
  const expected = normalizeText(expectedStreet);

  if (!result || !expected) return false;
  if (result.includes(expected) || expected.includes(result)) return true;

  const expectedTokens = expected
    .split(" ")
    .filter((token) => token.length > 2 && !["rua", "avenida", "av"].includes(token));

  if (expectedTokens.length === 0) return false;
  return expectedTokens.every((token) => result.includes(token));
}

function localityMatches(result: NominatimResult, address: CellAddressInput) {
  const found = normalizeText(
    result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.address?.municipality ??
      result.address?.city_district
  );
  const expected = normalizeText(address.city);

  return Boolean(found && expected && (found.includes(expected) || expected.includes(found)));
}

function neighborhoodMatches(result: NominatimResult, address: CellAddressInput) {
  const found = normalizeText(
    result.address?.suburb ??
      result.address?.neighbourhood ??
      result.address?.city_district
  );
  const expected = normalizeText(address.neighborhood);

  return Boolean(found && expected && (found.includes(expected) || expected.includes(found)));
}

function stateMatches(result: NominatimResult, address: CellAddressInput) {
  const found = normalizeText(result.address?.state);
  const expected = normalizeText(address.state);

  if (!found || !expected) return false;
  return found.includes(expected) || expected.includes(found);
}

function postcodeMatches(result: NominatimResult, address: CellAddressInput) {
  const found = onlyDigits(result.address?.postcode);
  const expected = onlyDigits(address.cep);

  return Boolean(found && expected && found === expected);
}

function scoreResult(result: NominatimResult, address: CellAddressInput): ScoredResult {
  const road =
    result.address?.road ??
    result.address?.pedestrian ??
    result.address?.footway ??
    result.address?.path;
  const expectedNumber = normalizeText(address.number);
  const foundNumber = normalizeText(result.address?.house_number);
  const hasExactNumber = Boolean(expectedNumber && foundNumber && expectedNumber === foundNumber);
  const hasStreetMatch = streetTokensMatch(road, address.street);

  let score = 0;
  let precision: GeocodingResult["precision"] = "approximate";

  if (hasExactNumber) {
    score += 60;
    precision = "house";
  }

  if (hasStreetMatch) {
    score += 35;
    if (precision !== "house") precision = "street";
  }

  if (postcodeMatches(result, address)) score += 25;
  if (localityMatches(result, address)) score += 15;
  if (neighborhoodMatches(result, address)) score += 10;
  if (stateMatches(result, address)) score += 8;

  if (["building", "place"].includes(result.class ?? "")) score += 4;
  if (["house", "residential", "apartments", "yes"].includes(result.type ?? "")) score += 4;
  if (result.importance) score += Math.min(result.importance * 10, 8);
  if (result.place_rank) score += Math.max(0, 5 - Math.abs(30 - result.place_rank) / 6);

  if (precision === "approximate" && (localityMatches(result, address) || neighborhoodMatches(result, address))) {
    precision = "area";
  }

  return { result, score, precision };
}

async function searchNominatim(params: URLSearchParams): Promise<NominatimResult[]> {
  params.set("format", "jsonv2");
  params.set("addressdetails", "1");
  params.set("limit", "5");
  params.set("countrycodes", "br");
  params.set("dedupe", "1");
  params.set("accept-language", "pt-BR");

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      "User-Agent": "AvivaDash/1.0 (ieab-gestao)",
    },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as NominatimResult[];
  return Array.isArray(data) ? data : [];
}

function toGeocodingResult(scored: ScoredResult): GeocodingResult | null {
  const latitude = Number.parseFloat(scored.result.lat);
  const longitude = Number.parseFloat(scored.result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: scored.result.display_name ?? "",
    precision: scored.precision,
    confidence: Math.round(scored.score),
  };
}

function pickBest(results: NominatimResult[], address: CellAddressInput) {
  return results
    .map((result) => scoreResult(result, address))
    .sort((a, b) => b.score - a.score)[0];
}

export function formatCellAddress(address: CellAddressInput) {
  return [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function geocodeCellAddress(address: CellAddressInput): Promise<GeocodingResult | null> {
  if (!hasMinimumAddress(address)) return null;

  try {
    const structured = new URLSearchParams();
    structured.set("street", [address.number, address.street].filter(Boolean).join(" "));
    structured.set("city", address.city ?? "");
    structured.set("state", address.state ?? "");
    structured.set("country", "Brasil");
    if (address.cep) structured.set("postalcode", address.cep);

    const structuredResults = await searchNominatim(structured);
    const structuredBest = pickBest(structuredResults, address);
    if (structuredBest && structuredBest.score >= 55) {
      return toGeocodingResult(structuredBest);
    }

    const freeform = new URLSearchParams({
      q: formatCellAddress(address),
    });
    const freeformResults = await searchNominatim(freeform);
    const freeformBest = pickBest([...structuredResults, ...freeformResults], address);

    if (freeformBest && freeformBest.score >= 35) {
      return toGeocodingResult(freeformBest);
    }

    return null;
  } catch {
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim().length < 5) return null;

  try {
    const results = await searchNominatim(new URLSearchParams({ q: address }));
    const first = results[0];
    if (!first) return null;

    return toGeocodingResult({
      result: first,
      score: 0,
      precision: "approximate",
    });
  } catch {
    return null;
  }
}

import { apiRequest } from "@/utils/api";

export interface Devotional {
  id: number;
  title: string;
  subheading?: string;
  verses: string;
  key_verse: string;
  content: string;
  date: Date | string;
  author: string;
  status: string;
  image: string;
  published_at?: Date | string;
  created_by?: string;
  published_by?: string;
  application_note?: string;
  prayer_note?: string;
}

type DevotionalsResponse = {
  status: string;
  data: Devotional[];
};

type DevotionalDetailResponse = {
  success: boolean;
  data: Devotional;
};

export const fetchTodaysDevotional = async (): Promise<Devotional | null> => {
  try {
    const res = (await apiRequest(
      "/devotionals/today",
    )) as DevotionalDetailResponse;
    return res.data;
  } catch (error) {
    return null;
  }
};

export const fetchDevotionals = async (
  page = 1,
  perPage = 10,
): Promise<{ data: Devotional[]; meta?: any }> => {
  const res = (await apiRequest(
    `/devotionals?page=${page}&per_page=${perPage}`,
  )) as any;
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    meta: res?.meta,
  };
};

export const detailDevotional = async (id: string | number): Promise<Devotional> => {
  const cleanId = String(id).trim();

  // If user passes 'today', fetch today's devotional directly
  if (cleanId === "today") {
    const today = await fetchTodaysDevotional();
    if (today) return today;
  }

  // Endpoints to check (plural standard REST, singular fallback, sub-path fallback, user-scoped fallback)
  const candidateEndpoints = [
    `/devotionals/${cleanId}`,
    `/devotionals/${cleanId}/details`,
    `/devotional/${cleanId}/details`,
    `/users/devotional/${cleanId}/details`,
  ];

  let lastError: any = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await apiRequest<any>(endpoint);

      // Extract devotional object whether wrapped in data, devotional, or returned directly
      let item = response;
      if (response && typeof response === "object") {
        if (response.data !== undefined) {
          item = response.data?.devotional || response.data?.data || response.data;
        } else if (response.devotional !== undefined) {
          item = response.devotional;
        }
      }

      if (item && typeof item === "object" && (item.id !== undefined || item.title !== undefined)) {
        return item as Devotional;
      }
    } catch (err: any) {
      lastError = err;
      // If payment is required (402/403 or requires_payment), the devotional route was found and is paywalled!
      if (
        err?.status === 402 ||
        err?.status === 403 ||
        err?.data?.requires_payment === true ||
        String(err?.message || "").toLowerCase().includes("payment required")
      ) {
        throw err;
      }
      // If 404 Not Found, try the next endpoint variant
      if (err?.status === 404) {
        continue;
      }
      console.warn(`[API] Devotional lookup failed at ${endpoint}:`, err?.message || err);
    }
  }

  throw lastError || new Error(`Devotional with ID "${cleanId}" not found`);
};

export const fetchUpcomingDevotionals = async (
  page = 1,
  perPage = 10,
): Promise<{ data: Devotional[]; meta?: any }> => {
  const res = (await apiRequest(
    `/devotionals/upcoming?page=${page}&per_page=${perPage}`,
  )) as any;

  return {
    data: Array.isArray(res?.data) ? res.data : [],
    meta: res?.meta,
  };
};

import { apiRequest } from "../utils/api";

export interface Prayer {
  id: number;
  memory_verse_id?: number | null;
  title: string;
  note: string;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePrayerData {
  memory_verse_id?: number | null;
  title: string;
  note: string;
}

export interface UpdatePrayerData {
  memory_verse_id?: number | null;
  title?: string;
  note?: string;
  is_answered?: boolean;
}

type ApiDataResponse<T> = {
  data: T;
};

const unwrapData = <T>(response: T | ApiDataResponse<T>): T => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiDataResponse<T>).data;
  }

  return response as T;
};

export const getPrayers = async (): Promise<Prayer[]> => {
  try {
    const response = await apiRequest<Prayer[] | ApiDataResponse<Prayer[]>>("/prayers");
    return unwrapData(response);
  } catch (error) {
    throw error;
  }
};

export const createPrayer = async (data: CreatePrayerData): Promise<Prayer> => {
  try {
    const response = await apiRequest<Prayer | ApiDataResponse<Prayer>>("/prayers/store", {
      method: "POST",
      body: data,
    });
    return unwrapData(response);
  } catch (error) {
    throw error;
  }
};

export const updatePrayer = async (
  id: number,
  data: UpdatePrayerData,
): Promise<Prayer> => {
  const response = await apiRequest<Prayer | ApiDataResponse<Prayer>>(`/prayers/${id}/update`, {
    method: "PUT",
    body: data,
  });
  return unwrapData(response);
};

export const showPrayer = async (id: number): Promise<Prayer> => {
  try {
    const response = await apiRequest<Prayer | ApiDataResponse<Prayer>>(`/prayers/${id}/show`);
    return unwrapData(response);
  } catch (error) {
    throw error;
  }
};

export const deletePrayer = async (id: number): Promise<void> => {
  try {
    await apiRequest<void>(`/prayers/${id}/delete`, {
      method: "DELETE",
    });
  } catch (error) {
    throw error;
  }
};

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

export const getPrayers = async (): Promise<Prayer[]> => {
  try {
    const response = await apiRequest<Prayer[]>("/prayers");
    return response.data;
  } catch (error) {
    console.error("Error fetching prayers:", error);
    throw error;
  }
};

export const createPrayer = async (data: CreatePrayerData): Promise<Prayer> => {
  try {
    const response = await apiRequest<Prayer>("/prayers/store", {
      method: "POST",
      body: data,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating prayer:", error);
    throw error;
  }
};

export const updatePrayer = async (
  id: number,
  data: UpdatePrayerData,
): Promise<Prayer> => {
  try {
    const response = await apiRequest<Prayer>(`/prayers/${id}/update`, {
      method: "PUT",
      body: data,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating prayer:", error);
    throw error;
  }
};

export const showPrayer = async (id: number): Promise<Prayer> => {
  try {
    const response = await apiRequest<Prayer>(`/prayers/${id}/show`);
    return response.data;
  } catch (error) {
    console.error("Error fetching prayer:", error);
    throw error;
  }
};

export const deletePrayer = async (id: number): Promise<void> => {
  try {
    await apiRequest<void>(`/prayers/${id}/delete`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting prayer:", error);
    throw error;
  }
};

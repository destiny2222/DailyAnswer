import { apiRequest } from "@/utils/api";

export interface Memory {
  id: number;
  verse_text: string;
  notes: string;
  date: string;
}

type MemoriesResponse = {
  status: string;
  data: Memory[];
};

export const fetchMemories = async (): Promise<Memory[]> => {
  const res = (await apiRequest("/memories")) as MemoriesResponse;
  return Array.isArray(res?.data) ? res.data : [];
};

type MemoryDetailResponse = {
  status: string;
  data: Memory;
};

export const detailMemory = async (id: string): Promise<Memory> => {
  try {
    const response = (await apiRequest(
      `/memories/${id}/details`,
    )) as MemoryDetailResponse;
    return response.data;
  } catch (error) {
    console.error(`Error fetching memory with id ${id}:`, error);
    throw error;
  }
};

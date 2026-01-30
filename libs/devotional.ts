import { apiRequest } from "@/utils/api";

export interface Devotional {
  id: number;
  title: string;
  verses: string;
  key_verse: string;
  content: string;
  date: Date;
  author: string;
  status: string;
  image: string;
  published_at: Date;
  created_by: string;
  published_by: string;
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
    const res = await apiRequest("/devotionals/today") as DevotionalDetailResponse;
    return res.data;
  } catch (error) {
    // console.error("No devotional for today:", error);
    return null;
  }
};

export const fetchDevotionals = async (): Promise<Devotional[]> => {
  const res = (await apiRequest("/devotionals")) as DevotionalsResponse;
  return Array.isArray(res?.data) ? res.data : [];
};


export const detailDevotional = async (id: string): Promise<Devotional> => {
  try {
    const response = (await apiRequest(
      `/devotional/${id}/details`,
    )) as DevotionalDetailResponse;
    return response.data;
  } catch (error) {
    // console.error(`Error fetching devotional with id ${id}:`, error);
    throw error;
  }
};

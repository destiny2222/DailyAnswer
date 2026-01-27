import { apiRequest } from "@/utils/api";

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

type NoteResponse = {
  status: string;
  data: Note[];
};

export const getNotes = async (): Promise<Note[]> => {
  const response = (await apiRequest("/notes")) as NoteResponse;
  return response.data;
};

export const getNote = async (id: number): Promise<Note> => {
  const response = (await apiRequest(`/notes/${id}/show`)) as Note;
  return response;
};

export const createNote = (data: {
  title: string;
  content: string;
}): Promise<Note> => {
  return apiRequest("/notes/store", {
    method: "POST",
    body: data,
    auth: true,
  });
};

export const updateNote = (id: number, data: {
  title: string;
  content: string;
}): Promise<Note> => {
  return apiRequest(`/notes/${id}/update`, {
    method: "PUT",
    body: data,
    auth: true,
  });
};

export const deleteNote = (id: number): Promise<void> => {
  return apiRequest(`/notes/${id}/delete`, {
    method: "DELETE",
    auth: true,
  });
};

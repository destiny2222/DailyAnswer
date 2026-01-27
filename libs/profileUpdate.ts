import { apiRequest } from "../utils/api";

export const changeProfileImage = async (formData: FormData) => {
  const response = await apiRequest("/profile/change-image", {
    method: "POST",
    body: formData,
  });
  return response;
};

export const updateUserProfile = async (profileData: {
  name: string;
  username: string;
  email: string;
}) => {
  const response = await apiRequest("/profile/update", {
    method: "PUT",
    body: profileData,
  });
  return response;
};
export const changePassword = async (passwordData: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}) => {
  const response = await apiRequest("/profile/change-password", {
    method: "POST",
    body: passwordData,
  });
  return response;
};

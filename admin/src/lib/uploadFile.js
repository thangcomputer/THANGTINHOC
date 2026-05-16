import api from './api';

export async function uploadAdminFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData);
  return res.data?.url || res.data?.data?.url || '';
}
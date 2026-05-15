import api from './api';
import toast from 'react-hot-toast';

export async function downloadProtectedFile(apiPath, filename = 'download') {
  try {
    const res = await api.get(apiPath, { responseType: 'blob' });
    const contentType = res.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      toast.error('Khong tai duoc file');
      return;
    }
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error('Khong tai duoc file');
  }
}

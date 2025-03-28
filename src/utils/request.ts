import axios from 'axios';
import config from '@/config';

const send = async (method: 'get' | 'post', route: string, data: unknown, errorMessage: { value: string }) => {
  try {
    const response = await axios({ method, url: `${config.api.baseUrl}${route}`, data, withCredentials: true });
    return response.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = axios.isAxiosError(error) && error.response?.data?.message;
  }
};

export const post = async (url: string, data: unknown, errorMessage: { value: string }) => {
  return await send('post', url, data, errorMessage);
};

export const fetch = async (url: string, errorMessage: { value: string }) => {
  return await send('get', url, null, errorMessage);
};

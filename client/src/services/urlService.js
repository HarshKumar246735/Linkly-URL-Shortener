import { api } from './api';

export const shortenUrl = async (payload) => (await api.post('/urls/shorten', payload)).data.data;
export const listUrls = async (params) => (await api.get('/urls', { params })).data.data;
export const getUrl = async (id) => (await api.get(`/urls/${id}`)).data.data.url;
export const updateUrl = async (id, patch) => (await api.patch(`/urls/${id}`, patch)).data.data.url;
export const deleteUrl = async (id) => { await api.delete(`/urls/${id}`); };

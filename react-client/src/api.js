import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000',
});

export const setAuthToken = (userId) => {
    if (userId) {
        localStorage.setItem('userId', userId);
    } else {
        localStorage.removeItem('userId');
    }
};

export const getAuthToken = () => {
    return localStorage.getItem('userId');
};

export default api;

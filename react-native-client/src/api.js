import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator, use 10.0.2.2. For iOS Simulator, localhost is fine.
// For Physical Device, replace with your PC's IP (e.g., http://192.168.1.5:4000)
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:4000',
    ios: 'http://localhost:4000',
    default: 'http://localhost:4000', // Web
});

const api = axios.create({
    baseURL: BASE_URL,
});

export const setAuthToken = (userId) => {
    // In a real app, use AsyncStorage to persist token
    if (userId) {
        api.defaults.headers.common['Authorization'] = userId;
    }
};

export default api;

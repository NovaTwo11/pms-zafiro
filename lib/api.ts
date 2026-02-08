import axios from 'axios';

// Creamos una instancia centralizada para no repetir la URL
const api = axios.create({
    baseURL: 'http://localhost:5100/api', // La URL de tu Backend .NET
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
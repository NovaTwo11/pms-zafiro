import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // El doble asterisco permite cualquier dominio seguro
            },
            {
                protocol: 'http',
                hostname: '**', // Opcional: Permite HTTP local o sin certificado
            }
        ],
    },
};

export default nextConfig;
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [mensaje, setMensaje] = useState<string>('Cargando conexión...');

  useEffect(() => {
    fetch('http://localhost:4000/api/health')
      .then((res) => res.json())
      .then((data) => setMensaje(data.message))
      .catch(() => setMensaje('Error al conectar con el servidor'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-4">Marketplace Vendido</h1>
      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border">
        <p className="text-xl font-semibold text-green-600 dark:text-green-400">
          {mensaje}
        </p>
      </div>
    </main>
  );
}
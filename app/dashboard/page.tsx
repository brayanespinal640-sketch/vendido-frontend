'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si el token existe
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      // Redirigir a login si no está autenticado
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <p className="p-10 text-center">Verificando sesión...</p>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border text-center">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user.nombre}!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Tu correo es: {user.email}</p>
        
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </main>
  );
}
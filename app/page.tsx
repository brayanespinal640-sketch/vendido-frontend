'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  imagenes: string[];
  tipo_entrega: string;
  user: {
    nombre: string;
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Cargar datos de usuario guardados en sesión
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Obtener la lista de productos disponibles
    fetch('http://localhost:4000/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => console.error('Error al cargar productos:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Barra de Navegación */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">Vendido</Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm font-medium">Hola, {user.nombre}</span>
                <Link
                  href="/vender"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition"
                >
                  + Vender Producto
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:underline"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline">
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Catálogo de Productos (Feed) */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Productos Recientes</h2>

        {loading ? (
          <p className="text-center py-12 text-gray-500">Cargando catálogo...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 mb-4">No hay productos publicados aún.</p>
            {user && (
              <Link href="/vender" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Sé el primero en vender
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Imagen del Producto */}
                  <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {prod.imagenes && prod.imagenes.length > 0 ? (
                      <img
                        src={prod.imagenes[0]}
                        alt={prod.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sin Imagen
                      </div>
                    )}
                    {/* Badge Tipo de Entrega */}
                    <span className="absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {prod.tipo_entrega}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">{prod.titulo}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{prod.descripcion}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">${prod.precio.toFixed(2)}</p>
                  </div>
                </div>

                {/* Vendedor */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Vendedor: {prod.user?.nombre || 'Anónimo'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
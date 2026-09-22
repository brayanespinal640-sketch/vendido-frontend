'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  imagenes: string[];
  tipo_entrega: string;
  user_id: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    foto_perfil?: string;
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      setCurrentUserId(userObj.id);
    }

    fetch(`http://localhost:4000/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Producto no encontrado');
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleContact = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: product?.id,
          vendedor_id: product?.user_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar chat');

      // Redirigir a la pantalla de chat pasando los IDs necesarios
      router.push(`/chat?conversation_id=${data.id}&product_id=${product?.id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-10 text-center">Cargando producto...</p>;
  if (error || !product) return <p className="p-10 text-center text-red-500">{error || 'No encontrado'}</p>;

  const isOwner = currentUserId === product.user_id;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al Feed</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Imagen */}
          <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
            {product.imagenes && product.imagenes.length > 0 ? (
              <img src={product.imagenes[0]} alt={product.titulo} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">Sin Imagen</span>
            )}
          </div>

          {/* Detalles del Producto */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mb-2">
                Entrega: {product.tipo_entrega}
              </span>
              <h1 className="text-3xl font-bold mb-2">{product.titulo}</h1>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">${product.precio.toFixed(2)}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{product.descripcion}</p>

              {/* Área del Vendedor */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2 font-medium">Publicado por:</p>
                <Link
                  href={`/usuario/${product.user_id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600 group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 shrink-0">
                    {product.user?.foto_perfil ? (
                      <img src={product.user.foto_perfil} alt={product.user.nombre} className="w-full h-full object-cover" />
                    ) : (
                      product.user?.nombre?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {product.user?.nombre}
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ver perfil público y opiniones →</span>
                  </div>
                </Link>
              </div>
            </div>

            {!isOwner ? (
              <button
                onClick={handleContact}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition mt-6 flex justify-center items-center gap-2"
              >
                💬 Contactar al vendedor
              </button>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm text-center font-medium mt-6">
                Este es tu producto publicado
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
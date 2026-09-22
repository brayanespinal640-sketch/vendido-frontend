'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Address {
  id: string;
  alias: string;
  direccion: string;
}

interface Product {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  imagenes: string[];
  tipo_entrega: string;
  estado: string;
  user_id: string;
  user: {
    id: string;
    nombre: string;
    email?: string;
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

  // Estados para el Modal de Checkout
  const [showModal, setShowModal] = useState(false);
  const [metodo, setMetodo] = useState<'PRESENCIAL' | 'DELIVERY'>('PRESENCIAL');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const openCheckoutModal = async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    setShowModal(true);

    // Cargar direcciones guardadas del usuario
    try {
      const res = await fetch('http://localhost:4000/api/user/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddresses(data);
        if (data.length > 0) setSelectedAddressId(data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar direcciones:', err);
    }
  };

  const handleConfirmCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token || !product) return;

    setProcessing(true);

    try {
      if (metodo === 'PRESENCIAL') {
        // 1. Iniciar/Obtener Conversación en Backend
        const convRes = await fetch('http://localhost:4000/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ producto_id: product.id, vendedor_id: product.user_id }),
        });
        const convData = await convRes.json();
        if (!convRes.ok) throw new Error(convData.error || 'Error al iniciar conversación');

        // 2. Redirigir al Chat con el mensaje predeterminado
        router.push(
          `/chat?conversation_id=${convData.id}&product_id=${product.id}&init_msg=${encodeURIComponent(
            '¡Hola! Quiero coordinar la entrega presencial de este producto'
          )}`
        );
      } else {
        // Entrega por Delivery
        const checkoutRes = await fetch('http://localhost:4000/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            producto_id: product.id,
            metodo_envio: 'DELIVERY',
            direccion_id: selectedAddressId || undefined,
            nueva_direccion: nuevaDireccion || undefined,
          }),
        });

        const data = await checkoutRes.json();
        if (!checkoutRes.ok) throw new Error(data.error || 'Error al procesar la compra');

        alert('¡Orden solicitada a Delivery exitosamente!');
        setShowModal(false);
        router.push('/perfil');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <p className="p-10 text-center">Cargando producto...</p>;
  if (error || !product) return <p className="p-10 text-center text-red-500">{error || 'Producto no encontrado'}</p>;

  const isOwner = currentUserId === product.user_id;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver al Feed
          </Link>
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
                Modalidad: {product.tipo_entrega}
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
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Ver perfil público y opiniones →
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Acciones de Compra / Estado */}
            {!isOwner && product.estado !== 'VENDIDO' ? (
              <div className="space-y-2 mt-6">
                <button
                  onClick={openCheckoutModal}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex justify-center items-center gap-2"
                >
                  🛍️ Comprar Producto
                </button>
              </div>
            ) : isOwner ? (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-sm text-center font-medium mt-6">
                Este es tu producto publicado
              </div>
            ) : (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm text-center font-medium mt-6">
                Este producto ya ha sido VENDIDO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-bold">Seleccionar Método de Entrega</h2>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                <input
                  type="radio"
                  name="checkout_metodo"
                  checked={metodo === 'PRESENCIAL'}
                  onChange={() => setMetodo('PRESENCIAL')}
                />
                <div>
                  <p className="font-semibold text-sm">Entrega Presencial</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Coordinar punto de encuentro por el chat</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                <input
                  type="radio"
                  name="checkout_metodo"
                  checked={metodo === 'DELIVERY'}
                  onChange={() => setMetodo('DELIVERY')}
                />
                <div>
                  <p className="font-semibold text-sm">Delivery de la App</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Envío directo gestionado por la plataforma</p>
                </div>
              </label>
            </div>

            {/* Selección de Dirección para Delivery */}
            {metodo === 'DELIVERY' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold">Dirección de Envío</label>
                {addresses.length > 0 && (
                  <select
                    className="w-full p-2 border rounded-lg text-sm text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.alias}: {addr.direccion}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="O escribe una nueva dirección..."
                  className="w-full p-2 border rounded-lg text-sm text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={nuevaDireccion}
                  onChange={(e) => setNuevaDireccion(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCheckout}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {processing ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
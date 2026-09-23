'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  monto_total: number;
  estado_envio: string;
  direccion: string;
  created_at: string;
  producto: {
    titulo: string;
    imagenes: string[];
  };
  vendedor: {
    nombre: string;
    telefono: string;
    email: string;
  };
  comprador: {
    nombre: string;
    telefono: string;
    email: string;
  };
}

export default function AdminDeliveryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.tipo_usuario !== 'ADMIN' && parsedUser.tipo_usuario !== 'LOGISTICA') {
      setError('No tienes permisos de administrador para acceder a esta sección.');
      setLoading(false);
      return;
    }

    // Cargar pedidos de delivery
    fetch('http://localhost:4000/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar la lista de logística');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nuevo_estado: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');

      // Actualizar lista local
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado_envio: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-10 text-center">Cargando panel de logística...</p>;
  if (error)
    return (
      <main className="p-10 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <Link href="/" className="text-brand-primary underline">← Volver al inicio</Link>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <Link href="/" className="text-xs text-brand-primary hover:underline">← Volver al Feed</Link>
            <h1 className="text-2xl font-bold">🚚 Panel Interno de Control de Delivery</h1>
            <p className="text-xs text-gray-500">Gestión de envíos de la plataforma en tiempo real</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-brand-primary rounded-full text-xs font-bold">
            {orders.length} Pedidos de Delivery
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-xl border">
            <p className="text-gray-500">No hay pedidos solicitados a Delivery en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-6 justify-between items-start"
              >
                {/* Info del Producto */}
                <div className="flex gap-4 w-full md:w-1/3">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {ord.producto?.imagenes?.[0] ? (
                      <img src={ord.producto.imagenes[0]} alt={ord.producto.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ord.producto?.titulo}</h3>
                    <p className="text-green-600 font-bold text-sm">${ord.monto_total.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">ID Orden: {ord.id.substring(0, 8)}...</p>
                  </div>
                </div>

                {/* Datos de Logística (Recogida vs Entrega) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-1/2 text-xs border-y md:border-y-0 md:border-x border-gray-100 dark:border-gray-700 py-3 md:py-0 md:px-4">
                  <div>
                    <p className="font-bold text-brand-primary mb-1">📍 Datos de Recogida (Vendedor):</p>
                    <p className="font-semibold">{ord.vendedor?.nombre}</p>
                    <p className="text-gray-500">Tel: {ord.vendedor?.telefono || 'No registrado'}</p>
                    <p className="text-gray-500">{ord.vendedor?.email}</p>
                  </div>

                  <div>
                    <p className="font-bold text-green-600 mb-1">🏡 Datos de Entrega (Comprador):</p>
                    <p className="font-semibold">{ord.comprador?.nombre}</p>
                    <p className="text-gray-500">Tel: {ord.comprador?.telefono || 'No registrado'}</p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">
                      Dirección: {ord.direccion || 'Sin dirección especificada'}
                    </p>
                  </div>
                </div>

                {/* Botones de Control de Estado */}
                <div className="w-full md:w-auto flex flex-col items-end gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Estado: {ord.estado_envio}
                  </span>

                  <div className="flex flex-wrap gap-1.5 justify-end mt-2">
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'POR_RECOGER')}
                      className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[11px] font-medium"
                    >
                      Por Recoger
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'EN_BODEGA')}
                      className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[11px] font-medium"
                    >
                      En Bodega
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'EN_CAMINO')}
                      className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[11px] font-medium"
                    >
                      En Camino
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'ENTREGADO')}
                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium"
                    >
                      Entregado
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
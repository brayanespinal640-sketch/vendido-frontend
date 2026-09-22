'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Review {
  id: string;
  calificacion: number;
  comentario: string;
  created_at: string;
  autor: {
    id: string;
    nombre: string;
    foto_perfil: string;
  };
}

interface Product {
  id: string;
  titulo: string;
  precio: number;
  imagenes: string[];
  tipo_entrega: string;
}

interface PublicUser {
  id: string;
  nombre: string;
  foto_perfil: string;
  descripcion: string;
  created_at: string;
  products: Product[];
  reviewsReceived: Review[];
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario de reseña
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUserId(parsed.id);
    }

    fetch(`http://localhost:4000/api/users/${id}/public`)
      .then((res) => {
        if (!res.ok) throw new Error('Vendedor no encontrado');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para dejar una reseña');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ calificacion, comentario }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar reseña');

      // Actualizar la lista local de reseñas
      if (user) {
        setUser({
          ...user,
          reviewsReceived: [data.review, ...user.reviewsReceived],
        });
      }

      setComentario('');
      setCalificacion(5);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-10 text-center">Cargando vendedor...</p>;
  if (error || !user) return <p className="p-10 text-center text-red-500">{error || 'No encontrado'}</p>;

  // Calcular promedio de estrellas
  const promedio =
    user.reviewsReceived.length > 0
      ? (
          user.reviewsReceived.reduce((acc, r) => acc + r.calificacion, 0) /
          user.reviewsReceived.length
        ).toFixed(1)
      : 'Sin calificaciones';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tarjeta Perfil del Vendedor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-primary/10 border-2 border-brand-primary flex items-center justify-center font-bold text-2xl text-brand-primary">
            {user.foto_perfil ? (
              <img src={user.foto_perfil} alt={user.nombre} className="w-full h-full object-cover" />
            ) : (
              user.nombre.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{user.nombre}</h1>
            <p className="text-sm text-gray-500 mb-2">
              Miembro desde: {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {user.descripcion || 'Este vendedor no ha agregado una descripción.'}
            </p>
            <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-semibold">
              ⭐ {promedio} ({user.reviewsReceived.length} opiniones)
            </div>
          </div>
        </div>

        {/* Productos en Venta */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Productos en Venta ({user.products.length})</h2>
          {user.products.length === 0 ? (
            <p className="text-sm text-gray-500">Este usuario no tiene productos disponibles actualmente.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {user.products.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/products/${prod.id}`}
                  className="border rounded-xl p-3 hover:shadow-md transition bg-gray-50 dark:bg-gray-700/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-32 bg-gray-200 rounded-lg overflow-hidden mb-2">
                      {prod.imagenes && prod.imagenes.length > 0 ? (
                        <img src={prod.imagenes[0]} alt={prod.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1">{prod.titulo}</h3>
                    <p className="text-green-600 font-bold text-sm">${prod.precio.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Opiniones y Reseñas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Opiniones sobre el Vendedor</h2>

          {/* Formulario para agregar opinión (si no es su propio perfil) */}
          {currentUserId && currentUserId !== user.id && (
            <form onSubmit={handleAddReview} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border space-y-3">
              <h3 className="text-sm font-semibold">Deja tu recomendación</h3>
              
              <div>
                <label className="block text-xs font-medium mb-1">Puntuación (Estrellas)</label>
                <select
                  value={calificacion}
                  onChange={(e) => setCalificacion(Number(e.target.value))}
                  className="p-2 border rounded-lg text-sm text-gray-900 dark:bg-gray-800 dark:text-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                  <option value={3}>⭐⭐⭐ (3/5)</option>
                  <option value={2}>⭐⭐ (2/5)</option>
                  <option value={1}>⭐ (1/5)</option>
                </select>
              </div>

              <div>
                <textarea
                  required
                  rows={2}
                  placeholder="Escribe tu experiencia con este vendedor..."
                  className="w-full p-2.5 border rounded-lg text-sm text-gray-900 dark:bg-gray-800 dark:text-white"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-brand-primary text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition"
              >
                {submitting ? 'Publicando...' : 'Publicar Opinión'}
              </button>
            </form>
          )}

          {/* Lista de Reseñas */}
          {user.reviewsReceived.length === 0 ? (
            <p className="text-sm text-gray-500">Este vendedor aún no tiene reseñas de compradores.</p>
          ) : (
            <div className="space-y-3">
              {user.reviewsReceived.map((rev) => (
                <div key={rev.id} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{rev.autor?.nombre}</span>
                    <span className="text-xs text-yellow-600 font-bold">
                      {'⭐'.repeat(rev.calificacion)} ({rev.calificacion}/5)
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rev.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
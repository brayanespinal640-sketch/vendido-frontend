'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VenderPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('AMBOS');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Debes iniciar sesión para publicar');

      let imageUrls: string[] = [];

      // 1. Subir la imagen si fue seleccionada
      if (file) {
        const formData = new FormData();
        formData.append('imagen', file);

        const uploadRes = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir la imagen');
        imageUrls.push(uploadData.url);
      }

      // 2. Crear el producto en la base de datos
      const productRes = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          precio: parseFloat(precio),
          tipo_entrega: tipoEntrega,
          imagenes: imageUrls,
        }),
      });

      const productData = await productRes.json();
      if (!productRes.ok) throw new Error(productData.error || 'Error al publicar el producto');

      // Redirigir al Feed principal
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex justify-center items-center">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Publicar Producto</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al Feed</Link>
        </div>

        {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-100 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Título del Producto</label>
            <input
              type="text"
              required
              placeholder="Ej. Silla Gamer Ergonomica"
              className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea
              required
              rows={3}
              placeholder="Detalles sobre el producto, uso, estado..."
              className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Entrega</label>
              <select
                className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value)}
              >
                <option value="AMBOS">Ambos</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fotografía del Producto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition mt-4"
          >
            {loading ? 'Publicando...' : 'Publicar Producto'}
          </button>
        </form>
      </div>
    </main>
  );
}
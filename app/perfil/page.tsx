'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  titulo: string;
  precio: number;
  estado: string;
  imagenes: string[];
  tipo_entrega: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'perfil' | 'productos'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Datos del perfil
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Mis productos
  const [myProducts, setMyProducts] = useState<Product[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Cargar datos del perfil
    fetch('http://localhost:4000/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNombre(data.nombre || '');
        setEmail(data.email || '');
        setTelefono(data.telefono || '');
        setDescripcion(data.descripcion || '');
        setFotoPerfil(data.foto_perfil || '');
      })
      .catch(() => setError('Error al cargar información del perfil'))
      .finally(() => setLoading(false));

    // Cargar mis productos
    fetch('http://localhost:4000/api/user/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMyProducts(data);
      })
      .catch(() => console.error('Error al cargar tus productos'));
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      let uploadedFotoUrl = fotoPerfil;

      // Subir nueva foto si se seleccionó archivo
      if (file) {
        const formData = new FormData();
        formData.append('imagen', file);

        const uploadRes = await fetch('http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir la imagen');
        uploadedFotoUrl = uploadData.url;
      }

      // Actualizar usuario en backend
      const res = await fetch('http://localhost:4000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          telefono,
          descripcion,
          foto_perfil: uploadedFotoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');

      setFotoPerfil(uploadedFotoUrl);
      setSuccessMsg('Perfil actualizado exitosamente');
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-10 text-center">Cargando perfil...</p>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Encabezado */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <Link href="/" className="text-xs text-brand-primary hover:underline">← Volver al Feed</Link>
            <h1 className="text-2xl font-bold">Mi Perfil y Publicaciones</h1>
          </div>
        </div>

        {/* Navegación por pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={() => setTab('perfil')}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${
              tab === 'perfil'
                ? 'border-b-2 border-brand-primary text-brand-primary bg-white dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Datos del Perfil
          </button>
          <button
            onClick={() => setTab('productos')}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${
              tab === 'productos'
                ? 'border-b-2 border-brand-primary text-brand-primary bg-white dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Mis Productos Publicados ({myProducts.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: EDITAR PERFIL */}
          {tab === 'perfil' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl mx-auto">
              {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
              {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{successMsg}</div>}

              {/* Foto de perfil actual */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{nombre.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cambiar Foto de Perfil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico (Solo lectura)</label>
                <input
                  type="email"
                  disabled
                  className="w-full p-2.5 rounded-lg border bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                  value={email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="Ej. +504 9999-8888"
                  className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción Personal / Bio</label>
                <textarea
                  rows={3}
                  placeholder="Cuéntale a los compradores sobre ti o tu tienda..."
                  className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-brand-primary hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          )}

          {/* TAB 2: MIS PRODUCTOS */}
          {tab === 'productos' && (
            <div>
              {myProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Aún no has publicado ningún producto.</p>
                  <Link
                    href="/vender"
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold"
                  >
                    + Publicar Mi Primer Producto
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myProducts.map((prod) => (
                    <div key={prod.id} className="border rounded-xl p-3 flex flex-col justify-between bg-white dark:bg-gray-700">
                      <div>
                        <div className="h-32 bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                          {prod.imagenes && prod.imagenes.length > 0 ? (
                            <img src={prod.imagenes[0]} alt={prod.titulo} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                          )}
                          <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            prod.estado === 'VENDIDO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {prod.estado}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1">{prod.titulo}</h3>
                        <p className="text-green-600 font-bold text-sm">${prod.precio.toFixed(2)}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t flex justify-between items-center text-xs">
                        <span className="text-gray-400">Entrega: {prod.tipo_entrega}</span>
                        <Link href={`/products/${prod.id}`} className="text-brand-primary hover:underline font-medium">Ver →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
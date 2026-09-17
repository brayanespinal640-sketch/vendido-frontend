'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const validateClientSide = () => {
    const clientErrors: string[] = [];

    // 1. Validar Nombre (solo letras y espacios)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!form.nombre.trim()) {
      clientErrors.push('El nombre es obligatorio.');
    } else if (!nameRegex.test(form.nombre)) {
      clientErrors.push('El nombre solo puede contener letras y espacios (sin símbolos ni números).');
    }

    // 2. Validar Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      clientErrors.push('Ingresa un correo electrónico válido.');
    }

    // 3. Validar Contraseña (Min 8, 1 mayúscula, 1 número, 1 símbolo)
    if (form.password.length < 8) {
      clientErrors.push('La contraseña debe tener al menos 8 caracteres.');
    }
    if (!/[A-Z]/.test(form.password)) {
      clientErrors.push('La contraseña debe incluir al menos una letra mayúscula.');
    }
    if (!/[0-9]/.test(form.password)) {
      clientErrors.push('La contraseña debe incluir al menos un número.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
      clientErrors.push('La contraseña debe incluir al menos un símbolo especial (!@#$%^&*).');
    }

    return clientErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Ejecutar validaciones en el cliente
    const clientValidationErrors = validateClientSide();
    if (clientValidationErrors.length > 0) {
      setErrors(clientValidationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || [data.error] || ['Error al registrar usuario']);
        return;
      }

      router.push('/login');
    } catch (err: any) {
      setErrors(['Error de conexión con el servidor']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Crear Cuenta</h1>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-xs font-bold text-red-700 mb-1">Por favor corrige los siguientes errores:</p>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Perez"
              className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="ejemplo@correo.com"
              className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contraseña</label>
            <input
              type="password"
              required
              placeholder="Min. 8 caract, Mayúscula, Número y Símbolo"
              className="w-full p-2.5 rounded-lg border text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </main>
  );
}
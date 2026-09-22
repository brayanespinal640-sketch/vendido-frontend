'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

interface Message {
  id?: string;
  conversation_id: string;
  emisor_id: string;
  contenido: string;
  created_at?: string;
  emisor?: { nombre: string };
}

interface ProductInfo {
  id: string;
  user_id: string;
  titulo: string;
  precio: number;
  tipo_entrega: string;
  estado: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation_id');
  const productId = searchParams.get('product_id');
  const initMsg = searchParams.get('init_msg');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('DELIVERY');
  const [direccion, setDireccion] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);

    if (productId) {
      fetch(`http://localhost:4000/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => setProduct(data))
        .catch((err) => console.error(err));
    }

    if (conversationId) {
      fetch(`http://localhost:4000/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch((err) => console.error(err));
    }

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    if (conversationId) {
      newSocket.emit('join_room', conversationId);

      // Enviar mensaje inicial automático si viene especificado en la URL
      if (initMsg && currentUser) {
        newSocket.emit('send_message', {
          conversation_id: conversationId,
          emisor_id: currentUser.id,
          contenido: decodeURIComponent(initMsg),
        });
      }
    }

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId, productId, router, initMsg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !conversationId || !user) return;

    const messageData = {
      conversation_id: conversationId,
      emisor_id: user.id,
      contenido: newMessage,
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleConfirmOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token || !product) return;

    setProcessingOrder(true);
    try {
      const res = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: product.id,
          metodo_envio: metodoSeleccionado,
          direccion: metodoSeleccionado === 'DELIVERY' ? direccion : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar orden');

      alert(`¡Compra confirmada! Estado: ${data.order.estado_envio}`);
      setProduct({ ...product, estado: 'VENDIDO' });
      setShowOrderModal(false);

      // Notificar por chat la confirmación
      if (socket && conversationId && user) {
        socket.emit('send_message', {
          conversation_id: conversationId,
          emisor_id: user.id,
          contenido: `system: ¡Compra realizada con exito! Metodo de entrega: ${metodoSeleccionado}.`,
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  const isBuyer = user && product && user.id !== product.user_id;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-between max-w-2xl mx-auto shadow-lg border border-gray-200 dark:border-gray-800 relative">
      {/* Cabecera con selector de entrega */}
      <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10">
        <div>
          <Link href="/" className="text-xs text-blue-600 hover:underline">← Volver al inicio</Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {product ? product.titulo : 'Chat de Negociación'}
          </h1>
          {product && (
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="font-semibold text-green-600">${product.precio.toFixed(2)}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                {product.estado === 'VENDIDO' ? 'VENDIDO' : `Modalidad: ${product.tipo_entrega}`}
              </span>
            </p>
          )}
        </div>

        {isBuyer && product?.estado !== 'VENDIDO' && (
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            🛒 Comprar / Acordar Entrega
          </button>
        )}
      </header>

      {/* Modal de confirmación de entrega */}
      {showOrderModal && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Seleccionar Método de Entrega</h3>
            
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="metodo"
                  value="DELIVERY"
                  checked={metodoSeleccionado === 'DELIVERY'}
                  onChange={(e) => setMetodoSeleccionado(e.target.value)}
                />
                <div>
                  <p className="font-medium text-sm">Delivery de la App</p>
                  <p className="text-xs text-gray-500">La plataforma gestiona el envío directo (PENDIENTE_DE_ENVIO)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="metodo"
                  value="PRESENCIAL"
                  checked={metodoSeleccionado === 'PRESENCIAL'}
                  onChange={(e) => setMetodoSeleccionado(e.target.value)}
                />
                <div>
                  <p className="font-medium text-sm">Entrega Presencial</p>
                  <p className="text-xs text-gray-500">Acuerdan punto de encuentro en el chat (ACORDADO_PRESENCIAL)</p>
                </div>
              </label>
            </div>

            {metodoSeleccionado === 'DELIVERY' && (
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  placeholder="Ej. Calle Principal, Casa #123"
                  className="w-full p-2 border rounded-lg text-sm text-gray-900 dark:bg-gray-700 dark:text-white"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={processingOrder}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"
              >
                {processingOrder ? 'Procesando...' : 'Confirmar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Mensajes estilo WhatsApp */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5] dark:bg-gray-950 min-h-[400px] max-h-[70vh]">
        {messages.map((msg, index) => {
          const isMine = msg.emisor_id === user?.id;
          return (
            <div key={msg.id || index} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-xl text-sm shadow-sm ${
                  isMine
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                {!isMine && (
                  <p className="text-[10px] font-bold text-blue-500 mb-0.5">
                    {msg.emisor?.nombre || 'Vendedor'}
                  </p>
                )}
                <p className="break-words">{msg.contenido}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de envío de mensajes */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Escribe tu mensaje para negociar..."
          className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
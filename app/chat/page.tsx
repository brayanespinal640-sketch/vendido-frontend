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
  emisor?: {
    nombre: string;
  };
}

interface ProductInfo {
  titulo: string;
  precio: number;
  tipo_entrega: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation_id');
  const productId = searchParams.get('product_id');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<ProductInfo | null>(null);
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

    // 1. Obtener detalles del producto involucrado
    if (productId) {
      fetch(`http://localhost:4000/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => setProduct(data))
        .catch((err) => console.error(err));
    }

    // 2. Obtener el historial de mensajes de la conversación
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

    // 3. Inicializar conexión WebSockets con Socket.IO
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    if (conversationId) {
      newSocket.emit('join_room', conversationId);
    }

    // Escuchar mensajes entrantes en tiempo real
    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId, productId, router]);

  useEffect(() => {
    // Auto-scroll al final de los mensajes estilo WhatsApp
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

    // Emitir mensaje por WebSockets
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-between max-w-2xl mx-auto shadow-lg border border-gray-200 dark:border-gray-800">
      {/* Cabecera del Chat */}
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
                Modalidad: {product.tipo_entrega}
              </span>
            </p>
          )}
        </div>
      </header>

      {/* Contenedor de Mensajes (Estilo WhatsApp) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5] dark:bg-gray-950 min-h-[400px] max-h-[70vh]">
        {messages.map((msg, index) => {
          const isMine = msg.emisor_id === user?.id;
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
            >
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

      {/* Formulario para enviar mensajes */}
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
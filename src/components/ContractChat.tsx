import React, { useEffect, useState, useRef } from 'react';

interface ChatProps {
    contractId: number;
    userId: number;
}

const ContractChat: React.FC<ChatProps> = ({ contractId, userId }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        // Connect to WebSocket with Token
        const token = localStorage.getItem('token');
        const wsUrl = `ws://localhost:8000/ws/chat/${contractId}?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Connected to Chat');
            setMessages(prev => [...prev, { text: 'System: Connected to secure chat', sender_id: 0 }]);
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
        };

        ws.current.onclose = () => console.log('Disconnected');

        return () => {
            ws.current?.close();
        };
    }, [contractId, userId]);

    const sendMessage = () => {
        if (ws.current && input.trim()) {
            ws.current.send(input);
            setInput('');
        }
    };

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', background: 'white', marginTop: '1rem' }}>
            <h3>💬 Secure Chat</h3>
            <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        textAlign: msg.sender_id === userId ? 'right' : 'left',
                        marginBottom: '0.5rem'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            background: msg.sender_id === userId ? '#dbeafe' : '#e5e7eb',
                            color: msg.sender_id === userId ? '#1e40af' : 'black',
                            padding: '6px 12px',
                            borderRadius: '12px'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default ContractChat;

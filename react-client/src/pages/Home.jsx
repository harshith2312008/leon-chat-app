import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { LogOut, UserPlus, MessageSquare, Bell, Search, Send } from 'lucide-react';

function Home({ user, onLogout }) {
    const [socket, setSocket] = useState(null);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [view, setView] = useState('chats'); // 'chats', 'search', 'requests'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect Socket
        const newSocket = io('http://localhost:4000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket');
            newSocket.emit('join', user.id);
        });

        newSocket.on('receive_message', (message) => {
            // If message is from selected friend, append to list
            // Note: In real app, check message.senderId to update unread counts or specific chat
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('new_friend_request', () => {
            fetchRequests();
        });

        newSocket.on('friend_request_accepted', () => {
            fetchFriends();
        });

        return () => newSocket.disconnect();
    }, [user.id]);

    useEffect(() => {
        fetchFriends();
        fetchRequests();
    }, [user.id]);

    useEffect(() => {
        if (selectedFriend) {
            fetchMessages(selectedFriend.id);
        }
    }, [selectedFriend]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchFriends = async () => {
        try {
            const res = await api.get(`/friends/${user.id}`);
            setFriends(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get(`/friend-requests/pending/${user.id}`);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (friendId) => {
        try {
            const res = await api.get(`/messages/${user.id}/${friendId}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedFriend || !socket) return;

        const content = messageInput;

        // Emit to server
        socket.emit('private_message', {
            senderId: user.id,
            receiverId: selectedFriend.id,
            content,
        });

        // Optimistic update
        setMessages((prev) => [
            ...prev,
            {
                senderId: user.id,
                receiverId: selectedFriend.id,
                content,
                timestamp: new Date().toISOString(),
            },
        ]);

        setMessageInput('');
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/users/search?query=${query}&userId=${user.id}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const sendFriendRequest = async (receiverId) => {
        try {
            await api.post('/friend-request', {
                senderId: user.id,
                receiverId,
            });
            // Remove from search results to indicate sent
            setSearchResults((prev) => prev.filter(u => u.id !== receiverId));
            alert('Request sent!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request');
        }
    };

    const respondToRequest = async (requestId, status) => {
        try {
            await api.put(`/friend-request/${requestId}`, { status });
            fetchRequests();
            if (status === 'accepted') fetchFriends();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a' }}>
            {/* Sidebar */}
            <div style={{ width: '300px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Leon</h2>
                    <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#666' }}>
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Sidebar Nav */}
                <div style={{ display: 'flex', padding: '10px', gap: '5px' }}>
                    <button
                        onClick={() => setView('chats')}
                        style={{ flex: 1, padding: '8px', background: view === 'chats' ? '#333' : 'transparent', border: 'none', color: 'white', borderRadius: '4px' }}
                    >
                        <MessageSquare size={18} />
                    </button>
                    <button
                        onClick={() => setView('search')}
                        style={{ flex: 1, padding: '8px', background: view === 'search' ? '#333' : 'transparent', border: 'none', color: 'white', borderRadius: '4px' }}
                    >
                        <Search size={18} />
                    </button>
                    <button
                        onClick={() => setView('requests')}
                        style={{ flex: 1, padding: '8px', background: view === 'requests' ? '#333' : 'transparent', border: 'none', color: 'white', borderRadius: '4px', position: 'relative' }}
                    >
                        <Bell size={18} />
                        {requests.length > 0 && (
                            <span style={{ position: 'absolute', top: 0, right: 0, background: 'red', borderRadius: '50%', width: '8px', height: '8px' }} />
                        )}
                    </button>
                </div>

                {/* Sidebar Content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {view === 'chats' && (
                        <div>
                            {friends.map(friend => (
                                <div
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    style={{
                                        padding: '15px',
                                        cursor: 'pointer',
                                        background: selectedFriend?.id === friend.id ? '#333' : 'transparent',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#646cff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {friend.username[0].toUpperCase()}
                                    </div>
                                    <span>{friend.username}</span>
                                </div>
                            ))}
                            {friends.length === 0 && <p style={{ padding: '20px', color: '#666' }}>No friends yet</p>}
                        </div>
                    )}

                    {view === 'search' && (
                        <div style={{ padding: '10px' }}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ width: '100%', padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }}
                            />
                            <div style={{ marginTop: '10px' }}>
                                {searchResults.map(u => (
                                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', alignItems: 'center' }}>
                                        <span>{u.username}</span>
                                        <button onClick={() => sendFriendRequest(u.id)} style={{ background: 'none', border: 'none', color: '#646cff' }}>
                                            <UserPlus size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'requests' && (
                        <div>
                            {requests.map(req => (
                                <div key={req.id} style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                                    <p style={{ margin: '0 0 10px 0' }}>Request from <strong>{req.username}</strong></p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => respondToRequest(req.id, 'accepted')} style={{ flex: 1, background: '#646cff', border: 'none', color: 'white', padding: '6px', borderRadius: '4px' }}>Accept</button>
                                        <button onClick={() => respondToRequest(req.id, 'rejected')} style={{ flex: 1, background: '#333', border: 'none', color: 'white', padding: '6px', borderRadius: '4px' }}>Reject</button>
                                    </div>
                                </div>
                            ))}
                            {requests.length === 0 && <p style={{ padding: '20px', color: '#666' }}>No pending requests</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedFriend ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #333', background: '#242424' }}>
                            <h3 style={{ margin: 0 }}>{selectedFriend.username}</h3>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {messages
                                .filter(m => (m.senderId === user.id && m.receiverId === selectedFriend.id) || (m.senderId === selectedFriend.id && m.receiverId === user.id))
                                .map((msg, idx) => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                            <div style={{
                                                padding: '10px 15px',
                                                borderRadius: '12px',
                                                background: isMe ? '#646cff' : '#333',
                                                color: 'white'
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', background: '#333', color: 'white' }}
                            />
                            <button type="submit" style={{ background: '#646cff', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', flexDirection: 'column' }}>
                        <MessageSquare size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
                        <p>Select a friend to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;

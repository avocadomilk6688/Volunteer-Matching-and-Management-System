import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import './chat_window.css';
import { MdClose } from 'react-icons/md';
import { IoSendSharp, IoMegaphoneSharp } from 'react-icons/io5';
import axios from 'axios';

// Backend Base URL
const API_BASE_URL = "http://localhost:3000";

interface User {
    id: string;
    username?: string;
    role?: 'volunteer' | 'organization' | string;
}

interface Message {
    id: string;
    content: string;
    timestamp: string;
    sender: User;
    receiver: User;
}

interface Contact {
    partnerId: string;
    username: string;
    profilePic: string | null;
    lastMessage: string;
    timestamp: string;
    role: string;
    programmeId: string | null;
    programmeName: string | null;
}

interface ChatWindowProps {
    onClose: () => void;
    senderId: string;   // Logged-in User ID passed from parent
    receiverId?: string; // The person you are talking to
    receiverName?: string;
    receiverImage?: string;
    programmeName?: string;
    programmeId?: string;
}

export function ChatWindow({
    onClose,
    senderId,
    receiverId: initialReceiverId,
    receiverName: initialName,
    receiverImage: initialImage,
    programmeName: initialProg,
    programmeId: initialProgId
}: ChatWindowProps) {

    console.log("DEBUG: PROPS RECEIVED", { initialReceiverId, initialProgId, initialProg });

    const [messages, setMessages] = useState<Message[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);

    const [activeChat, setActiveChat] = useState({
        id: initialReceiverId || "",
        name: initialName || "",
        image: initialImage || "",
        programmeId: initialProgId || "",
        programme: initialProg || "",
        role: initialReceiverId === 'BATCH' ? 'programme_broadcast' : ''
    });

    // ─── CONTINUOUS TRACKING MATRIX DETECTS IF ACTIVE VIEW SHOULD BE A BROADCAST CHANNEL ───
    const isBroadcastChannel = activeChat.id === 'BATCH' || activeChat.role === 'programme_broadcast';

    // ─── OPTIMIZED: INLINE LAZY STATE INITIALIZATION ───
    const [input, setInput] = useState<string>(() => {
        if (initialProgId && initialProgId.startsWith('T') && initialName) {
            return `Hi ${initialName}, I am reviewing your Support Ticket #${initialProgId}. Let's clarify your issue: `;
        }
        return "";
    });

    // --- RENDER-PHASE SYNC LOGIC ---
    const [prevId, setPrevId] = useState(initialReceiverId);
    const [prevProgId, setPrevProgId] = useState(initialProgId);

    if (initialReceiverId !== prevId || initialProgId !== prevProgId) {
        console.log("DEBUG: SYNCING STATE BECAUSE PROPS CHANGED", { initialReceiverId, initialProgId });
        setPrevId(initialReceiverId);
        setPrevProgId(initialProgId);

        // Synchronously clear the message window inside the render phase loop to bypass useEffect bottlenecks
        if (initialReceiverId === 'BATCH') {
            setMessages([]);
        }

        setActiveChat({
            id: initialReceiverId || "",
            name: initialName || "",
            image: initialImage || "",
            programmeId: initialProgId || "",
            programme: initialProg || "",
            role: initialReceiverId === 'BATCH' ? 'programme_broadcast' : ''
        });

        // Safe render-phase state synchronization block prevents loop warning anomalies
        if (initialProgId && initialProgId.startsWith('T') && initialName) {
            setInput(`Hi ${initialName}, I am reviewing your Support Ticket #${initialProgId}. Let's clarify your issue: `);
        } else {
            setInput("");
        }
    }

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Initial Load: Fetch Recent Contacts & Handle Real-Time Injector Columns
    useEffect(() => {
        const fetchContactsAndMissingDetails = async () => {
            if (!senderId) return;
            try {
                const res = await axios.get<Contact[]>(`${API_BASE_URL}/interactions/contacts/${senderId}`);
                setContacts(res.data);

                if (initialReceiverId) {
                    const matchedContact = res.data.find(
                        c => c.partnerId === initialReceiverId && c.programmeId === (initialProgId || null)
                    );

                    if (matchedContact) {
                        setActiveChat(prev => ({
                            ...prev,
                            name: prev.name || matchedContact.username,
                            image: prev.image || matchedContact.profilePic || ""
                        }));
                    }
                    // ─── TICKET PROFILE PICTURE FALLBACK STRATEGY ───
                    else if (initialProgId?.startsWith('T')) {
                        try {
                            const token = localStorage.getItem('token');
                            const userResponse = await axios.get<{ volunteer?: { profile_picture_url?: string }, organization?: { profile_picture_url?: string } }>(
                                `${API_BASE_URL}/users/${initialReceiverId}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            const fallbackAvatar = userResponse.data?.volunteer?.profile_picture_url ||
                                userResponse.data?.organization?.profile_picture_url || "";

                            setActiveChat(prev => ({ ...prev, image: fallbackAvatar }));
                        } catch (err) {
                            console.warn("Direct user record avatar lookup skipped:", err);
                        }
                    }
                }

                // Fallback auto-selection if opened globally without props
                if (!initialReceiverId && res.data.length > 0 && !activeChat.id) {
                    const latest = res.data[0];
                    console.log("DEBUG: AUTO-SELECTING LATEST CONTACT", latest);

                    if (latest.partnerId === 'BATCH' || latest.role === 'programme_broadcast') {
                        setMessages([]);
                    }

                    setActiveChat({
                        id: latest.partnerId,
                        name: latest.username,
                        image: latest.profilePic || "",
                        programmeId: latest.programmeId || "",
                        programme: latest.programmeName || "General Inquiry",
                        role: latest.role
                    });
                }
            } catch (err) {
                console.error("Failed to load contacts", err);
            }
        };
        fetchContactsAndMissingDetails();
    }, [senderId, initialReceiverId, initialProgId]);

    // 2. Chat Lifecycle: Fetch Isolated History & Join Isolated Socket Room
    useEffect(() => {
        if (!activeChat.id || !senderId) return;

        // Return early immediately without executing any synchronous cascading rendering states
        if (isBroadcastChannel) {
            return;
        }

        const loadConversation = async () => {
            // ─── TICKET STRIP HISTORY LOOKUP PARAMETER MATRIX ───
            const historyProgParam = activeChat.programmeId?.startsWith('T')
                ? undefined
                : (activeChat.programmeId || undefined);

            console.log("DEBUG: FETCHING HISTORY FOR", { partner: activeChat.id, prog: historyProgParam });

            try {
                const res = await axios.get(`${API_BASE_URL}/interactions/history/${senderId}/${activeChat.id}`, {
                    params: { programmeId: historyProgParam }
                });
                setMessages(res.data);
            } catch (err) {
                console.error("History fetch failed", err);
            }

            if (!socket.connected) socket.connect();

            console.log("DEBUG: JOINING SOCKET SESSION", { partner: activeChat.id, prog: activeChat.programmeId });
            socket.emit('join_chat_session', {
                senderId,
                receiverId: activeChat.id,
                programmeId: activeChat.programmeId || undefined
            });

            // ─── DEDUPLICATE INCOMING REAL-TIME WEBSOCKET BROADCASTS ───
            socket.on('receive_message', (newMessage: Message) => {
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;

                    const hasOptimisticDuplicate = prev.some(m =>
                        m.id.startsWith('LOCAL_MOCK_') &&
                        m.content === newMessage.content &&
                        String(m.sender?.id || m.sender).toLowerCase() === String(newMessage.sender?.id || newMessage.sender).toLowerCase()
                    );

                    if (hasOptimisticDuplicate) {
                        return prev.map(m =>
                            m.id.startsWith('LOCAL_MOCK_') && m.content === newMessage.content ? newMessage : m
                        );
                    }

                    return [...prev, newMessage];
                });
            });
        };

        loadConversation();

        return () => {
            socket.off('receive_message');
        };
    }, [activeChat.id, activeChat.programmeId, senderId, isBroadcastChannel]);

    // 3. Handle Send
    const handleSend = async () => {
        if (!input.trim() || !activeChat.id) return;

        const typedContent = input.trim();
        setInput("");

        if (isBroadcastChannel && activeChat.programmeId) {
            try {
                await axios.post(`${API_BASE_URL}/interactions/chat/batch`, {
                    senderId,
                    programmeId: activeChat.programmeId,
                    content: typedContent
                });

                const confirmationNoticeMsg: Message = {
                    id: `CONFIRM_BROADCAST_${Date.now()}`,
                    content: `📢 [Broadcast Sent to All Participants]: ${typedContent}`,
                    timestamp: new Date().toISOString(),
                    sender: { id: senderId },
                    receiver: { id: 'BATCH' }
                };
                setMessages(prev => [...prev, confirmationNoticeMsg]);
            } catch (error) {
                console.error("Batch delivery failed:", error);
                alert("Failed to deliver broadcast announcement notice.");
            }
        } else {
            const payload = {
                content: typedContent,
                senderId: senderId,
                receiverId: activeChat.id,
                programmeId: activeChat.programmeId || undefined
            };

            console.log("DEBUG: SENDING MESSAGE PAYLOAD", payload);

            const mockMsgId = `LOCAL_MOCK_${Date.now()}`;
            const optimisticMessage: Message = {
                id: mockMsgId,
                content: payload.content,
                timestamp: new Date().toISOString(),
                sender: { id: senderId },
                receiver: { id: payload.receiverId }
            };

            setMessages(prev => [...prev, optimisticMessage]);
            socket.emit('send_message', payload);
        }
    };

    // --- Helpers ---
    const getImgUrl = (url?: string | null) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const isSentByMe = (msg: Message) => {
        const rawSenderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?.id;
        return String(rawSenderId).trim().toLowerCase() === String(senderId).trim().toLowerCase();
    };

    return (
        <div className="chat-window-container">
            {/* Sidebar: Recent Contacts List */}
            <div className="chat-sidebar" style={{ width: '80px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '12px' }}>
                {contacts.length === 0 ? (
                    <div className="sidebar-empty">No chats</div>
                ) : (
                    contacts.map((c) => {
                        const isRowBroadcast = c.partnerId === 'BATCH' || c.role === 'programme_broadcast';
                        const isActive = activeChat.programmeId === c.programmeId && (isRowBroadcast ? isBroadcastChannel : activeChat.id === c.partnerId);

                        return (
                            <div
                                key={`${c.partnerId}_${c.programmeId}`}
                                className={`sidebar-profile-item ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    console.log("DEBUG: SIDEBAR CONTACT CLICKED", c);

                                    // Safely clear message feeds inside the event context layer to block UI rendering errors
                                    if (c.partnerId === 'BATCH' || c.role === 'programme_broadcast') {
                                        setMessages([]);
                                    }

                                    setActiveChat({
                                        id: c.partnerId,
                                        name: c.username,
                                        image: c.profilePic || "",
                                        programmeId: c.programmeId || "",
                                        programme: c.programmeName || "General Inquiry",
                                        role: c.role
                                    });
                                }}
                                style={{ position: 'relative', cursor: 'pointer' }}
                            >
                                {isRowBroadcast ? (
                                    <div className="profile-circle broadcast-icon-avatar" style={{ backgroundColor: '#ff7f00', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', width: '48px', height: '48px', color: 'white' }}>
                                        <IoMegaphoneSharp size={20} />
                                    </div>
                                ) : (
                                    <div
                                        className="profile-circle"
                                        style={{ backgroundImage: `url(${getImgUrl(c.profilePic)})`, backgroundSize: 'cover', borderRadius: '50%', width: '48px', height: '48px', backgroundColor: '#eee' }}
                                    ></div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <div className="header-left">
                        {!isBroadcastChannel && (
                            <div
                                className="header-profile-pic"
                                style={{ backgroundImage: `url(${getImgUrl(activeChat.image)})`, backgroundSize: 'cover' }}
                            ></div>
                        )}
                        <div className="header-info-stack">
                            <span className="header-name" style={{ fontWeight: 'bold', fontSize: '16px' }}>{activeChat.name || "Select a Chat"}</span>
                            {activeChat.programme && (
                                <span className="header-prog-name">{activeChat.programme}</span>
                            )}
                        </div>
                    </div>
                    <button className="header-close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Messages Feed */}
                <div className="chat-messages" style={{ padding: '15px', flexGrow: 1, overflowY: 'auto' }}>
                    {activeChat.programmeId?.startsWith('T') && (
                        <div className="ticket-summary-alert-banner">
                            ⚠️ System Notice: You are chatting inside an active customer service help ticket room link context.
                        </div>
                    )}

                    {isBroadcastChannel && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <div style={{ color: '#ff7f00', marginBottom: '10px' }}><IoMegaphoneSharp size={32} /></div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Official Programme Broadcast Channel</h4>
                            <p style={{ fontSize: '12px', color: '#666', maxWidth: '85%', margin: '0 auto' }}>
                                Messages submitted to this feed are dynamically broadcasted down to ALL approved and completed volunteers in this programme as distinct, standalone private messages.
                            </p>
                        </div>
                    )}

                    {!activeChat.id ? (
                        <div className="date-separator">Please select a contact to start chatting</div>
                    ) : messages.length === 0 && !isBroadcastChannel ? (
                        <div className="date-separator">No messages yet. Say hello!</div>
                    ) : (
                        messages.map((msg) => {
                            const currentMessageIsMine = isSentByMe(msg);
                            return (
                                <div
                                    key={msg.id}
                                    className={`message-row ${currentMessageIsMine ? 'user' : 'partner'}`}
                                    style={{ display: 'flex', justifyContent: currentMessageIsMine ? 'flex-end' : 'flex-start', margin: '8px 0' }}
                                >
                                    {!currentMessageIsMine && !isBroadcastChannel && (
                                        <div
                                            className="partner-profile-pic"
                                            style={{ backgroundImage: `url(${getImgUrl(activeChat.image)})`, backgroundSize: 'cover' }}
                                        ></div>
                                    )}
                                    <div
                                        className={`message-bubble ${currentMessageIsMine ? 'orange' : 'gray'}`}
                                        style={{ backgroundColor: currentMessageIsMine ? '#ff7f00' : '#f0f0f0', color: currentMessageIsMine ? 'white' : '#333', padding: '8px 12px', borderRadius: '8px', maxWidth: '70%' }}
                                    >
                                        <p style={{ margin: 0 }}>{msg.content}</p>
                                        <span className="message-time" style={{ fontSize: '10px', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>
                                            {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Field */}
                <div className="chat-input-area" style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
                    <input
                        type="text"
                        placeholder={isBroadcastChannel ? "Type broadcast announcement notice..." : "Type your message..."}
                        className="chat-input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!activeChat.id}
                        style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: isBroadcastChannel ? '1px solid #ff7f00' : '1px solid #ccc', marginRight: '8px', backgroundColor: isBroadcastChannel ? '#fffdfb' : '#fff' }}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || !activeChat.id}
                        style={{ backgroundColor: '#ff7f00', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        <IoSendSharp size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
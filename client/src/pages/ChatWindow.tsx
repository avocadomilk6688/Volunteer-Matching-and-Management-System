import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import './chat_window.css';
import { MdClose } from 'react-icons/md';
import { IoSendSharp } from 'react-icons/io5';
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
    senderId: string;   // Logged-in User ID
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

    // ─── OPTIMIZED: INLINE LAZY STATE INITIALIZATION ───
    const [input, setInput] = useState<string>(() => {
        if (initialProgId && initialProgId.startsWith('T') && initialName) {
            return `Hi ${initialName}, I am reviewing your Support Ticket #${initialProgId}. Let's clarify your issue: `;
        }
        return "";
    });

    const [activeChat, setActiveChat] = useState({
        id: initialReceiverId || "",
        name: initialName || "",
        image: initialImage || "",
        programmeId: initialProgId || "",
        programme: initialProg || ""
    });

    // --- RENDER-PHASE SYNC LOGIC ---
    const [prevId, setPrevId] = useState(initialReceiverId);
    const [prevProgId, setPrevProgId] = useState(initialProgId);

    if (initialReceiverId !== prevId || initialProgId !== prevProgId) {
        console.log("DEBUG: SYNCING STATE BECAUSE PROPS CHANGED", { initialReceiverId, initialProgId });
        setPrevId(initialReceiverId);
        setPrevProgId(initialProgId);
        setActiveChat({
            id: initialReceiverId || "",
            name: initialName || "",
            image: initialImage || "",
            programmeId: initialProgId || "",
            programme: initialProg || ""
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

    // 1. Initial Load: Fetch Recent Contacts & Force Direct Avatar Lookups
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
                    setActiveChat({
                        id: latest.partnerId,
                        name: latest.username,
                        image: latest.profilePic || "",
                        programmeId: latest.programmeId || "",
                        programme: latest.programmeName || "General Inquiry"
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

        const loadConversation = async () => {
            // ─── TICKET STRIP HISTORY LOOKUP PARAMETER MATRIX ───
            // If handling a support ticket context, look up records where programmeId is undefined (NULL).
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

            // ─── FIXED: DEDUPLICATE INCOMING REAL-TIME WEBSOCKET BROADCASTS ───
            socket.on('receive_message', (newMessage: Message) => {
                setMessages((prev) => {
                    // Check 1: If the incoming message ID has already been assigned to state, ignore it
                    if (prev.find(m => m.id === newMessage.id)) return prev;

                    // Check 2: Verify if an optimistic placeholder matching the content body is present
                    const hasOptimisticDuplicate = prev.some(m =>
                        m.id.startsWith('LOCAL_MOCK_') &&
                        m.content === newMessage.content &&
                        String(m.sender?.id || m.sender).toLowerCase() === String(newMessage.sender?.id || newMessage.sender).toLowerCase()
                    );

                    // Swap out the temporary mock message container layout for the real, database-finalized row entry
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
    }, [activeChat.id, activeChat.programmeId, senderId]);

    // 3. Handle Send
    const handleSend = () => {
        if (!input.trim() || !activeChat.id) return;

        const payload = {
            content: input.trim(),
            senderId: senderId,
            receiverId: activeChat.id,
            programmeId: activeChat.programmeId || undefined
        };

        console.log("DEBUG: SENDING MESSAGE PAYLOAD", payload);

        // ─── OPTIMISTIC DISPLAY INJECTION ───
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
        setInput("");
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

    // ─── FIXED: ROBUST MULTI-TYPE SENDER ALIGNMENT EVALUATOR ───
    const isSentByMe = (msg: Message) => {
        const rawSenderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?.id;
        return String(rawSenderId).trim().toLowerCase() === String(senderId).trim().toLowerCase();
    };

    return (
        <div className="chat-window-container">
            {/* Sidebar: Recent Contacts List */}
            <div className="chat-sidebar">
                {contacts.length === 0 ? (
                    <div className="sidebar-empty">No chats</div>
                ) : (
                    contacts.map((c) => (
                        <div
                            key={`${c.partnerId}_${c.programmeId}`}
                            className={`sidebar-profile-item ${activeChat.id === c.partnerId && activeChat.programmeId === (c.programmeId || '') ? 'active' : ''}`}
                            onClick={() => {
                                console.log("DEBUG: SIDEBAR CONTACT CLICKED", c);
                                setActiveChat({
                                    id: c.partnerId,
                                    name: c.username,
                                    image: c.profilePic || "",
                                    programmeId: c.programmeId || "",
                                    programme: c.programmeName || "General Inquiry"
                                });
                            }}
                        >
                            <div
                                className="profile-circle"
                                style={{ backgroundImage: `url(${getImgUrl(c.profilePic)})`, backgroundSize: 'cover' }}
                            ></div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <div className="header-left">
                        <div
                            className="header-profile-pic"
                            style={{ backgroundImage: `url(${getImgUrl(activeChat.image)})`, backgroundSize: 'cover' }}
                        ></div>
                        <div className="header-info-stack">
                            <span className="header-name">{activeChat.name || "Select a Chat"}</span>
                            {activeChat.programme && (
                                <span className="header-prog-name">{activeChat.programme}</span>
                            )}
                        </div>
                    </div>
                    <button className="header-close-btn" onClick={onClose}>
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Messages Feed */}
                <div className="chat-messages">
                    {/* TICKET CONTEXT System Alert Banner Overlay */}
                    {activeChat.programmeId?.startsWith('T') && (
                        <div className="ticket-summary-alert-banner">
                            ⚠️ System Notice: You are chatting inside an active customer service help ticket room link context.
                        </div>
                    )}

                    {!activeChat.id ? (
                        <div className="date-separator">Please select a contact to start chatting</div>
                    ) : messages.length === 0 ? (
                        <div className="date-separator">No messages yet. Say hello!</div>
                    ) : (
                        messages.map((msg) => {
                            const currentMessageIsMine = isSentByMe(msg);
                            return (
                                <div
                                    key={msg.id}
                                    className={`message-row ${currentMessageIsMine ? 'user' : 'partner'}`}
                                >
                                    {!currentMessageIsMine && (
                                        <div
                                            className="partner-profile-pic"
                                            style={{ backgroundImage: `url(${getImgUrl(activeChat.image)})`, backgroundSize: 'cover' }}
                                        ></div>
                                    )}
                                    <div className={`message-bubble ${currentMessageIsMine ? 'orange' : 'gray'}`}>
                                        <p>{msg.content}</p>
                                        <span className="message-time">
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
                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="chat-input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!activeChat.id}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || !activeChat.id}
                    >
                        <IoSendSharp size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
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
    role?: 'volunteer' | 'organization';
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
    const [input, setInput] = useState("");

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
    }

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Initial Load: Fetch Recent Contacts & Resolve Missing Details (Issue 2 Fix)
    useEffect(() => {
        const fetchContacts = async () => {
            if (!senderId) return;
            try {
                const res = await axios.get<Contact[]>(`${API_BASE_URL}/interactions/contacts/${senderId}`);
                setContacts(res.data);

                // FIX ISSUE 2: If we have an active chat from props but the image or name is missing,
                // try to find this exact partner + programme match in contacts to grab the profile picture
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
        fetchContacts();
    }, [senderId, initialReceiverId, initialProgId]);

    // 2. Chat Lifecycle: Fetch Isolated History & Join Isolated Socket Room (Issue 1 & 3 Fix)
    useEffect(() => {
        if (!activeChat.id || !senderId) return;

        const loadConversation = async () => {
            console.log("DEBUG: FETCHING HISTORY FOR", { partner: activeChat.id, prog: activeChat.programmeId });

            try {
                const res = await axios.get(`${API_BASE_URL}/interactions/history/${senderId}/${activeChat.id}`, {
                    params: { programmeId: activeChat.programmeId || undefined }
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

            socket.on('receive_message', (newMessage: Message) => {
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
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
            content: input,
            senderId: senderId,
            receiverId: activeChat.id,
            programmeId: activeChat.programmeId || undefined
        };

        console.log("DEBUG: SENDING MESSAGE PAYLOAD", payload);

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
                    {!activeChat.id ? (
                        <div className="date-separator">Please select a contact to start chatting</div>
                    ) : messages.length === 0 ? (
                        <div className="date-separator">No messages yet. Say hello!</div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`message-row ${msg.sender?.id === senderId ? 'user' : 'partner'}`}
                            >
                                {msg.sender?.id !== senderId && (
                                    <div
                                        className="partner-profile-pic"
                                        style={{ backgroundImage: `url(${getImgUrl(activeChat.image)})`, backgroundSize: 'cover' }}
                                    ></div>
                                )}
                                <div className={`message-bubble ${msg.sender?.id === senderId ? 'orange' : 'gray'}`}>
                                    <p>{msg.content}</p>
                                    <span className="message-time">
                                        {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                    </span>
                                </div>
                            </div>
                        ))
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
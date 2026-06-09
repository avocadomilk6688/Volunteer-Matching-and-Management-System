import { Header } from './Header';
import './manage_listing_page.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { useAuth } from '../context/auth/useAuth';
import { AiOutlineMessage } from 'react-icons/ai';
import { ChatWindow } from './ChatWindow';
import { socket } from '../services/socket';
import { RatingModal } from './RatingModal';
import axios from 'axios';

// --- Explicit TypeScript Interfaces ---
interface TagItem { id: string; name: string; }
interface SkillEntity { id: string; skill_name: string; }
interface InterestEntity { id: string; interest_name: string; }

interface Programme {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    organization?: { id: string; };
    related_skills: SkillEntity[];
    related_interests: InterestEntity[];
    schedule: {
        mode: string;
        location: string;
        start_time: string;
        end_time: string;
    };
}

interface BackendResponse {
    items: Programme[];
    total: number;
}

interface TagSelectionProps {
    toggleTag: (item: TagItem, type: 'skill' | 'interest') => void;
    myTags: TagItem[];
    allTags: TagItem[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    type: 'skill' | 'interest';
}

interface SecureOrganizationShape {
    id: string;
    description?: string | null;
    rating?: number;
    profile_picture_url?: string | null;
}

interface SecureUserEntity {
    id: string;
    role: string;
    username?: string | null;
    email?: string;
    pendingRating?: {
        programmeId: string;
    } | null;
    organization?: SecureOrganizationShape | null;
}

// --- Draggable Chat Button Sub-Component ---
const DraggableChatButton = ({ onClick, hasUnread }: { onClick: () => void; hasUnread: boolean }) => {
    const [position, setPosition] = useState({
        x: window.innerWidth - 120,
        y: window.innerHeight - 120
    });
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;

        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        const btnSize = 70;
        newX = Math.max(0, Math.min(newX, window.innerWidth - btnSize));
        newY = Math.max(0, Math.min(newY, window.innerHeight - btnSize));

        setPosition({ x: newX, y: newY });
    }, [dragging]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        setDragging(false);
        const moveX = Math.abs(e.clientX - startPos.current.x);
        const moveY = Math.abs(e.clientY - startPos.current.y);
        if (moveX < 5 && moveY < 5) {
            onClick();
        }
    }, [onClick]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            className={`floating-chat-button ${dragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: 'fixed'
            }}
        >
            <AiOutlineMessage />
            {hasUnread && (
                <span
                    className="chat-notification-dot"
                    style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        backgroundColor: '#FF3B30',
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                />
            )}
        </div>
    );
};

export function ManageListingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { user: rawUser } = useAuth();
    const user = rawUser as SecureUserEntity | undefined;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_BASE_URL = "http://localhost:3000";

    const [listings, setListings] = useState<Programme[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [allSkills, setAllSkills] = useState<TagItem[]>([]);
    const [allInterests, setAllInterests] = useState<TagItem[]>([]);

    const [mySkills, setMySkills] = useState<TagItem[]>([]);
    const [myInterests, setMyInterests] = useState<TagItem[]>([]);
    const [showSkillBox, setShowSkillBox] = useState<boolean>(false);
    const [showInterestBox, setShowInterestBox] = useState<boolean>(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // ─── 🌟 FIXED: TARGET TRUE USER ID (USRxxx) INSTEAD OF ORG PROFILE ID ───
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const [isRatingOpen, setIsRatingOpen] = useState<boolean>(!!user?.pendingRating);

    const [rowData, setRowData] = useState({
        title: '', description: '', mode: 'Physical', location: '', start_time: '', end_time: '', imageUrl: '',
    });

    const headers = ['Title', 'Description', 'Cover Image', 'Skills', 'Interests', 'Mode', 'Location', 'Schedule', 'Action'];

    useEffect(() => {
        if (user?.id) fetchInitialData();
    }, [user?.id]);

    // ─── 🌟 FIXED: PULL BY ACTIVE USER ID ACCOUNT CONTEXT TO TRACE REAL MESSAGES ───
    const fetchChatMessagesSync = useCallback(async () => {
        const trueUserAccountId = user?.id || localStorage.getItem('userId');
        if (!trueUserAccountId || trueUserAccountId === 'undefined') return;
        try {
            const res = await axios.get<{ count: number }>(`${API_BASE_URL}/interactions/messages/unread/${trueUserAccountId}`);
            setUnreadChatCount(res.data.count || 0);
        } catch (err) {
            console.error("Error synchronizing chat array timestamps on org view:", err);
        }
    }, [user?.id]);

    // WebSocket Handshake Listener Loop
    useEffect(() => {
        const trueUserAccountId = user?.id || localStorage.getItem('userId');
        if (!trueUserAccountId || trueUserAccountId === 'undefined') return;

        if (!socket.connected) socket.connect();

        socket.emit('join_private_room', { userId: trueUserAccountId });
        socket.emit('join_private_room', { userId: `room_${trueUserAccountId}` });

        fetchChatMessagesSync();

        const handleRealTimeMessageArrival = () => {
            console.log("🔴 REAL-TIME CHAT INTERCEPT: Message arrived, matching fresh lists...");
            fetchChatMessagesSync();
        };

        socket.on('new_notification', handleRealTimeMessageArrival);
        socket.on('receive_message', handleRealTimeMessageArrival);

        return () => {
            socket.off('new_notification', handleRealTimeMessageArrival);
            socket.off('receive_message', handleRealTimeMessageArrival);
        };
    }, [user?.id, fetchChatMessagesSync]);

    // Derived logic evaluating timestamp indices
    const hasUnread = unreadChatCount > 0;

    // ─── 🌟 FIXED: MAPPED EXPLICITLY TO THE ACCOUNT UNIQUE FIELD IDENTIFIER ───
    const toggleChat = async () => {
        const nextState = !isChatOpen;
        setIsChatOpen(nextState);

        const trueUserAccountId = user?.id || localStorage.getItem('userId');
        if (nextState && trueUserAccountId && trueUserAccountId !== 'undefined') {
            try {
                await axios.patch(`${API_BASE_URL}/interactions/messages/read/${trueUserAccountId}`);
                setUnreadChatCount(0);
            } catch (err) {
                console.error("Error marking organization chat messages as read:", err);
            }
        }
    };

    const fetchInitialData = async () => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            const [progRes, skillRes, intRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programmes?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/volunteers/skills`),
                fetch(`${API_BASE_URL}/volunteers/interests`)
            ]);

            const progData = await progRes.json() as BackendResponse;
            const skillData = await skillRes.json() as SkillEntity[];
            const intData = await intRes.json() as InterestEntity[];

            const filtered = (progData.items || []).filter((item: Programme) => {
                const itemOrgId = item.organization?.id;
                return itemOrgId === user?.organization?.id || itemOrgId === user?.id;
            });
            setListings(filtered);

            setAllSkills(skillData.map(s => ({ id: s.id, name: s.skill_name })));
            setAllInterests(intData.map(i => ({ id: i.id, name: i.interest_name })));
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (item: TagItem, type: 'skill' | 'interest') => {
        const list = type === 'skill' ? mySkills : myInterests;
        const setList = type === 'skill' ? setMySkills : setMyInterests;
        if (list.find(t => t.id === item.id)) {
            setList(list.filter(t => t.id !== item.id));
        } else {
            setList([...list, item]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedImage(file);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setMySkills([]);
        setMyInterests([]);
        setSelectedImage(null);
        setRowData({ title: '', description: '', mode: 'Physical', location: '', start_time: '', end_time: '', imageUrl: '' });
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!rowData.title || !rowData.start_time || !rowData.end_time) {
            return alert("Required fields missing.");
        }

        const trueOrganizationId = user?.organization?.id || user?.id || '';

        const formData = new FormData();
        formData.append('title', rowData.title);
        formData.append('description', rowData.description);
        formData.append('mode', rowData.mode);
        formData.append('location', rowData.location);
        formData.append('start_time', rowData.start_time);
        formData.append('end_time', rowData.end_time);
        formData.append('organizationId', trueOrganizationId);
        formData.append('skillIds', JSON.stringify(mySkills.map(s => s.id)));
        formData.append('interestIds', JSON.stringify(myInterests.map(i => i.id)));

        if (selectedImage) {
            formData.append('file', selectedImage);
        } else if (editingId && rowData.imageUrl) {
            formData.append('imageUrl', rowData.imageUrl);
        }

        try {
            const url = editingId ? `${API_BASE_URL}/programmes/${editingId}` : `${API_BASE_URL}/programmes`;
            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                await fetchInitialData();
                resetForm();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const startEditing = (item: Programme) => {
        setIsAdding(false);
        setEditingId(item.id);
        setRowData({
            title: item.title,
            description: item.description,
            mode: item.schedule.mode,
            location: item.schedule.location,
            start_time: new Date(item.schedule.start_time).toISOString().slice(0, 16),
            end_time: new Date(item.schedule.end_time).toISOString().slice(0, 16),
            imageUrl: item.imageUrl || '',
        });
        setMySkills(item.related_skills.map(s => ({ id: s.id, name: s.skill_name })));
        setMyInterests(item.related_interests.map(i => ({ id: i.id, name: i.interest_name })));
    };

    const handleDelete = async (id: string) => {
        const token = localStorage.getItem('token');
        if (!window.confirm("Are you sure?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/programmes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchInitialData();
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="manage-listing-wrapper">
            <Header />
            <div className="manage-listing-container">
                <aside className="org-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-listing' ? 'active' : ''} onClick={() => navigate('/manage-listing')}>Manage listing</li>
                            <li className={location.pathname === '/manage-applications' ? 'active' : ''} onClick={() => navigate('/manage-applications')}>Manage volunteer application</li>
                        </ul>
                    </nav>
                </aside>

                <main className="manage-listing-content">
                    <h1>Manage Listing</h1>
                    <button className="add-listing-btn" onClick={() => { resetForm(); setIsAdding(true); }}>Add</button>

                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {isAdding && (
                                <tr className="adding-row">
                                    <td><input type="text" value={rowData.title} onChange={e => setRowData({ ...rowData, title: e.target.value })} /></td>
                                    <td><textarea value={rowData.description} onChange={e => setRowData({ ...rowData, description: e.target.value })} /></td>
                                    <td>
                                        <div className="upload-cell">
                                            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
                                            <button className="mini-upload-btn" onClick={() => fileInputRef.current?.click()}>{selectedImage ? 'Change' : 'Upload'}</button>
                                        </div>
                                    </td>
                                    <td className="tags-td"><TagSelection toggleTag={toggleTag} myTags={mySkills} allTags={allSkills} type="skill" isOpen={showSkillBox} setIsOpen={setShowSkillBox} /></td>
                                    <td className="tags-td"><TagSelection toggleTag={toggleTag} myTags={myInterests} allTags={allInterests} type="interest" isOpen={showInterestBox} setIsOpen={setShowInterestBox} /></td>
                                    <td><select value={rowData.mode} onChange={e => setRowData({ ...rowData, mode: e.target.value })}><option value="Physical">Physical</option><option value="Online">Online</option></select></td>
                                    <td><input type="text" value={rowData.location} onChange={e => setRowData({ ...rowData, location: e.target.value })} /></td>
                                    <td>
                                        <div className="schedule-input-group">
                                            <input type="datetime-local" value={rowData.start_time} onChange={e => setRowData({ ...rowData, start_time: e.target.value })} />
                                            <input type="datetime-local" value={rowData.end_time} onChange={e => setRowData({ ...rowData, end_time: e.target.value })} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="save-btn" onClick={handleSave}>Save</button>
                                            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {listings.map((item) => (
                                editingId === item.id ? (
                                    <tr key={item.id} className="editing-row">
                                        <td><input type="text" value={rowData.title} onChange={e => setRowData({ ...rowData, title: e.target.value })} /></td>
                                        <td><textarea value={rowData.description} onChange={e => setRowData({ ...rowData, description: e.target.value })} /></td>
                                        <td>
                                            <div className="upload-cell">
                                                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
                                                <button className="mini-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                                    Change
                                                </button>
                                                {selectedImage ? (
                                                    <span style={{ fontSize: '10px', color: '#4CAF50', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                                                        New: {selectedImage.name}
                                                    </span>
                                                ) : rowData.imageUrl ? (
                                                    <span style={{ fontSize: '10px', color: '#666', display: 'block', marginTop: '4px' }}>
                                                        Current: {rowData.imageUrl.split('/').pop()}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="tags-td"><TagSelection toggleTag={toggleTag} myTags={mySkills} allTags={allSkills} type="skill" isOpen={showSkillBox} setIsOpen={setShowSkillBox} /></td>
                                        <td className="tags-td"><TagSelection toggleTag={toggleTag} myTags={myInterests} allTags={allInterests} type="interest" isOpen={showInterestBox} setIsOpen={setShowInterestBox} /></td>
                                        <td><select value={rowData.mode} onChange={e => setRowData({ ...rowData, mode: e.target.value })}><option value="Physical">Physical</option><option value="Online">Online</option></select></td>
                                        <td><input type="text" value={rowData.location} onChange={e => setRowData({ ...rowData, location: e.target.value })} /></td>
                                        <td>
                                            <div className="schedule-input-group">
                                                <input type="datetime-local" value={rowData.start_time} onChange={e => setRowData({ ...rowData, start_time: e.target.value })} />
                                                <input type="datetime-local" value={rowData.end_time} onChange={e => setRowData({ ...rowData, end_time: e.target.value })} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="save-btn" onClick={handleSave}>Update</button>
                                                <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={item.id}>
                                        <td className="col-title">{item.title}</td>
                                        <td className="col-desc">{item.description}</td>
                                        <td className="col-img">
                                            <a href={`${API_BASE_URL}${item.imageUrl}`} target="_blank" rel="noopener noreferrer" className="img-filename-link">
                                                {item.imageUrl?.split('/').pop() || 'image.png'}
                                            </a>
                                        </td>
                                        <td><div className="badge-stack">{item.related_skills?.map(s => <span key={s.id} className="orange-badge">{s.skill_name}</span>)}</div></td>
                                        <td><div className="badge-stack">{item.related_interests?.map(i => <span key={i.id} className="orange-badge">{i.interest_name}</span>)}</div></td>
                                        <td>{item.schedule?.mode}</td>
                                        <td>{item.schedule?.location || 'N/A'}</td>
                                        <td className="col-schedule">
                                            <div className="time-display">
                                                <span>Start: {formatDate(item.schedule?.start_time)}</span><br />
                                                <span>End: {formatDate(item.schedule?.end_time)}</span>
                                            </div>
                                        </td>
                                        <td className="col-action">
                                            <div className="action-buttons">
                                                <button className="modify-btn" onClick={() => startEditing(item)}>Modify</button>
                                                <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </GenericTable>
                    )}
                </main>
            </div>

            <div style={{ display: isChatOpen ? 'none' : 'block' }}>
                <DraggableChatButton
                    key={`m_listing_bubble_sync_${hasUnread}`}
                    onClick={toggleChat}
                    hasUnread={hasUnread}
                />
            </div>

            {isChatOpen && (
                <ChatWindow
                    onClose={() => setIsChatOpen(false)}
                    senderId={user?.id || ""}
                    receiverId=""
                />
            )}

            {user?.pendingRating && (
                <RatingModal
                    isOpen={isRatingOpen}
                    onClose={() => setIsRatingOpen(false)}
                    programmeId={user.pendingRating.programmeId}
                />
            )}
        </div>
    );
}

function TagSelection({ toggleTag, myTags, allTags, isOpen, setIsOpen, type }: TagSelectionProps) {
    return (
        <div className="tags-container">
            {myTags.map((tag: TagItem) => (
                <span key={tag.id} className="tag-pill">
                    {tag.name} <span className="remove-tag" onClick={() => toggleTag(tag, type)}>x</span>
                </span>
            ))}
            <button className="add-tag-btn" onClick={() => setIsOpen(!isOpen)}>+</button>
            {isOpen && (
                <div className="selection-box">
                    <div className="selection-grid">
                        {allTags.map((t: TagItem) => (
                            <div
                                key={t.id}
                                className={`selection-item ${myTags.find((mt) => mt.id === t.id) ? 'selected' : ''}`}
                                onClick={() => toggleTag(t, type)}
                            >
                                {t.name}
                            </div>
                        ))}
                    </div>
                    <button className="done-btn" onClick={() => setIsOpen(false)}>Done</button>
                </div>
            )}
        </div>
    );
}

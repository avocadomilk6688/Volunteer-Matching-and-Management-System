import { Header } from './Header';
import './manage_listing_page.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { useAuth } from '../context/auth/useAuth';

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

export function ManageListingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_BASE_URL = "http://localhost:3000";

    // Listings State
    const [listings, setListings] = useState<Programme[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Tag Selection States
    const [allSkills, setAllSkills] = useState<TagItem[]>([]);
    const [allInterests, setAllInterests] = useState<TagItem[]>([]);
    const [mySkills, setMySkills] = useState<TagItem[]>([]);
    const [myInterests, setMyInterests] = useState<TagItem[]>([]);
    const [showSkillBox, setShowSkillBox] = useState<boolean>(false);
    const [showInterestBox, setShowInterestBox] = useState<boolean>(false);

    // Inline Add State
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [newRow, setNewRow] = useState({
        title: '',
        description: '',
        mode: 'Physical',
        location: '',
        start_time: '',
        end_time: '',
    });

    const headers = ['Title', 'Description', 'Cover Image', 'Skills', 'Interests', 'Mode', 'Location', 'Schedule', 'Action'];

    useEffect(() => {
        if (user?.id) fetchInitialData();
    }, [user?.id]);

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

            const filtered = (progData.items || []).filter((item: Programme) => item.organization?.id === user?.id);
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
        if (file) {
            setSelectedImage(file);
        }
    };

    const handleSaveNew = async () => {
        const token = localStorage.getItem('token');
        if (!newRow.title || !newRow.start_time || !newRow.end_time) {
            return alert("Title, Start Time, and End Time are required.");
        }

        try {
            const formData = new FormData();
            formData.append('title', newRow.title);
            formData.append('description', newRow.description);
            formData.append('mode', newRow.mode);
            formData.append('location', newRow.location);
            formData.append('start_time', newRow.start_time);
            formData.append('end_time', newRow.end_time);
            formData.append('organizationId', user?.id || '');
            formData.append('skillIds', JSON.stringify(mySkills.map(s => s.id)));
            formData.append('interestIds', JSON.stringify(myInterests.map(i => i.id)));

            if (selectedImage) {
                formData.append('file', selectedImage);
            }

            const response = await fetch(`${API_BASE_URL}/programmes`, {
                method: 'POST',
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
            console.error("Save failed:", error);
        }
    };

    // --- NEW: DELETE FUNCTIONALITY ---
    const handleDelete = async (id: string) => {
        const token = localStorage.getItem('token');
        if (!window.confirm("Are you sure you want to delete this programme? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/programmes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh the list locally or fetch again
                alert("Programme deleted successfully.");
                await fetchInitialData();
            } else {
                const err = await response.json();
                alert(`Delete failed: ${err.message}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while trying to delete.");
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setMySkills([]);
        setMyInterests([]);
        setSelectedImage(null);
        setNewRow({ title: '', description: '', mode: 'Physical', location: '', start_time: '', end_time: '' });
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
                    <button className="add-listing-btn" onClick={() => setIsAdding(true)}>Add</button>

                    {loading ? (
                        <div className="loading-state">Loading your listings...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {isAdding && (
                                <tr className="adding-row">
                                    <td><input type="text" placeholder="Title" value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} /></td>
                                    <td><textarea placeholder="Desc" value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} /></td>
                                    <td>
                                        <div className="upload-cell">
                                            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="image/*" />
                                            <button className="mini-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                                {selectedImage ? 'Change' : 'Upload'}
                                            </button>
                                            {selectedImage && <div className="file-name-hint">{selectedImage.name}</div>}
                                        </div>
                                    </td>
                                    <td className="tags-td">
                                        <div className="tags-container">
                                            {mySkills.map(skill => (
                                                <span key={skill.id} className="tag-pill">{skill.name} <span className="remove-tag" onClick={() => toggleTag(skill, 'skill')}>x</span></span>
                                            ))}
                                            <button className="add-tag-btn" onClick={() => setShowSkillBox(!showSkillBox)}>+</button>
                                            {showSkillBox && (
                                                <div className="selection-box">
                                                    <div className="selection-grid">
                                                        {allSkills.map(s => <div key={s.id} className={`selection-item ${mySkills.find(ms => ms.id === s.id) ? 'selected' : ''}`} onClick={() => toggleTag(s, 'skill')}>{s.name}</div>)}
                                                    </div>
                                                    <button className="done-btn" onClick={() => setShowSkillBox(false)}>Done</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="tags-td">
                                        <div className="tags-container">
                                            {myInterests.map(i => (
                                                <span key={i.id} className="tag-pill">{i.name} <span className="remove-tag" onClick={() => toggleTag(i, 'interest')}>x</span></span>
                                            ))}
                                            <button className="add-tag-btn" onClick={() => setShowInterestBox(!showInterestBox)}>+</button>
                                            {showInterestBox && (
                                                <div className="selection-box">
                                                    <div className="selection-grid">
                                                        {allInterests.map(i => <div key={i.id} className={`selection-item ${myInterests.find(mi => mi.id === i.id) ? 'selected' : ''}`} onClick={() => toggleTag(i, 'interest')}>{i.name}</div>)}
                                                    </div>
                                                    <button className="done-btn" onClick={() => setShowInterestBox(false)}>Done</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <select value={newRow.mode} onChange={e => setNewRow({ ...newRow, mode: e.target.value })}>
                                            <option value="Physical">Physical</option>
                                            <option value="Online">Online</option>
                                        </select>
                                    </td>
                                    <td><input type="text" placeholder="Location" value={newRow.location} onChange={e => setNewRow({ ...newRow, location: e.target.value })} /></td>
                                    <td>
                                        <div className="schedule-input-group">
                                            <input type="datetime-local" value={newRow.start_time} onChange={e => setNewRow({ ...newRow, start_time: e.target.value })} />
                                            <input type="datetime-local" value={newRow.end_time} onChange={e => setNewRow({ ...newRow, end_time: e.target.value })} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="save-btn" onClick={handleSaveNew}>Save</button>
                                            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {listings.map((item) => (
                                <tr key={item.id}>
                                    <td className="col-title">{item.title}</td>
                                    <td className="col-desc">{item.description}</td>
                                    <td className="col-img">
                                        <a
                                            href={`${API_BASE_URL}${item.imageUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="img-filename-link"
                                        >
                                            {item.imageUrl?.split('/').pop() || 'image.png'}
                                        </a>
                                    </td>
                                    <td><div className="badge-stack">{item.related_skills?.map(s => <span key={s.id} className="orange-badge">{s.skill_name}</span>)}</div></td>
                                    <td><div className="badge-stack">{item.related_interests?.map(i => <span key={i.id} className="orange-badge">{i.interest_name}</span>)}</div></td>
                                    <td>{item.schedule?.mode}</td>
                                    <td>{item.schedule?.location || 'N/A'}</td>
                                    <td className="col-schedule">
                                        <div className="time-display">
                                            <span>S: {formatDate(item.schedule?.start_time)}</span>
                                            <span>E: {formatDate(item.schedule?.end_time)}</span>
                                        </div>
                                    </td>
                                    <td className="col-action">
                                        <div className="action-buttons">
                                            <button className="modify-btn" onClick={() => navigate(`/edit-listing/${item.id}`)}>Modify</button>
                                            {/* UPDATED DELETE BUTTON */}
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </GenericTable>
                    )}
                </main>
            </div>
        </div>
    );
}
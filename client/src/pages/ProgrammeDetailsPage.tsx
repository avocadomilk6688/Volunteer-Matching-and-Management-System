import { AiFillStar, AiOutlineStar, AiOutlineFlag } from 'react-icons/ai';
import { Header } from './Header';
import './programme_details_page.css';
import { useParams } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import { ChatWindow } from './ChatWindow';
import { socket } from '../services/socket'; // Import socket instance directly

// --- Interfaces ---
interface TagItem { id: string; name: string; }

interface Skill {
    id: string;
    skill_name: string;
}

interface Interest {
    id: string;
    interest_name: string;
}

interface ProgrammeDetailsData {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    related_skills: Skill[];
    related_interests: Interest[];
    schedule: {
        mode: string;
        start_time: string;
        end_time: string;
        location: string;
    };
    organization: {
        id: string;
        description: string;
        rating: number;
        profile_picture_url: string;
        contact_number: string;
        user: {
            id: string; // Added user ID for chat routing
            username: string;
            email: string;
        }
    };
}

interface EnrollmentCheckResponse {
    enrolled: boolean;
    status: string | null;
}

interface VolunteerProfileResponse {
    id: string;
    skills: Skill[];
    interests: Interest[];
    resume_url: string | null;
}

interface SaveToggleResponse {
    isSaved: boolean;
    message: string;
}

const API_BASE_URL = "http://localhost:3000";

export function ProgrammeDetailsPage() {
    const { id: programmeId } = useParams<{ id: string }>();
    const { user } = useAuth();

    // Data States
    const [programme, setProgramme] = useState<ProgrammeDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);

    // SAVE FEATURE STATE
    const [isSaved, setIsSaved] = useState(false);

    // Modal Application States
    const [mySkills, setMySkills] = useState<TagItem[]>([]);
    const [myInterests, setMyInterests] = useState<TagItem[]>([]);

    // Global Options
    const [allSkills, setAllSkills] = useState<TagItem[]>([]);
    const [allInterests, setAllInterests] = useState<TagItem[]>([]);

    const [resumeUrl, setResumeUrl] = useState<string>('');
    const [selectedResume, setSelectedResume] = useState<File | null>(null);

    // UI Logic States
    const [showModal, setShowModal] = useState(false);
    const [showSkillBox, setShowSkillBox] = useState(false);
    const [showInterestBox, setShowInterestBox] = useState(false);
    const [showChatWindow, setShowChatWindow] = useState(false);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    // --- STATE FOR THREAD SPECIFIC UNREAD NOTIFICATION BADGE ---
    const [hasUnread, setHasUnread] = useState(false);

    const formatFileName = (url: string) => {
        if (!url) return "No resume uploaded";
        const parts = url.split('/');
        const fullName = parts[parts.length - 1];
        return fullName.replace(/^resume-\d+-/, '');
    };

    useEffect(() => {
        const initLoad = async () => {
            if (!programmeId) return;
            try {
                setLoading(true);

                // 1. Fetch Global Data
                const [progRes, skillsRes, interestsRes] = await Promise.all([
                    axios.get<ProgrammeDetailsData>(`${API_BASE_URL}/programmes/${programmeId}`),
                    axios.get<Skill[]>(`${API_BASE_URL}/volunteers/skills`),
                    axios.get<Interest[]>(`${API_BASE_URL}/volunteers/interests`)
                ]);

                setProgramme(progRes.data);
                setAllSkills((skillsRes.data || []).map((s) => ({ id: s.id, name: s.skill_name })));
                setAllInterests((interestsRes.data || []).map((i) => ({ id: i.id, name: i.interest_name })));

                // 2. Fetch User-Specific Info
                if (user?.id) {
                    // Check Enrollment
                    try {
                        const enrollRes = await axios.get<EnrollmentCheckResponse>(`${API_BASE_URL}/applications/check/${user.id}/${programmeId}`);
                        if (enrollRes.data && enrollRes.data.status) {
                            setEnrollmentStatus(enrollRes.data.status);
                        }
                    } catch (e: unknown) {
                        console.warn("Enrollment status check failed.", e);
                    }

                    // CHECK IF PROGRAMME IS SAVED
                    try {
                        const saveRes = await axios.get<{ isSaved: boolean }>(`${API_BASE_URL}/programmes/${programmeId}/is-saved/${user.id}`);
                        setIsSaved(saveRes.data.isSaved);
                    } catch (e: unknown) {
                        console.warn("Save status check failed.", e);
                    }

                    // Fetch Volunteer Profile
                    try {
                        const volRes = await axios.get<VolunteerProfileResponse>(`${API_BASE_URL}/volunteers/${user.id}`);
                        if (volRes.data) {
                            setMySkills((volRes.data.skills || []).map((s) => ({ id: s.id, name: s.skill_name })));
                            setMyInterests((volRes.data.interests || []).map((i) => ({ id: i.id, name: i.interest_name })));
                            setResumeUrl(volRes.data.resume_url || '');
                        }
                    } catch (e: unknown) {
                        console.error("Failed to load volunteer profile.", e);
                    }
                }

            } catch (error: unknown) {
                console.error("Initialization error:", error);
            } finally {
                setLoading(false);
            }
        };
        initLoad();
    }, [programmeId, user?.id]);

    // --- BACKGROUND MESSAGE NOTIFICATION LISTENER ---
    useEffect(() => {
        if (!user?.id || !programme?.organization?.user?.id || !programmeId) return;

        if (!socket.connected) socket.connect();

        // Connect client instance directly to personal private notify tracking room
        socket.emit('join_private_room', { userId: user.id });

        const handleIncomingNotification = (data: { type: string, from: string, programmeId: string | null }) => {
            console.log("DEBUG: Detail page received notification parameter:", data);
            // Light indicator up if window is closed and message targets this explicit organization context thread
            if (!showChatWindow && data.from === programme.organization.user.id && data.programmeId === programmeId) {
                setHasUnread(true);
            }
        };

        socket.on('new_notification', handleIncomingNotification);

        return () => {
            socket.off('new_notification', handleIncomingNotification);
        };
    }, [user?.id, programme?.organization?.user?.id, programmeId, showChatWindow]);

    const handleToggleSave = async () => {
        if (!user) {
            alert("Please login to save programmes.");
            return;
        }

        try {
            const response = await axios.post<SaveToggleResponse>(`${API_BASE_URL}/programmes/${programmeId}/save`, {
                userId: user.id
            });

            const currentlySaved = response.data.isSaved;
            setIsSaved(currentlySaved);

            if (currentlySaved) {
                alert("The programme is saved!");
            } else {
                alert("Programme removed from saved list.");
            }
        } catch (error: unknown) {
            console.error("Save error:", error);
            alert("Failed to update save status.");
        }
    };

    // --- SYSTEM INCIDENT REPORT DISPATCH HANDLER ---
    const handleReportProgramme = async () => {
        if (!user) {
            alert("Please log in to report this listing.");
            return;
        }

        const isConfirmed = window.confirm(`Are you sure you want to report the programme listing "${programme?.title}" to the system administrator?`);
        if (!isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const reportPayload = {
                type: 'programme_report',
                content: `Emergency Incident Report: The volunteer "${user.username || 'Anonymous'}" has filed a formal safety complaint against the programme listing titled "${programme?.title}" (ID: ${programmeId}). Please evaluate immediately.`,
                programmeId: programmeId
            };

            // FIX: Target your active base controller endpoint mapping layout directly
            await axios.post(`${API_BASE_URL}/interactions/notification`, reportPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Thank you. Your report has been securely dispatched to the system administrators for processing.");
        } catch (error: unknown) {
            console.error("Failed to submit system report log:", error);
            alert("Your ticket could not be dispatched automatically. Please contact our system support desk directly.");
        }
    };

    const toggleTag = (item: TagItem, type: 'skill' | 'interest') => {
        if (type === 'skill') {
            const isExisting = mySkills.find(s => s.id === item.id);
            setMySkills(isExisting ? mySkills.filter(s => s.id !== item.id) : [...mySkills, item]);
        } else {
            const isExisting = myInterests.find(i => i.id === item.id);
            setMyInterests(isExisting ? myInterests.filter(i => i.id !== item.id) : [...myInterests, item]);
        }
    };

    const handleApplySubmission = async () => {
        try {
            const formData = new FormData();
            formData.append('volunteerId', user?.id || '');
            formData.append('programmeId', programmeId || '');
            formData.append('skills', JSON.stringify(mySkills.map(s => ({ id: s.id, skill_name: s.name }))));
            formData.append('interests', JSON.stringify(myInterests.map(i => ({ id: i.id, interest_name: i.name }))));

            if (selectedResume) {
                formData.append('resume', selectedResume);
            }

            await axios.post(`${API_BASE_URL}/applications`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Application submitted! Your enrollment is currently pending.");
            setEnrollmentStatus('pending');
            setShowModal(false);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                console.error("Application error details:", err.response?.data || err.message);
                const errorMsg = err.response?.data?.message || "Failed to apply.";
                alert(`Error: ${errorMsg}`);
            } else {
                console.error("Unexpected error:", err);
                alert("An unexpected error occurred.");
            }
        }
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    if (loading) return <div className="sign-up-page-wrapper"><Header /><div className="page-body">Loading...</div></div>;
    if (!programme) return <div className="page-body">Programme not found.</div>;

    return (
        <div className="sign-up-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="programme-details">
                    <div className="programme-image" style={{
                        backgroundImage: `url(${API_BASE_URL}${programme.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}></div>

                    <div className="header-row">
                        <div className="programme-name">{programme.title}</div>
                        <div className="tool-bar">
                            <button
                                className="chat-button"
                                onClick={() => {
                                    setShowChatWindow(true);
                                    setHasUnread(false);
                                }}
                                style={{ position: 'relative' }}
                            >
                                Chat
                                {hasUnread && (
                                    <span
                                        className="chat-unread-dot-indicator"
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: '#FF3B30',
                                            borderRadius: '50%',
                                            border: '2px solid #fff',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                )}
                            </button>

                            <button
                                className={`join-button ${enrollmentStatus ? 'applied-disabled' : ''}`}
                                onClick={() => !enrollmentStatus && setShowModal(true)}
                                disabled={!!enrollmentStatus}
                            >
                                {enrollmentStatus ? 'Applied' : 'Join'}
                            </button>

                            <div className="save-button-wrapper" onClick={handleToggleSave} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {isSaved ? (
                                    <AiFillStar className="save-button saved" style={{ color: '#FF8C42' }} />
                                ) : (
                                    <AiOutlineStar className="save-button" />
                                )}
                            </div>

                            <AiOutlineFlag className="report-button" onClick={handleReportProgramme} style={{ cursor: 'pointer' }} />
                        </div>
                    </div>

                    <div className="organization-details">
                        <div
                            className="organization-profile-pic"
                            style={{
                                backgroundImage: `url(${programme.organization.profile_picture_url?.startsWith('http')
                                    ? programme.organization.profile_picture_url
                                    : `${API_BASE_URL}${programme.organization.profile_picture_url}`
                                    })`,
                                backgroundSize: 'cover'
                            }}
                        ></div>
                        <div className="organization-name">{programme.organization.user.username}</div>
                        <div className="organization-rating">
                            <AiFillStar className="star-icon" />
                            <p className="organization-rating-text">{programme.organization.rating.toFixed(1)}</p>
                        </div>
                    </div>

                    <div className="metadata">
                        <div className="skills">Skills: {programme.related_skills?.map(s => <div key={s.id} className="skill">{s.skill_name}</div>)}</div>
                        <div className="interests">Interests: {programme.related_interests?.map(i => <div key={i.id} className="interest">{i.interest_name}</div>)}</div>
                    </div>

                    <div className="programme-logistics">
                        <p>Mode: {programme.schedule?.mode || 'N/A'}</p>
                        <p>Schedule: {formatDateTime(programme.schedule?.start_time)} - {formatDateTime(programme.schedule?.end_time)}</p>
                        <p>Location: {programme.schedule?.location || 'N/A'}</p>
                    </div>

                    <div className="programme-description">
                        <h2>Programme Description</h2>
                        <p>{programme.description}</p>
                    </div>

                    <div className="organization-description">
                        <h2>Organization Description</h2>
                        <p>{programme.organization.description}</p>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="application-modal">
                        <h2>Join Programme</h2>
                        <p className="modal-subtitle">Confirm your details</p>

                        <div className="modal-section">
                            <label>Skills:</label>
                            <div className="tags-container">
                                {mySkills.map(skill => (
                                    <span key={skill.id} className="tag-pill">
                                        {skill.name} <span className="remove-tag" onClick={() => toggleTag(skill, 'skill')}>x</span>
                                    </span>
                                ))}
                                <button className="add-tag-btn" onClick={() => setShowSkillBox(!showSkillBox)}>+</button>
                                {showSkillBox && (
                                    <div className="selection-box mini">
                                        <div className="selection-grid">
                                            {allSkills.map(s => (
                                                <div key={s.id} className={`selection-item ${mySkills.find(ms => ms.id === s.id) ? 'selected' : ''}`} onClick={() => toggleTag(s, 'skill')}>
                                                    {s.name}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="done-btn" onClick={() => setShowSkillBox(false)}>Done</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-section">
                            <label>Interests:</label>
                            <div className="tags-container">
                                {myInterests.map(interest => (
                                    <span key={interest.id} className="tag-pill">
                                        {interest.name} <span className="remove-tag" onClick={() => toggleTag(interest, 'interest')}>x</span>
                                    </span>
                                ))}
                                <button className="add-tag-btn" onClick={() => setShowInterestBox(!showInterestBox)}>+</button>
                                {showInterestBox && (
                                    <div className="selection-box mini">
                                        <div className="selection-grid">
                                            {allInterests.map(i => (
                                                <div key={i.id} className={`selection-item ${myInterests.find(mi => mi.id === i.id) ? 'selected' : ''}`} onClick={() => toggleTag(i, 'interest')}>
                                                    {i.name}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="done-btn" onClick={() => setShowInterestBox(false)}>Done</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-section">
                            <label>Resume:</label>
                            <div className="resume-upload-row">
                                <span className="current-resume">
                                    {selectedResume ? selectedResume.name : formatFileName(resumeUrl)}
                                </span>
                                <input type="file" ref={resumeInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={(e) => e.target.files && setSelectedResume(e.target.files[0])} />
                                <button className="modal-secondary-btn" onClick={() => resumeInputRef.current?.click()}>Update PDF</button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="modal-submit-btn" onClick={handleApplySubmission}>Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {showChatWindow && (
                <ChatWindow
                    key={`${programme.organization.user.id}_${programme.id}`}
                    onClose={() => setShowChatWindow(false)}
                    senderId={user?.id || ""}
                    receiverId={programme.organization.user.id}
                    receiverName={programme.organization.user.username}
                    receiverImage={programme.organization.profile_picture_url}
                    programmeId={programme.id}
                    programmeName={programme.title}
                />
            )}
        </div>
    );
}
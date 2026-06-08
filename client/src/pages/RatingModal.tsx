import { useState, useEffect } from 'react';
import { AiOutlineClose, AiFillStar, AiOutlineStar, AiOutlineSearch } from 'react-icons/ai';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import './rating_modal.css';

interface VolunteerRecord {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    customRating?: number;
    // ─── 🌟 FIXED: Added explicit definition to catch incoming nested user objects from the backend join ───
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    programmeId: string;
    organizationName?: string;
    organizationLogo?: string;
    organizationId?: string;
}

interface AuthenticatedUserContext {
    id: string;
    role: 'admin' | 'volunteer' | 'organization';
    email?: string;
    username?: string;
    pendingRating?: {
        programmeId: string;
        organizationName: string;
        organizationLogo: string;
    } | null;
}

const API_BASE_URL = "http://localhost:3000";

export function RatingModal({
    isOpen,
    onClose,
    programmeId,
    organizationName = "EcoGuardians Malaysia",
    organizationLogo,
    organizationId = "O001"
}: RatingModalProps) {
    const { user: rawUser } = useAuth();
    const user = rawUser as AuthenticatedUserContext | undefined;

    // Core application states
    const [rating, setRating] = useState<number>(4);
    const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>(``);
    const [loadingVolunteers, setLoadingVolunteers] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const role = user?.role || 'volunteer';

    // Fetch program volunteers automatically if logged in as an organization
    useEffect(() => {
        const hasValidId = programmeId && programmeId !== 'undefined' && programmeId !== 'null';

        if (isOpen && role === 'organization' && hasValidId) {
            const fetchProgrammeVolunteers = async () => {
                try {
                    setLoadingVolunteers(true);
                    const token = localStorage.getItem('token');

                    const response = await axios.get<VolunteerRecord[]>(
                        `${API_BASE_URL}/volunteers/programme/${programmeId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setVolunteers(response.data);
                } catch (error) {
                    console.error("Failed to fetch programme volunteers list:", error);
                } finally {
                    setLoadingVolunteers(false);
                }
            };
            fetchProgrammeVolunteers();
        }
    }, [isOpen, programmeId, role]);

    if (!isOpen) return null;

    const handleStarClick = (starValue: number) => {
        setRating(starValue);
    };

    const handleIndividualStarClick = (volunteerId: string, starValue: number) => {
        setVolunteers(prev => prev.map(vol =>
            vol.id === volunteerId ? { ...vol, customRating: starValue } : vol
        ));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (role === 'volunteer') {
                const payload = {
                    programmeId,
                    rating,
                    senderRole: 'volunteer',
                    senderId: user?.id,
                    targetId: organizationId
                };
                await axios.post(`${API_BASE_URL}/interactions/rating`, payload, config);

                if (user && 'pendingRating' in user) {
                    user.pendingRating = null;
                }
            } else {
                const ratingsPayload = volunteers.map(vol => ({
                    programmeId,
                    rating: vol.customRating !== undefined ? vol.customRating : rating,
                    senderRole: 'organization',
                    senderId: user?.id,
                    targetVolunteerId: vol.id
                }));

                await axios.post(`${API_BASE_URL}/interactions/rating/batch`, { ratings: ratingsPayload }, config);
            }

            alert("Ratings submitted successfully!");
            onClose();
        } catch (error: unknown) {
            console.error("Failed to save transaction records:", error);
            alert("Failed to save rating records down to database registry.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── 🌟 FIXED: DRILL DOWN TO NESTED USER OBJECT FOR THE FILTERING ENGINE ───
    const filteredVolunteers = volunteers.filter(vol => {
        const targetName = vol.user?.username || vol.username || vol.name || '';
        return targetName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const resolveLogoUrl = (logoPath: string | undefined): string => {
        if (!logoPath) return 'none';
        if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
            return `url(${logoPath})`;
        }
        return `url(${API_BASE_URL}${logoPath})`;
    };

    return (
        <div className="modal-portal-overlay">
            <div className="rating-modal-container">

                {/* Unified Orange Header Component */}
                <header className="rating-modal-header">
                    <h2>{role === 'organization' ? 'Rate the Volunteers!' : 'Rate the Organization!'}</h2>
                    <button className="modal-close-icon-btn" onClick={onClose}>
                        <AiOutlineClose />
                    </button>
                </header>

                {/* Main Interactive App Canvas */}
                <div className="rating-modal-body">
                    {role === 'organization' ? (
                        /* ─── CASE A: ORGANIZATION INTERFACE VIEW ─── */
                        <div className="org-rating-layout">
                            <div className="batch-rating-row">
                                <span className="batch-label-text">Batch Rating All:</span>
                                <div className="stars-interactive-row small-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} onClick={() => handleStarClick(star)} className="star-wrapper">
                                            {star <= rating ? <AiFillStar className="star-filled" /> : <AiOutlineStar className="star-empty" />}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="search-box-wrapper">
                                <div className="search-input-field">
                                    <input
                                        type="text"
                                        placeholder="Search by username to rate manually"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <AiOutlineSearch className="search-glass-icon" />
                                </div>
                            </div>

                            {/* Dynamically Populated Volunteer Rows */}
                            {loadingVolunteers ? (
                                <div className="no-result-placeholder"><p>Loading program attendants...</p></div>
                            ) : filteredVolunteers.length > 0 ? (
                                <div className="volunteers-scroll-container" style={{ maxHeight: '220px', overflowY: 'auto', margin: '15px 0', border: '1px solid #eee', borderRadius: '6px' }}>
                                    {filteredVolunteers.map((vol) => {
                                        const currentVolScore = vol.customRating !== undefined ? vol.customRating : rating;

                                        // ─── 🌟 FIXED: EXTRACT NESTED ACCOUNT USERNAMES SECURELY FROM THE OBJECT GRAPH ───
                                        const displayName = vol.user?.username || vol.username || vol.name || "Unknown Attendant";

                                        return (
                                            <div key={vol.id} className="volunteer-manual-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f5f5f5' }}>
                                                <span className="vol-item-name-text" style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{displayName}</span>
                                                <div className="stars-interactive-row individual-stars">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} onClick={() => handleIndividualStarClick(vol.id, star)} className="star-wrapper" style={{ cursor: 'pointer', fontSize: '18px', marginLeft: '3px' }}>
                                                            {star <= currentVolScore ? <AiFillStar className="star-filled" style={{ color: '#ff7f00' }} /> : <AiOutlineStar className="star-empty" style={{ color: '#ccc' }} />}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-result-placeholder">
                                    <p>No results found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ─── CASE B: VOLUNTEER INTERFACE VIEW ─── */
                        <div className="volunteer-rating-layout">
                            <div className="target-profile-header">
                                <div
                                    className="profile-circle-placeholder"
                                    style={{
                                        backgroundImage: resolveLogoUrl(organizationLogo),
                                        backgroundColor: '#f0f0f0'
                                    }}
                                />
                                <span className="target-profile-name">{organizationName}</span>
                            </div>

                            <div className="stars-interactive-row large-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} onClick={() => handleStarClick(star)} className="star-wrapper">
                                        {star <= rating ? <AiFillStar className="star-filled" /> : <AiOutlineStar className="star-empty" />}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Execution Footer Section */}
                    <div className="modal-submit-row">
                        <button
                            className="modal-orange-submit-btn"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : "Submit"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
import { useState } from 'react';
import { AiOutlineClose, AiFillStar, AiOutlineStar, AiOutlineSearch } from 'react-icons/ai';
import { useAuth } from '../context/auth/useAuth'; // Adjust path if needed
import axios from 'axios';
import './rating_modal.css';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    programmeId: string;
    organizationName?: string; // For volunteer view
    organizationLogo?: string; // For volunteer view
}

const API_BASE_URL = "http://localhost:3000";

export function RatingModal({ isOpen, onClose, programmeId, organizationName = "EcoGuardians Malaysia", organizationLogo }: RatingModalProps) {
    const { user } = useAuth();

    // Core states
    const [rating, setRating] = useState<number>(4); // Default to 4 stars as shown in images
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    if (!isOpen) return null;

    const role = user?.role || 'volunteer'; // Fallback check

    const handleStarClick = (starValue: number) => {
        setRating(starValue);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const payload = {
                programmeId,
                rating,
                senderRole: role,
                senderId: user?.id,
                // If it's an organization batch rating, search query can be sent or handled accordingly
                batchSearch: role === 'organization' ? searchQuery : undefined
            };

            await axios.post(`${API_BASE_URL}/interactions/rating`, payload);
            alert("Rating submitted successfully!");
            onClose();
        } catch (error: unknown) {
            console.error("Failed to submit rating:", error);
            alert("Failed to submit rating entry.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-portal-overlay">
            <div className="rating-modal-container">

                {/* Unified Orange Header */}
                <header className="rating-modal-header">
                    <h2>{role === 'organization' ? 'Rate the Volunteers!' : 'Rate the Organization!'}</h2>
                    <button className="modal-close-icon-btn" onClick={onClose}>
                        <AiOutlineClose />
                    </button>
                </header>

                {/* Conditional Modal Body Wrapper */}
                <div className="rating-modal-body">
                    {role === 'organization' ? (
                        /* --- IMAGE 1: ORGANIZATION VIEW --- */
                        <div className="org-rating-layout">
                            <div className="batch-rating-row">
                                <span className="batch-label-text">Batch Rating:</span>
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

                            <div className="no-result-placeholder">
                                <p>No result</p>
                            </div>
                        </div>
                    ) : (
                        /* --- IMAGE 2: VOLUNTEER VIEW --- */
                        <div className="volunteer-rating-layout">
                            <div className="target-profile-header">
                                <div
                                    className="profile-circle-placeholder"
                                    style={{ backgroundImage: organizationLogo ? `url(${organizationLogo})` : 'none' }}
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

                    {/* Unified Bottom Submit Button */}
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
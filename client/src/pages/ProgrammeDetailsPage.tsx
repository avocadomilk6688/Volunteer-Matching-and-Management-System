import { AiFillStar, AiOutlineStar, AiOutlineFlag } from 'react-icons/ai';
import { Header } from './Header';
import './programme_details_page.css';
import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
            username: string;
            email: string;
        }
    };
}

export function ProgrammeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [programme, setProgramme] = useState<ProgrammeDetailsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgrammeDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3000/programmes/${id}`);
                setProgramme(response.data);
            } catch (error) {
                console.error("Error fetching programme details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProgrammeDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="sign-up-page-wrapper">
                <Header />
                <div className="page-body">Loading programme details...</div>
            </div>
        );
    }

    if (!programme) {
        return (
            <div className="sign-up-page-wrapper">
                <Header />
                <div className="page-body">Programme not found.</div>
            </div>
        );
    }

    // Helper to format the date and time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="sign-up-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="programme-details">
                    <div
                        className="programme-image"
                        style={{
                            backgroundImage: `url(${programme.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '400px',
                            width: '100%'
                        }}
                    ></div>

                    <div className="header-row">
                        <div className="programme-name">{programme.title}</div>
                        <div className="tool-bar">
                            <button className="chat-button">Chat</button>
                            <button className="join-button">Join</button>
                            <AiOutlineStar className="save-button" />
                            <AiOutlineFlag className="report-button" />
                        </div>
                    </div>

                    <div className="organization-details">
                        <div
                            className="organization-profile-pic"
                            style={{
                                backgroundImage: `url(${programme.organization.profile_picture_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        ></div>
                        <div className="organization-name">
                            {programme.organization.user.username}
                        </div>
                        <div className="organization-rating">
                            <AiFillStar className="star-icon" />
                            <p className="organization-rating-text">
                                {programme.organization.rating.toFixed(1)}
                            </p>
                        </div>
                    </div>

                    <div className="metadata">
                        <div className="skills">
                            Skills:
                            {programme.related_skills?.map(skill => (
                                <div key={skill.id} className="skill">{skill.skill_name}</div>
                            ))}
                        </div>
                        <div className="interests">
                            Interests:
                            {programme.related_interests?.map(interest => (
                                <div key={interest.id} className="interest">{interest.interest_name}</div>
                            ))}
                        </div>
                    </div>

                    <div className="programme-logistics">
                        <p>Mode: {programme.schedule?.mode || 'N/A'}</p>
                        <p>
                            Schedule: {formatDateTime(programme.schedule?.start_time)} - {formatDateTime(programme.schedule?.end_time)}
                        </p>
                        <p>Location: {programme.schedule?.location || 'N/A'}</p>
                    </div>

                    <div className="programme-description">
                        <h2>Programme Description</h2>
                        <p>{programme.description}</p>
                    </div>

                    <div className="organization-description">
                        <h2>Organization Description</h2>
                        <p>{programme.organization.description}</p>
                        <div className="contact-info">
                            <p>Address: {programme.schedule?.location}</p>
                            <p>Contact number: {programme.organization.contact_number}</p>
                            <p>Email address: {programme.organization.user.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
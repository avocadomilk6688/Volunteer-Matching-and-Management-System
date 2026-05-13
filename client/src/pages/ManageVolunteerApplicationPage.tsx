import { Header } from './Header';
import './manage_volunteer_application.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { AiFillStar } from 'react-icons/ai';
import { BiFilterAlt } from 'react-icons/bi';
import { useAuth } from '../context/auth/useAuth';

// --- Interfaces matching your DB structure ---
interface Skill { id: string; skill_name: string; }
interface Interest { id: string; interest_name: string; }

interface VolunteerApplication {
    id: string;
    status: string;
    applied_at: string;
    volunteer: {
        id: string;
        rating: number;
        resume_url: string | null; // Resume is stored here
        user: { username: string };
        skills: Skill[];
        interests: Interest[];
    };
    programme: {
        id: string;
        title: string;
    };
}

export function ManageVolunteerApplicationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const API_BASE_URL = "http://localhost:3000";

    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = ['Volunteer', 'Current skills', 'Current interests', 'Resume', 'Programme applied', 'Action'];

    const fetchApplications = async () => {
        if (!user?.id) return;
        const token = localStorage.getItem('token');

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/applications/organization/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();

            if (Array.isArray(data)) {
                // Show only pending applications for the "Manage" screen
                const pendingApps = data.filter((app: VolunteerApplication) => app.status === 'pending');
                setApplications(pendingApps);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [user?.id]);

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        const token = localStorage.getItem('token');
        if (!window.confirm(`Are you sure you want to ${newStatus} this application?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert(`Application ${newStatus}!`);
                fetchApplications();
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    // Helper to extract filename from the path
    const getFileName = (url: string | null | undefined) => {
        if (!url) return 'No Resume';
        return url.split('/').pop();
    };

    return (
        <div className="manage-app-wrapper">
            <Header />
            <div className="manage-app-container">
                <aside className="org-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-listing' ? 'active' : ''} onClick={() => navigate('/manage-listing')}>Manage listing</li>
                            <li className={location.pathname === '/manage-applications' ? 'active' : ''} onClick={() => navigate('/manage-applications')}>Manage volunteer application</li>
                        </ul>
                    </nav>
                </aside>

                <main className="manage-app-content">
                    <h1>Manage Volunteer Application</h1>

                    <button className="filter-dropdown-btn">
                        Programme <BiFilterAlt className="filter-icon" />
                    </button>

                    {loading ? (
                        <div className="loading-state">Loading applications...</div>
                    ) : applications.length === 0 ? (
                        <div className="no-results">No pending applications found.</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {applications.map((app) => (
                                <tr key={app.id}>
                                    <td className="col-volunteer">
                                        <div className="volunteer-info">
                                            <span className="name">{app.volunteer.user.username}</span>
                                            <span className="rating">
                                                <AiFillStar className="star-icon" />
                                                {app.volunteer.rating?.toFixed(1) || '0.0'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {app.volunteer.skills.map(s => (
                                                <span key={s.id} className="orange-badge">{s.skill_name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {app.volunteer.interests.map(i => (
                                                <span key={i.id} className="orange-badge">{i.interest_name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="col-resume">
                                        {/* FIX: Looking at app.volunteer.resume_url */}
                                        {app.volunteer.resume_url ? (
                                            <a
                                                href={`${API_BASE_URL}${app.volunteer.resume_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="file-link"
                                            >
                                                {getFileName(app.volunteer.resume_url)}
                                            </a>
                                        ) : (
                                            <span className="no-file">No Resume</span>
                                        )}
                                    </td>
                                    <td className="col-applied">
                                        <span className="prog-link">{app.programme.title}</span>
                                    </td>
                                    <td className="col-action">
                                        <div className="action-buttons">
                                            <button className="approve-btn" onClick={() => handleUpdateStatus(app.id, 'approved')}>Approve</button>
                                            <button className="reject-btn" onClick={() => handleUpdateStatus(app.id, 'rejected')}>Reject</button>
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
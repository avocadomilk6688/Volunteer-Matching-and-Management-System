import { Header } from './Header';
import './manage_volunteer_application.css';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { AiFillStar } from 'react-icons/ai';
import { BiFilterAlt } from 'react-icons/bi';
import { useAuth } from '../context/auth/useAuth';

// --- Interfaces ---
interface Skill { id: string; skill_name: string; }
interface Interest { id: string; interest_name: string; }

interface ProgrammeEntity {
    id: string;
    title: string;
    organization?: { id: string; rating: number };
    related_skills?: Skill[]; // Eagerly loaded from your backend findAllAdmin/findOne models
    related_interests?: Interest[];
}

interface VolunteerApplication {
    id: string;
    status: string;
    applied_at: string;
    volunteer: {
        id: string;
        rating: number;
        resume_url: string | null;
        user: {
            id: string;
            username: string
        };
        skills: Skill[];
        interests: Interest[];
    };
    programme: {
        id: string;
        title: string;
    };
}

interface BackendProgResponse {
    items: ProgrammeEntity[];
    total: number;
}

export function ManageVolunteerApplicationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const API_BASE_URL = "http://localhost:3000";

    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [allProgrammes, setAllProgrammes] = useState<ProgrammeEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // ─── 🌟 UPDATED HEADERS: ADDED 'RANK' AS THE FIRST COLUMN ON THE LEFT ───
    const headers = ['Rank', 'Volunteer', 'Current skills', 'Current interests', 'Resume', 'Programme applied', 'Action'];

    const fetchData = async () => {
        if (!user?.id) return;
        const token = localStorage.getItem('token');

        try {
            setLoading(true);
            const [appRes, progRes] = await Promise.all([
                fetch(`${API_BASE_URL}/applications/organization/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/programmes?limit=100`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const appData = await appRes.json();
            const progData = await progRes.json() as BackendProgResponse;

            let orgProgrammes: ProgrammeEntity[] = [];
            if (progData && Array.isArray(progData.items)) {
                orgProgrammes = progData.items.filter(
                    (p: ProgrammeEntity) => p.organization?.id === user.id
                );
                setAllProgrammes(orgProgrammes);
            }

            if (Array.isArray(appData)) {
                const pendingApps = appData.filter((app: VolunteerApplication) => app.status === 'pending');

                // ─── 🌟 HYBRID RECOMMENDATION ALGORITHM MATRIX FOR APPLICATION SORTING ───
                const sortedPendingApps = pendingApps.sort((a, b) => {
                    const progA = orgProgrammes.find(p => p.id === a.programme.id);
                    const progB = orgProgrammes.find(p => p.id === b.programme.id);

                    const calculateHybridRelevanceScore = (app: VolunteerApplication, prog?: ProgrammeEntity) => {
                        if (!prog) return 0;

                        let totalScore = 0;

                        // 1. Organization Base Core Rating Element ((COALESCE(organization.rating, 0) * 5))
                        const orgRatingWeight = (prog.organization?.rating || 0) * 5;
                        totalScore += orgRatingWeight;

                        // 2. Skill-Match Overlap Strategy Matrix (+10 points base weight per skill)
                        if (prog.related_skills && Array.isArray(prog.related_skills)) {
                            const targetSkillIds = prog.related_skills.map(s => s.id);

                            app.volunteer.skills.forEach(skill => {
                                if (targetSkillIds.includes(skill.id)) {
                                    totalScore += 10;
                                    totalScore += (app.volunteer.rating || 0) * 2;
                                }
                            });
                        }

                        // 3. Interest-Match Overlap Corridor Loop (+15 points base weight per interest)
                        if (prog.related_interests && Array.isArray(prog.related_interests)) {
                            const targetInterestIds = prog.related_interests.map(i => i.id);

                            app.volunteer.interests.forEach(interest => {
                                if (targetInterestIds.includes(interest.id)) {
                                    totalScore += 15;
                                }
                            });
                        }

                        // 4. Volunteer Performance Quality Factor (Tie-breaker parameter)
                        totalScore += (app.volunteer.rating || 0) * 5;

                        return totalScore;
                    };

                    const scoreA = calculateHybridRelevanceScore(a, progA);
                    const scoreB = calculateHybridRelevanceScore(b, progB);

                    return scoreB - scoreA; // Descending order: Best matching suitability score lands first!
                });

                setApplications(sortedPendingApps);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const filterOptions = useMemo(() => {
        const options = allProgrammes.map(prog => {
            const count = applications.filter(app => app.programme.id === prog.id).length;
            return {
                id: prog.id,
                title: prog.title,
                display: `${prog.title} (${count})`
            };
        });
        const totalPending = applications.length;
        return [{ id: 'All', title: 'All', display: `All (${totalPending})` }, ...options];
    }, [allProgrammes, applications]);

    const filteredApplications = useMemo(() => {
        if (selectedProgrammeId === 'All') return applications;
        return applications.filter(app => app.programme.id === selectedProgrammeId);
    }, [applications, selectedProgrammeId]);

    const currentFilterLabel = useMemo(() => {
        const selected = filterOptions.find(opt => opt.id === selectedProgrammeId);
        return selected ? selected.title : 'Programme';
    }, [selectedProgrammeId, filterOptions]);

    const handleUpdateStatus = async (id: string, action: 'approve' | 'reject') => {
        const token = localStorage.getItem('token');
        const newStatus = action === 'approve' ? 'upcoming' : 'rejected';

        if (!window.confirm(`Are you sure you want to ${action} this application?`)) return;

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
                alert(`Application ${action === 'approve' ? 'Approved' : 'Rejected'}! Notification sent.`);
                fetchData();
            } else {
                alert("Failed to update application status.");
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

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

                    <div className="filter-container">
                        <button className="filter-dropdown-btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            {currentFilterLabel} <BiFilterAlt className="filter-icon" />
                        </button>

                        {isFilterOpen && (
                            <div className="filter-menu">
                                {filterOptions.map(opt => (
                                    <div
                                        key={opt.id}
                                        className={`filter-item ${selectedProgrammeId === opt.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedProgrammeId(opt.id);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        {opt.display}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading applications...</div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="no-results">No pending applications found.</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {filteredApplications.map((app, index) => (
                                <tr key={app.id}>
                                    {/* ─── 🌟 ADDED: RANK COLUMN DISPLAY BLOCK ─── */}
                                    <td className="col-rank" style={{ fontWeight: 'bold', color: '#ff7f00', fontSize: '15px', textAlign: 'center' }}>
                                        #{index + 1}
                                    </td>

                                    {/* ─── 🌟 FIXED: REMOVED CLICK HANDLER AND UNDERLINE TEXT STYLES FROM VOLUNTEER CELL ─── */}
                                    <td className="col-volunteer">
                                        <div className="volunteer-info">
                                            <span className="name" style={{ color: '#333', fontWeight: 'bold' }}>
                                                {app.volunteer.user.username}
                                            </span>
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
                                        {app.volunteer.resume_url ? (
                                            <a href={`${API_BASE_URL}${app.volunteer.resume_url}`} target="_blank" rel="noreferrer" className="file-link">
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
                                            <button className="approve-btn" onClick={() => handleUpdateStatus(app.id, 'approve')}>Approve</button>
                                            <button className="reject-btn" onClick={() => handleUpdateStatus(app.id, 'reject')}>Reject</button>
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
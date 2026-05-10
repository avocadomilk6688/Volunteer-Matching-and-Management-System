import { Header } from './Header';
import './manage_volunteer_application.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { AiFillStar } from 'react-icons/ai';
import { BiFilterAlt } from 'react-icons/bi';

// --- Interfaces ---
interface VolunteerApplication {
    id: string;
    volunteerName: string;
    rating: number;
    skills: string[];
    interests: string[];
    resumeFileName: string;
    programmeApplied: string;
}

export function ManageVolunteerApplicationPage() {
    const navigate = useNavigate(); // Initialize navigate
    const location = useLocation(); // Initialize location

    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = ['Volunteer', 'Current skills', 'Current interests', 'Resume', 'Programme applied', 'Action'];

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const mockData: VolunteerApplication[] = [
                    {
                        id: 'A001',
                        volunteerName: 'Maggie',
                        rating: 5.0,
                        skills: ['Teamwork', 'Waste management', 'Event Coordination'],
                        interests: ['Sustainability', 'Community Services'],
                        resumeFileName: 'maggie_resume.pdf',
                        programmeApplied: 'Green Earth Clean-Up Drive'
                    },
                    {
                        id: 'A002',
                        volunteerName: 'Lydia',
                        rating: 4.9,
                        skills: ['Gardening', 'Creative', 'Communication'],
                        interests: ['Sustainability'],
                        resumeFileName: 'lydia_resume.pdf',
                        programmeApplied: 'Bright Minds Tutoring Sessions'
                    }
                ];

                setTimeout(() => {
                    setApplications(mockData);
                    setLoading(false);
                }, 500);

            } catch (error) {
                console.error("Error fetching applications:", error);
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const handleApprove = (id: string) => console.log('Approved:', id);
    const handleReject = (id: string) => console.log('Rejected:', id);

    return (
        <div className="manage-app-wrapper">
            <Header />
            <div className="manage-app-container">
                {/* Sidebar with Navigation Logic */}
                <aside className="org-sidebar">
                    <nav>
                        <ul>
                            <li
                                className={location.pathname === '/manage-listing' ? 'active' : ''}
                                onClick={() => navigate('/manage-listing')}
                            >
                                Manage listing
                            </li>
                            <li
                                className={location.pathname === '/manage-applications' ? 'active' : ''}
                                onClick={() => navigate('/manage-applications')}
                            >
                                Manage volunteer application
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="manage-app-content">
                    <h1>Manage Volunteer Application</h1>

                    <button className="filter-dropdown-btn">
                        Programme <BiFilterAlt className="filter-icon" />
                    </button>

                    {loading ? (
                        <div className="loading-state">Loading applications...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {applications.map((app) => (
                                <tr key={app.id}>
                                    <td className="col-volunteer">
                                        <div className="volunteer-info">
                                            <span className="name">{app.volunteerName}</span>
                                            <span className="rating">
                                                <AiFillStar className="star-icon" />
                                                {app.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {app.skills.map(skill => (
                                                <span key={skill} className="orange-badge">{skill}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {app.interests.map(interest => (
                                                <span key={interest} className="orange-badge">{interest}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="col-resume">
                                        <span className="file-link">{app.resumeFileName}</span>
                                    </td>
                                    <td className="col-applied">
                                        <span className="prog-link">{app.programmeApplied}</span>
                                    </td>
                                    <td className="col-action">
                                        <div className="action-buttons">
                                            <button className="approve-btn" onClick={() => handleApprove(app.id)}>Approve</button>
                                            <button className="reject-btn" onClick={() => handleReject(app.id)}>Reject</button>
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
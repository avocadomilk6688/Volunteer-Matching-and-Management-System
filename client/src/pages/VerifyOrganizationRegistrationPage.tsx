import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import axios from 'axios';
import './verify_organization_registration_page.css';

// --- UPDATED: Interface matches your exact database columns precisely ---
interface OrgRegistration {
    id: string;
    name: string;
    submitted_documents: string;
    authorized_person: string;
    submission_time: string; // datetime string format
    status: string;
    description: string;
    address?: string | null;
}

const API_BASE_URL = "http://localhost:3000";

export function VerifyOrganizationRegistrationPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [registrations, setRegistrations] = useState<OrgRegistration[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch live pending registrations from your endpoint pipeline
            const response = await axios.get<OrgRegistration[]>(`${API_BASE_URL}/admin/registrations/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistrations(response.data);
        } catch (error) {
            console.error("Error retrieving active verification list records:", error);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleAction = async (id: string, actionType: 'approve' | 'reject', orgName: string) => {
        const actionConfirmText = actionType === 'approve' ? 'approve registration for' : 'reject registration for';
        if (!window.confirm(`Are you sure you want to ${actionConfirmText} "${orgName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/admin/registrations/${id}/verify`,
                { status: actionType === 'approve' ? 'approved' : 'rejected' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Organization has been successfully ${actionType}d.`);
            fetchRegistrations(); // Instantly pull updated table datasets
        } catch (error) {
            console.error("Verification modification error:", error);
            alert("Failed to modify verification state on server.");
        }
    };

    const headers = ['Organization', 'Submitted Documents', 'Authorized Person', 'Description', 'Submission Time', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

                {/* Left Navigation Sidebar */}
                <aside className="admin-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-user-account' ? 'active' : ''} onClick={() => navigate('/manage-user-account')}>
                                Manage user account
                            </li>
                            <li className={location.pathname === '/verify-organization-registration' ? 'active' : ''} onClick={() => navigate('/verify-organization-registration')}>
                                Verify organization registration
                            </li>
                            <li className={location.pathname === '/admin-manage-listing' ? 'active' : ''} onClick={() => navigate('/admin-manage-listing')}>
                                Manage listing
                            </li>
                            <li className={location.pathname === '/manage-qa' ? 'active' : ''} onClick={() => navigate('/manage-qa')}>
                                Manage Q&A section
                            </li>
                            <li className={location.pathname === '/manage-tickets' ? 'active' : ''} onClick={() => navigate('/manage-tickets')}>
                                Manage support ticket
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Right content execution view track */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Verify Organization Registration</h1>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing verification queue records...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {registrations.length > 0 ? (
                                registrations.map((row) => {
                                    // Helper block to present datetime strings cleanly inside your layout rows
                                    const formattedTime = row.submission_time
                                        ? new Date(row.submission_time).toLocaleString()
                                        : 'N/A';

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-org-name">{row.name}</td>
                                            <td>
                                                <a
                                                    href={`${API_BASE_URL}${row.submitted_documents}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="admin-document-link"
                                                >
                                                    document.pdf
                                                </a>
                                            </td>
                                            <td>{row.authorized_person}</td>
                                            <td className="admin-cell-description">{row.description}</td>
                                            <td className="admin-cell-time">{formattedTime}</td>
                                            <td className="admin-cell-verify-actions">
                                                <div className="admin-verify-btn-group">
                                                    <button
                                                        className="admin-approve-btn"
                                                        onClick={() => handleAction(row.id, 'approve', row.name)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="admin-reject-btn"
                                                        onClick={() => handleAction(row.id, 'reject', row.name)}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="admin-empty-table-fallback">
                                        No pending organization registration verifications in queue.
                                    </td>
                                </tr>
                            )}
                        </GenericTable>
                    )}
                </main>

            </div>
        </div>
    );
}
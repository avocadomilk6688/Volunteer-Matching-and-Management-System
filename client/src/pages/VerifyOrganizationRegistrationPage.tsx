import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import axios from 'axios';
import './verify_organization_registration_page.css';

// --- Interface matches your exact TypeORM database entity properties precisely ---
interface OrgRegistration {
    id: string;
    organizationName: string;      // Matches entity property mapping
    supporting_documents: string[]; // Matches TypeORM simple-array structure
    authorizedPersonName: string;  // Matches entity property mapping
    submission_time: string;       // datetime string format
    status: string;
    description: string;
    address?: string | null;       // Entity address field hook
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
            const response = await axios.get<OrgRegistration[]>(`${API_BASE_URL}/organizations/registration/pending`, {
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

    // ─── FIXED: DYNAMIC ISOLATED RECOVERY PIPELINE CONTEXT ───
    const handleAction = async (id: string, actionType: 'approve' | 'reject', orgName: string) => {
        const actionConfirmText = actionType === 'approve' ? 'approve registration for' : 'reject registration for';
        if (!window.confirm(`Are you sure you want to ${actionConfirmText} "${orgName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // 1. Fetch the absolute source of truth individual item record directly from the backend.
            // This gets us the original database string, completely bypassing the array sanitization logic.
            const sourceOfTruthResponse = await axios.get(`${API_BASE_URL}/organizations/registration/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fallback recovery if parsing anomalies surface
            const rawAuthorizedPerson = sourceOfTruthResponse.data?.authorizedPersonName || '';

            // 2. Safely forward the original intact string payload to the PATCH router layer
            await axios.patch(`${API_BASE_URL}/organizations/registration/${id}`,
                {
                    status: actionType === 'approve' ? 'approved' : 'rejected',
                    authorizedPersonName: rawAuthorizedPerson
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Organization has been successfully ${actionType}d.`);
            fetchRegistrations(); // Instantly pull updated table datasets
        } catch (error) {
            console.error("Verification modification error:", error);
            alert("Failed to modify verification state on server.");
        }
    };

    // --- ADDED: 'Address' into the headers array ---
    const headers = ['Organization', 'Submitted Documents', 'Authorized Person', 'Address', 'Description', 'Submission Time', 'Action'];

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

                                    // Safely isolates structural file items inside the multi-document wrapper array
                                    const primaryDocumentPath = Array.isArray(row.supporting_documents) && row.supporting_documents.length > 0
                                        ? row.supporting_documents[0]
                                        : '';

                                    // ─── FIXED: PARSE OUT THE SYSTEM PIPELINES TO DISPLAY A CLEAN NAME ───
                                    const cleanNameDisplay = row.authorizedPersonName?.includes('|')
                                        ? row.authorizedPersonName.split('|')[0]
                                        : row.authorizedPersonName;

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-org-name">{row.organizationName}</td>
                                            <td>
                                                {primaryDocumentPath ? (
                                                    <a
                                                        href={`${API_BASE_URL}${primaryDocumentPath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-document-link"
                                                    >
                                                        document.pdf
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '13px' }}>No docs uploaded</span>
                                                )}
                                            </td>
                                            {/* Render sanitized name variant to keeping the UI completely pristine */}
                                            <td>{cleanNameDisplay}</td>
                                            {/* --- ADDED: Address Cell layout rendering column --- */}
                                            <td className="admin-cell-address">{row.address || 'N/A'}</td>
                                            <td className="admin-cell-description">{row.description}</td>
                                            <td className="admin-cell-time">{formattedTime}</td>
                                            <td className="admin-cell-verify-actions">
                                                <div className="admin-verify-btn-group">
                                                    <button
                                                        className="admin-approve-btn"
                                                        // ─── FIXED: REMOVED COMPONENT STATE TRACKING VALUE REVERSION ───
                                                        onClick={() => handleAction(row.id, 'approve', row.organizationName)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="admin-reject-btn"
                                                        onClick={() => handleAction(row.id, 'reject', row.organizationName)}
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
                                    {/* --- FIXED: Bumped colSpan to 7 to safely cover our new column configuration --- */}
                                    <td colSpan={7} className="admin-empty-table-fallback">
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
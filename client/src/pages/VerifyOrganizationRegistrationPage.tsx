import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import axios from 'axios';
import './verify_organization_registration_page.css';

interface OrgRegistration {
    id: string;
    organizationName: string;
    supporting_documents: string[];
    authorizedPersonName: string;
    submission_time: string;
    status: string;
    description: string;
    address?: string | null;
}

const API_BASE_URL = "http://localhost:3000";

export function VerifyOrganizationRegistrationPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [registrations, setRegistrations] = useState<OrgRegistration[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

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

    const handleAction = async (id: string, actionType: 'approve' | 'reject', orgName: string) => {
        const actionConfirmText = actionType === 'approve' ? 'approve registration for' : 'reject registration for';
        if (!window.confirm(`Are you sure you want to ${actionConfirmText} "${orgName}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const sourceOfTruthResponse = await axios.get(`${API_BASE_URL}/organizations/registration/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawAuthorizedPerson = sourceOfTruthResponse.data?.authorizedPersonName || '';

            await axios.patch(`${API_BASE_URL}/organizations/registration/${id}`,
                {
                    status: actionType === 'approve' ? 'approved' : 'rejected',
                    authorizedPersonName: rawAuthorizedPerson
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Organization has been successfully ${actionType}d.`);
            fetchRegistrations();
        } catch (error) {
            console.error("Verification modification error:", error);
            alert("Failed to modify verification state on server.");
        }
    };

    const headers = ['Organization', 'Submitted Documents', 'Authorized Person', 'Address', 'Description', 'Submission Time', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

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

                <main className="admin-main-content">
                    <h1 className="admin-main-title">Verify Organization Registration</h1>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing verification queue records...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {registrations.length > 0 ? (
                                registrations.map((row) => {
                                    const formattedTime = row.submission_time
                                        ? new Date(row.submission_time).toLocaleString()
                                        : 'N/A';

                                    const cleanNameDisplay = row.authorizedPersonName?.includes('|')
                                        ? row.authorizedPersonName.split('|')[0]
                                        : row.authorizedPersonName;

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-org-name">{row.organizationName}</td>

                                            {/* ─── FIXED: DYNAMIC MULTI-DOCUMENT DOWNLOAD RENDERING SYSTEM ─── */}
                                            <td>
                                                {Array.isArray(row.supporting_documents) && row.supporting_documents.length > 0 ? (
                                                    <div className="admin-document-links-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {row.supporting_documents.map((docPath, index) => (
                                                            <a
                                                                key={`${row.id}-doc-${index}`}
                                                                href={`${API_BASE_URL}${docPath.trim()}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="admin-document-link"
                                                                style={{ display: 'inline-block', fontSize: '13px' }}
                                                            >
                                                                doc_{index + 1}.pdf
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '13px' }}>No docs uploaded</span>
                                                )}
                                            </td>

                                            <td>{cleanNameDisplay}</td>
                                            <td className="admin-cell-address">{row.address || 'N/A'}</td>
                                            <td className="admin-cell-description">{row.description}</td>
                                            <td className="admin-cell-time">{formattedTime}</td>
                                            <td className="admin-cell-verify-actions">
                                                <div className="admin-verify-btn-group">
                                                    <button
                                                        className="admin-approve-btn"
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
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import axios from 'axios';
import './admin_manage_qa_page.css';

// Interface matches your exact database schema model properties precisely
interface QAItem {
    id: string;
    question: string;
    answer: string;
    category: 'Volunteer' | 'Organization' | 'Admin' | string;
    adminId?: string | null;
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageQAPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [qaItems, setQaItems] = useState<QAItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchQaItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // --- FIXED: Combined standard route mapping to use your real modular interactions path ---
            const response = await axios.get<QAItem[]>(`${API_BASE_URL}/interactions/qa`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQaItems(response.data);
        } catch (error) {
            console.error("Backend dynamic fetch failed, clearing table row displays:", error);
            setQaItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQaItems();
    }, []);

    const handleModify = (id: string) => {
        navigate(`/admin/manage-qa/edit/${id}`);
    };

    const handleDeleteQA = async (id: string, questionSnippet: string) => {
        const displaySnippet = questionSnippet.length > 40 ? `${questionSnippet.slice(0, 40)}...` : questionSnippet;
        if (!window.confirm(`Are you sure you want to permanently delete the FAQ item: "${displaySnippet}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // --- FIXED: Routed deletion query directly to the interactions module parameters path ---
            await axios.delete(`${API_BASE_URL}/interactions/qa/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("FAQ item successfully removed.");
            fetchQaItems();
        } catch (error) {
            console.error("Deletion error on database context mapping:", error);
            alert("Failed to drop record item from database tables.");
        }
    };

    const handleAddRedirect = () => {
        navigate('/admin/manage-qa/create');
    };

    const headers = ['Question', 'Answer', 'Category', 'Action'];

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

                {/* Right central work dashboard canvas dashboard frame */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage Q&A section</h1>

                    {/* Action Toolbar Panel */}
                    <div className="admin-action-toolbar left-btn-only">
                        <button className="admin-add-qa-btn" onClick={handleAddRedirect}>
                            Add
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing FAQ records matrix array...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {qaItems.length > 0 ? (
                                qaItems.map((row) => {
                                    const categoryDisplay = row.category
                                        ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
                                        : 'N/A';

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-qa-question">{row.question}</td>
                                            <td className="admin-cell-qa-answer">{row.answer || 'No text provided'}</td>
                                            <td className="admin-cell-qa-category">{categoryDisplay}</td>
                                            <td className="admin-cell-qa-actions">
                                                <div className="admin-qa-btn-group">
                                                    <button
                                                        className="admin-modify-qa-btn"
                                                        onClick={() => handleModify(row.id)}
                                                    >
                                                        Modify
                                                    </button>
                                                    <button
                                                        className="admin-delete-qa-btn"
                                                        onClick={() => handleDeleteQA(row.id, row.question)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="admin-empty-table-fallback">
                                        No active FAQ records discovered inside the platform database.
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
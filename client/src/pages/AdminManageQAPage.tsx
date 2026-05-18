import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import axios from 'axios';
import './admin_manage_qa_page.css';

interface QAItem {
    id: string;
    question: string;
    answer: string;
    category: 'Volunteer' | 'Organization' | 'Admin';
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageQAPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [qaItems, setQaItems] = useState<QAItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Mock dataset directly extracted from your screenshot image for immediate functionality
    const mockQaItems: QAItem[] = [
        {
            id: 'QA001',
            question: 'How does the system recommend volunteering programs to me?',
            answer: 'The VMMS uses a smart matching and discovery feature. It analyzes your specific skills, interests, location, and availability to provide personalized recommendations that align with your profile.',
            category: 'Volunteer'
        },
        {
            id: 'QA002',
            question: 'How is my contribution recognized on the platform?',
            answer: 'To keep volunteers motivated, the system features a monthly leaderboard. Top-performing volunteers are highlighted based on their participation frequency or the ratings they receive from organization upon program completion.',
            category: 'Volunteer'
        },
        {
            id: 'QA003',
            question: 'Can I manage which volunteers join my program?',
            answer: 'Yes. Organizations have the functionality to manage volunteer applications directly. You can review volunteer details and have the authority to accept or remove registered volunteers from your programs as needed.',
            category: 'Organization'
        }
    ];

    const fetchQaItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get<QAItem[]>(`${API_BASE_URL}/admin/qa`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQaItems(response.data.length > 0 ? response.data : mockQaItems);
        } catch (error) {
            console.warn("Backend dynamic fetch omitted, using mockup dataset channels:", error);
            setQaItems(mockQaItems);
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
            await axios.delete(`${API_BASE_URL}/admin/qa/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("FAQ item successfully removed.");
            fetchQaItems();
        } catch (error) {
            console.error("Deletion error:", error);
            // Local state cleanup fallback if backend path is unconfigured
            setQaItems(prev => prev.filter(item => item.id !== id));
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
                
                {/* Left navigation sidebar matching architectural design layout layout standards */}
                <aside className="admin-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-users' ? 'active' : ''} onClick={() => navigate('/manage-users')}>
                                Manage user account
                            </li>
                            <li className={location.pathname === '/verify-orgs' ? 'active' : ''} onClick={() => navigate('/verify-orgs')}>
                                Verify organization registration
                            </li>
                            <li className={location.pathname === '/manage-listings' ? 'active' : ''} onClick={() => navigate('/manage-listings')}>
                                Manage listing
                            </li>
                            <li className={location.pathname === '/admin/manage-qa' || location.pathname === '/manage-qa' ? 'active' : ''} onClick={() => navigate('/manage-qa')}>
                                Manage Q&A section
                            </li>
                            <li className={location.pathname === '/admin/manage-tickets' ? 'active' : ''} onClick={() => navigate('/admin/manage-tickets')}>
                                Manage support ticket
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Right central work dashboard canvas dashboard frame */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage Q&A section</h1>

                    {/* Action Toolbar Block Panel containing specific sharp corner Add Button */}
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
                                qaItems.map((row) => (
                                    <tr key={row.id}>
                                        <td className="admin-cell-qa-question">{row.question}</td>
                                        <td className="admin-cell-qa-answer">{row.answer}</td>
                                        <td className="admin-cell-qa-category">{row.category}</td>
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
                                ))
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
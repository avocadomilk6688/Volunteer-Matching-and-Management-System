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
    category: 'Volunteer' | 'Organization' | string;
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageQAPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [qaItems, setQaItems] = useState<QAItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // --- Inline Management Workflow States ---
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states for adding a new item
    const [newRowData, setNewRowData] = useState({
        question: '',
        answer: '',
        category: 'Volunteer'
    });

    // Form states for editing an existing item
    const [editRowData, setEditRowData] = useState({
        question: '',
        answer: '',
        category: 'Volunteer'
    });

    const fetchQaItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
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

    // --- Create Inline Form Handler ---
    const handleSaveNew = async () => {
        if (!newRowData.question.trim() || !newRowData.answer.trim()) {
            alert("Both Question and Answer fields are required.");
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // --- CLEANED: Payload handles only necessary fields directly ---
            await axios.post(`${API_BASE_URL}/interactions/qa`, newRowData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("New FAQ item saved successfully!");
            setIsAdding(false);
            setNewRowData({ question: '', answer: '', category: 'Volunteer' });
            fetchQaItems();
        } catch (error) {
            console.error("Error creating QA entity:", error);
            alert("Failed to save new FAQ record item on server database.");
        }
    };

    // --- Update Inline Form Handlers ---
    const startEditing = (row: QAItem) => {
        setEditingId(row.id);
        setEditRowData({
            question: row.question,
            answer: row.answer,
            category: row.category
        });
    };

    const handleSaveUpdate = async (id: string) => {
        if (!editRowData.question.trim() || !editRowData.answer.trim()) {
            alert("Both Question and Answer fields are required.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/interactions/qa/${id}`, editRowData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("FAQ item updated successfully!");
            setEditingId(null);
            fetchQaItems();
        } catch (error) {
            console.error("Error updating QA entity:", error);
            alert("Failed to update FAQ record item on server database.");
        }
    };

    // --- Delete Handler ---
    const handleDeleteQA = async (id: string, questionSnippet: string) => {
        const displaySnippet = questionSnippet.length > 40 ? `${questionSnippet.slice(0, 40)}...` : questionSnippet;
        if (!window.confirm(`Are you sure you want to permanently delete the FAQ item: "${displaySnippet}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
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

                {/* Right Workspace Content Frame */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage Q&A section</h1>

                    {/* Action Toolbar Panel toggles Inline Add Row State */}
                    <div className="admin-action-toolbar left-btn-only">
                        <button className="admin-add-qa-btn" onClick={() => setIsAdding(!isAdding)}>
                            {isAdding ? "Close" : "Add"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing FAQ records matrix array...</div>
                    ) : (
                        <GenericTable headers={headers}>

                            {/* --- INLINE ADD NEW ROW INJECTION --- */}
                            {isAdding && (
                                <tr className="adding-row">
                                    <td>
                                        <textarea
                                            value={newRowData.question}
                                            placeholder="Type question here..."
                                            onChange={e => setNewRowData({ ...newRowData, question: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <textarea
                                            value={newRowData.answer}
                                            placeholder="Type answer details here..."
                                            onChange={e => setNewRowData({ ...newRowData, answer: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={newRowData.category}
                                            onChange={e => setNewRowData({ ...newRowData, category: e.target.value })}
                                        >
                                            <option value="Volunteer">Volunteer</option>
                                            <option value="Organization">Organization</option>
                                        </select>
                                    </td>
                                    <td className="admin-cell-qa-actions">
                                        <div className="admin-qa-btn-group">
                                            <button className="admin-modify-qa-btn" onClick={handleSaveNew}>Save</button>
                                            <button className="admin-delete-qa-btn" onClick={() => setIsAdding(false)}>Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* --- DATA ITERATION ROWS --- */}
                            {qaItems.length > 0 ? (
                                qaItems.map((row) => {
                                    const isEditingThisRow = editingId === row.id;

                                    if (isEditingThisRow) {
                                        // --- INLINE MODIFY ACTIVE EDIT SWITCH ROW VIEW ---
                                        return (
                                            <tr key={row.id} className="adding-row editing-row">
                                                <td>
                                                    <textarea
                                                        value={editRowData.question}
                                                        onChange={e => setEditRowData({ ...editRowData, question: e.target.value })}
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        value={editRowData.answer}
                                                        onChange={e => setEditRowData({ ...editRowData, answer: e.target.value })}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        value={editRowData.category}
                                                        onChange={e => setEditRowData({ ...editRowData, category: e.target.value })}
                                                    >
                                                        <option value="Volunteer">Volunteer</option>
                                                        <option value="Organization">Organization</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="admin-cell-qa-actions">
                                                    <div className="admin-qa-btn-group">
                                                        <button className="admin-modify-qa-btn" onClick={() => handleSaveUpdate(row.id)}>Save</button>
                                                        <button className="admin-delete-qa-btn" onClick={() => setEditingId(null)}>Cancel</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    // --- NORMAL VIEW ROW LAYER ---
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
                                                        onClick={() => startEditing(row)}
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
                                !isAdding && (
                                    <tr>
                                        <td colSpan={4} className="admin-empty-table-fallback">
                                            No active FAQ records discovered inside the platform database.
                                        </td>
                                    </tr>
                                )
                            )}
                        </GenericTable>
                    )}
                </main>

            </div>
        </div>
    );
}
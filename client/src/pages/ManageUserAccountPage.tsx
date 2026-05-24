import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import { AiOutlineSearch } from 'react-icons/ai';
import axios from 'axios';
import './manage_user_account_page.css';

interface UserAccount {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: {
        contact_number: string | null;
    } | null;
    organization?: {
        contact_number: string | null;
    } | null;
}

const API_BASE_URL = "http://localhost:3000";

export function ManageUserAccountPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get<UserAccount[]>(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // --- FIXED: Filter out admin records completely so they never show up ---
            const nonAdminUsers = response.data.filter(user => user.role !== 'admin');
            setUsers(nonAdminUsers);
        } catch (error) {
            console.error("Backend fetch failed, clearing table grid view:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: string, targetUsername: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete the user account for "${targetUsername}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("User account successfully removed.");
            fetchUsers();
        } catch (error) {
            console.error("Deletion error:", error);
            alert("Failed to complete account deletion process from server.");
        }
    };

    const handleAddUserRedirect = () => {
        navigate('/admin/create-user');
    };

    const filteredUsers = users.filter(acc =>
        (acc.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (acc.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const headers = ['Username', 'Email Address', 'Contact Number', 'Role', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

                {/* Left Navigation Sidebar */}
                <aside className="admin-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-user-account' || location.pathname === '/manage-users' ? 'active' : ''} onClick={() => navigate('/manage-user-account')}>
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

                {/* Right side main active tracking dashboard canvas container */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage user account</h1>

                    <div className="admin-action-toolbar">
                        <div className="admin-search-box-wrapper">
                            <input
                                type="text"
                                placeholder="Search by username"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                            <AiOutlineSearch className="admin-search-icon" />
                        </div>
                        <button className="admin-add-account-btn" onClick={handleAddUserRedirect}>
                            Add
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing records feed...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((row) => {
                                    const contactNumber = row.role === 'volunteer'
                                        ? row.volunteer?.contact_number
                                        : row.organization?.contact_number;

                                    const renderedRole = row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : 'N/A';

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-username">{row.username}</td>
                                            <td>{row.email}</td>
                                            <td>{contactNumber || 'N/A'}</td>
                                            <td>{renderedRole}</td>
                                            <td className="admin-cell-action">
                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() => handleDeleteUser(row.id, row.username)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="admin-empty-table-fallback">
                                        No active user accounts matched your search keyword criteria.
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
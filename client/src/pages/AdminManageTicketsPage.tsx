import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import { ChatWindow } from './ChatWindow';
import axios from 'axios';
import './admin_manage_tickets_page.css';

// --- UPDATED: Interface maps your database properties and nested entity relations perfectly ---
interface SupportTicket {
    id: string;
    content: string; // Matches your raw database column name 'content'
    status: string;
    submissionTime: string; // datetime template format string
    userId: string | null;
    user?: {
        id: string;
        username: string;
        role: 'volunteer' | 'organization' | 'admin' | string;
    } | null;
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageTicketsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Chat modal routing states
    const [activeChatTicket, setActiveChatTicket] = useState<SupportTicket | null>(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // --- FIXED: Connects directly to your live support ticket database index endpoint ---
            const response = await axios.get<SupportTicket[]>(`${API_BASE_URL}/interactions/support-ticket`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filters down rows to isolate active/open ticket profiles exclusively
            const activeTickets = Array.isArray(response.data)
                ? response.data.filter(t => t.status?.toLowerCase() === 'open')
                : [];

            setTickets(activeTickets);
        } catch (error) {
            console.error("Error downloading live administrative support logs:", error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleOpenSupportChat = (ticket: SupportTicket) => {
        setActiveChatTicket(ticket);
    };

    const headers = ['Description', 'User', 'Role', 'Submission Time', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

                {/* Left primary accent navigation menu column */}
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

                {/* Right data workspace sheet frame */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage support ticket</h1>

                    {location.pathname === '/manage-tickets' && loading ? (
                        <div className="admin-loading-placeholder">Compiling help desk queues...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {tickets.length > 0 ? (
                                tickets.map((row) => {
                                    // Extract nested profile credentials safely with crisp fallbacks
                                    const renderedUsername = row.user?.username || row.userId || 'Unknown User';

                                    const roleRaw = row.user?.role || 'User';
                                    const renderedRole = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);

                                    const formattedTime = row.submissionTime
                                        ? new Date(row.submissionTime).toLocaleString()
                                        : 'N/A';

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-ticket-description">{row.content}</td>
                                            <td className="admin-cell-ticket-user">{renderedUsername}</td>
                                            <td className="admin-cell-ticket-role">{renderedRole}</td>
                                            <td className="admin-cell-ticket-time">{formattedTime}</td>
                                            <td className="admin-cell-action">
                                                <button
                                                    className="admin-ticket-chat-btn"
                                                    onClick={() => handleOpenSupportChat(row)}
                                                >
                                                    Chat
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="admin-empty-table-fallback">
                                        No pending help desk or system support tickets discovered.
                                    </td>
                                </tr>
                            )}
                        </GenericTable>
                    )}
                </main>

            </div>

            {/* --- CORE INTEGRATION: LAUNCH SUPPORT CHAT INSTANTLY --- */}
            {activeChatTicket && (
                <ChatWindow
                    key={`ticket_chat_${activeChatTicket.id}`}
                    onClose={() => setActiveChatTicket(null)}
                    senderId={localStorage.getItem('userId') || "ADMIN_SYSTEM_ID"}
                    receiverId={activeChatTicket.user?.id || activeChatTicket.userId || ""}
                    receiverName={activeChatTicket.user?.username || "Help Desk Client"}
                />
            )}
        </div>
    );
}
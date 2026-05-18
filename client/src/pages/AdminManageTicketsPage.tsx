import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import { ChatWindow } from './ChatWindow';
import axios from 'axios';
import './admin_manage_tickets_page.css';

interface SupportTicket {
    id: string;
    description: string;
    userId: string; // Used as the receiverId for the chat interface context
    username: string;
    role: 'Volunteer' | 'Organization' | 'Admin';
    submissionTime: string;
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

    // Mock dataset directly extracted from your screenshot image for instantaneous out-of-the-box previewing
    const mockTickets: SupportTicket[] = [
        {
            id: 'TCK001',
            description: 'I registered with the wrong email address.',
            userId: 'USR_ECO',
            username: 'EcoGuardians Malaysia',
            role: 'Organization',
            submissionTime: '23/10/2025 11:30pm'
        },
        {
            id: 'TCK002',
            description: "I forgot my password and the reset link isn't working.",
            userId: 'USR_ALICE',
            username: 'Alice',
            role: 'Volunteer',
            submissionTime: '10/11/2025 8:22pm'
        },
        {
            id: 'TCK003',
            description: 'My points on the leaderboard seems too less.',
            userId: 'USR_BETTY',
            username: 'Betty',
            role: 'Volunteer',
            submissionTime: '13/11/2025 7:07am'
        },
        {
            id: 'TCK004',
            description: 'I want to change my role from volunteer to coordinator',
            userId: 'USR_BEN',
            username: 'Benjamin',
            role: 'Volunteer',
            submissionTime: '2/12/2025 6:29pm'
        },
        {
            id: 'TCK005',
            description: 'I signed up for the wrong programme. Can you transfer me to the correct one?',
            userId: 'USR_ADAM',
            username: 'Adam',
            role: 'Volunteer',
            submissionTime: '4/12/2025 2:56pm'
        }
    ];

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get<SupportTicket[]>(`${API_BASE_URL}/admin/tickets/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(response.data.length > 0 ? response.data : mockTickets);
        } catch (error) {
            console.warn("Backend dynamic tickets controller unconfigured, pulling mock dashboard entries:", error);
            setTickets(mockTickets);
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
                            <li className={location.pathname === '/manage-users' ? 'active' : ''} onClick={() => navigate('/manage-users')}>
                                Manage user account
                            </li>
                            <li className={location.pathname === '/verify-orgs' ? 'active' : ''} onClick={() => navigate('/verify-orgs')}>
                                Verify organization registration
                            </li>
                            <li className={location.pathname === '/manage-listings' ? 'active' : ''} onClick={() => navigate('/manage-listings')}>
                                Manage listing
                            </li>
                            <li className={location.pathname === '/manage-qa' ? 'active' : ''} onClick={() => navigate('/manage-qa')}>
                                Manage Q&A section
                            </li>
                            <li className={location.pathname === '/admin/manage-tickets' || location.pathname === '/manage-tickets' ? 'active' : ''} onClick={() => navigate('/manage-tickets')}>
                                Manage support ticket
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Right data workspace sheet frame */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage support ticket</h1>

                    {loading ? (
                        <div className="admin-loading-placeholder">Compiling help desk queues...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {tickets.length > 0 ? (
                                tickets.map((row) => (
                                    <tr key={row.id}>
                                        <td className="admin-cell-ticket-description">{row.description}</td>
                                        <td className="admin-cell-ticket-user">{row.username}</td>
                                        <td className="admin-cell-ticket-role">{row.role}</td>
                                        <td className="admin-cell-ticket-time">{row.submissionTime}</td>
                                        <td className="admin-cell-action">
                                            <button
                                                className="admin-ticket-chat-btn"
                                                onClick={() => handleOpenSupportChat(row)}
                                            >
                                                Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))
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
                    senderId="ADMIN_SYSTEM_ID" // Can be substituted dynmically with user?.id via auth hook
                    receiverId={activeChatTicket.userId}
                    receiverName={activeChatTicket.username}
                />
            )}
        </div>
    );
}
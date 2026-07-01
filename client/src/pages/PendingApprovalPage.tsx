import { useAuth } from '../context/auth/useAuth';
import { Header } from './Header';
import { useNavigate } from 'react-router';
import './pending_approval_page.css';

export function PendingApprovalPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <div className="pending-block-wrapper">
            <Header />
            <div className="pending-block-body">
                <div className="pending-card">
                    <div className="pending-icon-circle">⏳</div>
                    <h2>Account Approval Pending</h2>
                    <p className="pending-message">
                        Your application is pending. It should be done within 3 working days after you submit.
                    </p>
                    <p className="pending-subtext">
                        Thank you for your patience! You will receive full access to manage listings once our administrators verify your credentials.
                    </p>
                    <button className="pending-logout-btn" onClick={handleLogout}>
                        Log Out Safely
                    </button>
                </div>
            </div>
        </div>
    );
}
import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link } from 'react-router';
import { MdAccountCircle, MdNotifications } from 'react-icons/md';

export function Header() {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="header-container">
            <Link to={isAuthenticated ? '/volunteer-home' : '/'} className="header-logo">
                <h1>Volunteer Matching and Management System</h1>
            </Link>

            {isAuthenticated && (
                <div className="header-actions">
                    <div className="logged-in-nav">
                        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        <Link to="/qa" className="nav-link">Q&A</Link>

                        <div className="user-controls">
                            <span className="greeting">
                                Hi, {user?.name ? user.name : 'Volunteer'}!
                            </span>

                            <Link to="/manage-profile" className="profile-icon">
                                <MdAccountCircle size={35} color="white" />
                            </Link>
                            <button className="notif-icon">
                                <MdNotifications size={35} color="white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
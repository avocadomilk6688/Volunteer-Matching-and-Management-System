import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdNotifications } from 'react-icons/md';
import { useState } from 'react';

const API_BASE_URL = "http://localhost:3000";

interface ProfileRelation {
    profile_picture_url?: string;
}

interface AuthenticatedUser {
    id: string;
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: ProfileRelation;
    organization?: ProfileRelation;
}

export function Header() {
    const { user: rawUser, isAuthenticated, logout } = useAuth();
    const user = rawUser as AuthenticatedUser | null;

    const navigate = useNavigate();
    const [showProfileOptions, isShowProfileOptions] = useState(false);

    const handleLogout = () => {
        logout();
        isShowProfileOptions(false);
        navigate('/');
    };

    const role = user?.role;
    const isVolunteer = role === 'volunteer';
    const isOrganization = role === 'organization';
    const isAdmin = role === 'admin';

    const displayName = user?.username || (isAdmin ? 'Admin' : isOrganization ? 'Organization' : 'Volunteer');

    const getProfilePic = () => {
        const defaultPic = '/images/default_profile_pic.png';

        if (!user || isAdmin) return defaultPic;

        const picUrl = isVolunteer
            ? user.volunteer?.profile_picture_url
            : user.organization?.profile_picture_url;

        if (!picUrl) return defaultPic;

        if (picUrl.startsWith('http') || picUrl.startsWith('blob:')) {
            return picUrl;
        }

        const cleanPath = picUrl.startsWith('/') ? picUrl : `/${picUrl}`;
        return `${API_BASE_URL}${cleanPath}`;
    };

    const getLogoLink = () => {
        if (!isAuthenticated) return '/';
        if (isAdmin) return '/admin-dashboard';
        if (isOrganization) return '/manage-listing';
        return '/volunteer-home';
    };

    return (
        <div className="header-container">
            <Link to={getLogoLink()} className="header-logo">
                <h1>Volunteer Matching and Management System</h1>
            </Link>

            {isAuthenticated && (
                <div className="header-actions">
                    <div className="logged-in-nav">
                        {isVolunteer && (
                            <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        )}

                        {!isAdmin && (
                            <Link to="/qa" className="nav-link">Q&A</Link>
                        )}

                        <div className="user-controls">
                            <span className="greeting">Hi, {displayName}!</span>

                            <button className="profile-icon" onClick={() => isShowProfileOptions(!showProfileOptions)}>
                                <div
                                    className="profile-image-circle"
                                    style={{
                                        backgroundImage: `url("${getProfilePic()}")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                ></div>
                            </button>

                            <button className="notif-icon">
                                <MdNotifications size={24} color="white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileOptions && (
                <div className="profile-options">
                    {isVolunteer && (
                        <>
                            <Link to="/volunteering-history" className="view-volunteering-history" onClick={() => isShowProfileOptions(false)}>
                                View volunteering <br /> history
                            </Link>
                            <hr />
                        </>
                    )}
                    <Link to="/manage-profile" className="manage-profile" onClick={() => isShowProfileOptions(false)}>
                        Manage profile
                    </Link>
                    <hr />
                    <div className="log-out" onClick={handleLogout}>Log out</div>
                </div>
            )}
        </div>
    );
}
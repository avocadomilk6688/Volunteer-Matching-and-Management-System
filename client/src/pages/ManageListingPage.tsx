import { Header } from './Header';
import './manage_listing_page.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { GenericTable } from './Table';
import { useAuth } from '../context/auth/useAuth';

// --- Interfaces updated to match your exact JSON structure ---
interface Programme {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    organization?: {
        id: string;
    };
    related_skills: { id: string; skill_name: string }[]; // Updated key
    related_interests: { id: string; interest_name: string }[]; // Updated key
    schedule: {
        mode: string;
        location: string;
        start_time: string;
        end_time: string;
    };
}

export function ManageListingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [listings, setListings] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = ['Title', 'Description', 'Cover Image', 'Skills', 'Interests', 'Mode', 'Schedule', 'Action'];

    useEffect(() => {
        const fetchListings = async () => {
            const token = localStorage.getItem('token');

            if (!user?.id) return;

            try {
                setLoading(true);

                // --- FIX: Added ?limit=100 to bypass the backend's default pagination of 6 ---
                const response = await fetch('http://localhost:3000/programmes?limit=100', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch listings');
                }

                const data = await response.json();
                const allItems = data.items || [];

                // --- FRONTEND FILTER ---
                // Matches the logged-in organization ID (O002) against the item's organization ID
                const myItems = allItems.filter((item: Programme) => {
                    return item.organization?.id === user.id;
                });

                setListings(myItems);

            } catch (error) {
                console.error("Error fetching listings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [user?.id]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/programmes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setListings(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleModify = (id: string) => navigate(`/edit-listing/${id}`);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString([], {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="manage-listing-wrapper">
            <Header />
            <div className="manage-listing-container">
                <aside className="org-sidebar">
                    <nav>
                        <ul>
                            <li
                                className={location.pathname === '/manage-listing' ? 'active' : ''}
                                onClick={() => navigate('/manage-listing')}
                            >
                                Manage listing
                            </li>
                            <li
                                className={location.pathname === '/manage-applications' ? 'active' : ''}
                                onClick={() => navigate('/manage-applications')}
                            >
                                Manage volunteer application
                            </li>
                        </ul>
                    </nav>
                </aside>

                <main className="manage-listing-content">
                    <h1>Manage Listing</h1>
                    <button className="add-listing-btn" onClick={() => navigate('/add-listing')}>
                        Add
                    </button>

                    {loading ? (
                        <div className="loading-state">Loading your listings...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {listings.length > 0 ? (
                                listings.map((item) => (
                                    <tr key={item.id}>
                                        <td className="col-title">{item.title}</td>
                                        <td className="col-desc">{item.description}</td>
                                        <td className="col-img">
                                            <span className="img-link">{item.imageUrl || 'image.png'}</span>
                                        </td>
                                        <td>
                                            <div className="badge-stack">
                                                {item.related_skills?.map(skill => (
                                                    <span key={skill.id} className="orange-badge">
                                                        {skill.skill_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge-stack">
                                                {item.related_interests?.map(interest => (
                                                    <span key={interest.id} className="orange-badge">
                                                        {interest.interest_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>{item.schedule?.mode}</td>
                                        <td className="col-schedule">
                                            {formatDate(item.schedule?.start_time)}
                                        </td>

                                        <td className="col-action">
                                            <div className="action-buttons">
                                                <button className="modify-btn" onClick={() => handleModify(item.id)}>Modify</button>
                                                <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} style={{ textAlign: 'center', padding: '20px' }}>
                                        No listings found for your organization.
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
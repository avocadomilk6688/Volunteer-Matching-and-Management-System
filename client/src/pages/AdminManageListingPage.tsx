import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import { AiOutlineSearch } from 'react-icons/ai';
import axios from 'axios';
import './admin_manage_listing_page.css';

interface BackendProgramme {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    imageUrl?: string;
    organization?: {
        id: string;
        user?: {
            username: string;
        } | null;
    } | null;
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageListingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [listings, setListings] = useState<BackendProgramme[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_BASE_URL}/programmes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Defensive type checking to handle varied object wrapper payloads safely
            if (Array.isArray(response.data)) {
                setListings(response.data);
            } else if (response.data && typeof response.data === 'object' && 'programmes' in response.data && Array.isArray((response.data as Record<string, unknown>).programmes)) {
                setListings((response.data as { programmes: BackendProgramme[] }).programmes);
            } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray((response.data as Record<string, unknown>).data)) {
                setListings((response.data as { data: BackendProgramme[] }).data);
            } else {
                console.error("Received unexpected non-array format from backend:", response.data);
                setListings([]);
            }
        } catch (error) {
            console.error("Backend administration listings download failed:", error);
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleRemoveListing = async (id: string, targetTitle: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete and remove the listing "${targetTitle}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/programmes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Listing has been successfully removed.");
            fetchListings();
        } catch (error) {
            console.error("Removal failure on server endpoint context:", error);
            alert("Failed to drop program entity record row safely from system.");
        }
    };

    const activeListingsArray = Array.isArray(listings) ? listings : [];

    // --- FIXED: Updated to dynamically match search terms against program titles AND live organization usernames ---
    const filteredListings = activeListingsArray.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const orgUsername = item.organization?.user?.username || '';
        const orgMatch = orgUsername.toLowerCase().includes(searchTerm.toLowerCase());

        return titleMatch || orgMatch;
    });

    const headers = ['Title', 'Organization', 'Description', 'Cover Image', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

                {/* Left Side Sidebar Navigation Track */}
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

                {/* Right Central Workspace Canvas */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage listing</h1>

                    <div className="admin-action-toolbar text-left-only">
                        <div className="admin-search-box-wrapper">
                            <input
                                type="text"
                                placeholder="Search by title or organization"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                            <AiOutlineSearch className="admin-search-icon" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading-placeholder">Processing listing matrix arrays...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {filteredListings.length > 0 ? (
                                filteredListings.map((row) => {
                                    const activeImgUrl = row.image_url || row.imageUrl || '';
                                    const filenameDisplay = activeImgUrl.split('/').pop() || 'cover_image.png';
                                    const renderedOrgName = row.organization?.user?.username || 'N/A';

                                    return (
                                        <tr key={row.id}>
                                            <td className="admin-cell-listing-title">{row.title}</td>
                                            <td className="admin-cell-listing-org">{renderedOrgName}</td>
                                            <td className="admin-cell-listing-description">{row.description}</td>
                                            <td>
                                                {activeImgUrl ? (
                                                    <a
                                                        href={`${API_BASE_URL}${activeImgUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-image-filename-link"
                                                    >
                                                        {filenameDisplay}
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '13px' }}>No image uploaded</span>
                                                )}
                                            </td>
                                            <td className="admin-cell-action">
                                                <button
                                                    className="admin-remove-listing-btn"
                                                    onClick={() => handleRemoveListing(row.id, row.title)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="admin-empty-table-fallback">
                                        No active organization program listings matched your search criteria.
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
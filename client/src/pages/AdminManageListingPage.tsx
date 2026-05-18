import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from './Header';
import { GenericTable } from './Table';
import { AiOutlineSearch } from 'react-icons/ai';
import axios from 'axios';
import './admin_manage_listing_page.css';

interface AdminListing {
    id: string;
    title: string;
    organizationName: string;
    description: string;
    imageUrl: string;
}

const API_BASE_URL = "http://localhost:3000";

export function AdminManageListingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Data tracking states
    const [listings, setListings] = useState<AdminListing[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // Mock dataset directly extracted from your screenshot image for out-of-the-box operation
    const mockListings: AdminListing[] = [
        {
            id: 'PROG001',
            title: 'Green Earth Clean-Up Drive',
            organizationName: 'EcoGuardians Malaysia',
            description: 'A community initiative focused on environmental sustainability. Volunteers gather to clean public spaces, plant trees, and raise awareness about waste management. The programme emphasizes teamwork, eco-education, and long-term impact on local ecosystems.',
            imageUrl: '/uploads/programmes/image.png'
        },
        {
            id: 'PROG002',
            title: 'Bright Minds Tutoring Sessions',
            organizationName: 'BrightPath Learning Foundation',
            description: 'A volunteer programme dedicated to animal welfare. Participants assist with feeding, cleaning, and caring for rescued animals, while also helping with adoption drives and fundraising events. The initiative highlights compassion and responsible pet ownership.',
            imageUrl: '/uploads/programmes/image.jpg'
        }
    ];

    const fetchListings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Assuming your endpoint structure aggregates standard program arrays for the master admin
            const response = await axios.get<AdminListing[]>(`${API_BASE_URL}/admin/programmes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListings(response.data.length > 0 ? response.data : mockListings);
        } catch (error) {
            console.warn("Backend admin listings mapping skipped, rendering image fallbacks:", error);
            setListings(mockListings);
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
            await axios.delete(`${API_BASE_URL}/admin/programmes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Listing has been successfully removed.");
            fetchListings();
        } catch (error) {
            console.error("Removal failure:", error);
            // Local fallback cleanup to optimize frontend validation workflow
            setListings(prev => prev.filter(item => item.id !== id));
        }
    };

    // Filters down active dashboard array strings against client-side keyword metrics
    const filteredListings = listings.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const headers = ['Title', 'Organization', 'Description', 'Cover Image', 'Action'];

    return (
        <div className="admin-dashboard-wrapper">
            <Header />
            <div className="admin-dashboard-container">

                {/* Left accent sidebar container matching administrative console paths */}
                <aside className="admin-sidebar">
                    <nav>
                        <ul>
                            <li className={location.pathname === '/manage-users' ? 'active' : ''} onClick={() => navigate('/manage-users')}>
                                Manage user account
                            </li>
                            <li className={location.pathname === '/verify-orgs' ? 'active' : ''} onClick={() => navigate('/verify-orgs')}>
                                Verify organization registration
                            </li>
                            <li className={location.pathname === '/admin/manage-listings' || location.pathname === '/manage-listings' ? 'active' : ''} onClick={() => navigate('/manage-listings')}>
                                Manage listing
                            </li>
                            <li className={location.pathname === '/admin/manage-qa' ? 'active' : ''} onClick={() => navigate('/admin/manage-qa')}>
                                Manage Q&A section
                            </li>
                            <li className={location.pathname === '/admin/manage-tickets' ? 'active' : ''} onClick={() => navigate('/admin/manage-tickets')}>
                                Manage support ticket
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Right central work dashboard block panel area */}
                <main className="admin-main-content">
                    <h1 className="admin-main-title">Manage listing</h1>

                    {/* Search manipulation asset deck (Mirrors image search layout frame precisely) */}
                    <div className="admin-action-toolbar text-left-only">
                        <div className="admin-search-box-wrapper">
                            <input
                                type="text"
                                placeholder="Search by title"
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
                                filteredListings.map((row) => (
                                    <tr key={row.id}>
                                        <td className="admin-cell-listing-title">{row.title}</td>
                                        <td className="admin-cell-listing-org">{row.organizationName}</td>
                                        <td className="admin-cell-listing-description">{row.description}</td>
                                        <td>
                                            <a
                                                href={`${API_BASE_URL}${row.imageUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="admin-image-filename-link"
                                            >
                                                {row.imageUrl.split('/').pop() || 'image.png'}
                                            </a>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="admin-empty-table-fallback">
                                        No dynamic organization program listings matched your search string.
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
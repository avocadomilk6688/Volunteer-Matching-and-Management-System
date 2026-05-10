import { Header } from './Header';
import './manage_listing_page.css';
import { useState, useEffect } from 'react';
import { GenericTable } from './Table';

// --- Interfaces ---

interface ProgrammeListing {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    skills: string[];
    interests: string[];
    mode: string;
    schedule: string;
}

export function ManageListingPage() {
    const [listings, setListings] = useState<ProgrammeListing[]>([]);
    const [loading, setLoading] = useState(true);

    // UPDATED: Added 'Action' to headers
    const headers = ['Title', 'Description', 'Cover Image', 'Skills', 'Interests', 'Mode', 'Schedule', 'Action'];

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                const mockData: ProgrammeListing[] = [
                    {
                        id: 'P001',
                        title: 'River Revival Project',
                        description: 'Volunteers work together to restore polluted rivers by organizing clean-up drives, installing eco-friendly waste bins, and conducting awareness campaigns in local communities.',
                        coverImage: 'image.png',
                        skills: ['Teamwork', 'Waste management', 'Event Coordination'],
                        interests: ['Sustainability', 'Community Services'],
                        mode: 'Physical',
                        schedule: '20/11/2025 9:00am'
                    },
                    {
                        id: 'P002',
                        title: 'Urban Green Spaces Initiative',
                        description: 'Volunteers help transform unused urban areas into community gardens and mini-parks. Activities include planting trees, setting up benches, and creating educational signboards.',
                        coverImage: 'image.jpg',
                        skills: ['Gardening', 'Creative', 'Communication'],
                        interests: ['Sustainability'],
                        mode: 'Physical',
                        schedule: '18/11/2025 9:00am'
                    }
                ];

                setTimeout(() => {
                    setListings(mockData);
                    setLoading(false);
                }, 500);

            } catch (error) {
                console.error("Error fetching listings:", error);
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    // Placeholder handlers for later
    const handleModify = (id: string) => console.log('Modify:', id);
    const handleDelete = (id: string) => console.log('Delete:', id);

    return (
        <div className="manage-listing-wrapper">
            <Header />
            <div className="manage-listing-container">
                <aside className="org-sidebar">
                    <nav>
                        <ul>
                            <li className="active">Manage listing</li>
                            <li>Manage volunteer application</li>
                        </ul>
                    </nav>
                </aside>

                <main className="manage-listing-content">
                    <h1>Manage Listing</h1>
                    <button className="add-listing-btn">Add</button>

                    {loading ? (
                        <div className="loading-state">Loading your listings...</div>
                    ) : (
                        <GenericTable headers={headers}>
                            {listings.map((item) => (
                                <tr key={item.id}>
                                    <td className="col-title">{item.title}</td>
                                    <td className="col-desc">{item.description}</td>
                                    <td className="col-img">
                                        <span className="img-link">{item.coverImage}</span>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {item.skills.map(skill => (
                                                <span key={skill} className="orange-badge">{skill}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="badge-stack">
                                            {item.interests.map(interest => (
                                                <span key={interest} className="orange-badge">{interest}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{item.mode}</td>
                                    <td className="col-schedule">{item.schedule}</td>

                                    {/* NEW: Action Column */}
                                    <td className="col-action">
                                        <div className="action-buttons">
                                            <button
                                                className="modify-btn"
                                                onClick={() => handleModify(item.id)}
                                            >
                                                Modify
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </GenericTable>
                    )}
                </main>
            </div>
        </div>
    );
}
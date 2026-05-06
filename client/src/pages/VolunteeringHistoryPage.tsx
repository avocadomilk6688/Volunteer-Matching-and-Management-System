import { useState, useEffect } from 'react';
import { Header } from './Header';
import { GenericTable } from './Table';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import './volunteering_history_page.css';

interface HistoryItem {
    id: string;
    programme: string;
    org: string;
    schedule: string;
    hours: string;
    status: string;
}

interface VolunteerStats {
    rating: number;
    totalHours: number;
    history: HistoryItem[];
}

export function VolunteeringHistoryPage() {
    const { user } = useAuth();
    const [data, setData] = useState<VolunteerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setError("Authentication required. Please log in.");
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await axios.get<VolunteerStats>(
                    `http://localhost:3000/volunteers/${user.id}/history`
                );
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching history:", err);
                setError("Failed to load your volunteering history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?.id]);

    const headers = ["Programme", "Organization", "Schedule", "Completed Hours", "Status"];

    // --- FILTER LOGIC ---
    // We create a filtered list that excludes anything with the 'pending' status
    const filteredHistory = data?.history?.filter(
        (item) => item.status.toLowerCase() !== 'pending'
    ) || [];

    if (loading) return <div className="loading-state">Loading your journey...</div>;

    if (error) return (
        <div className="history-wrapper">
            <Header />
            <div className="error-container">
                <p className="error-message">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="history-wrapper">
            <Header />
            <div className="history-content">
                <h1 className="history-title">Volunteering History</h1>

                <div className="history-stats">
                    <p>Total hours contributed: {data?.totalHours || 0}h</p>
                    <p>
                        Rating: <span className="star">★</span> {data?.rating.toFixed(1) || "0.0"}
                    </p>
                </div>

                <GenericTable headers={headers}>
                    {/* Use filteredHistory instead of data.history */}
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((row) => (
                            <tr key={row.id}>
                                <td>{row.programme}</td>
                                <td>{row.org}</td>
                                <td>
                                    <span className="pill schedule-pill">{row.schedule}</span>
                                </td>
                                <td>{row.hours}</td>
                                <td>
                                    <span className={`pill status-pill ${row.status.toLowerCase()}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="empty-history">
                                No volunteering records found yet.
                            </td>
                        </tr>
                    )}
                </GenericTable>
            </div>
        </div>
    );
}
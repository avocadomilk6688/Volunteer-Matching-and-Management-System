import { useState, useEffect } from 'react';
import { Header } from './Header';
import { GenericTable } from './Table';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import './volunteering_history_page.css';

// --- Explicit, Linter-Compliant Type Contracts ---
interface UserEntity {
    username: string;
    email: string;
}

interface OrganizationEntity {
    id: string;
    description: string;
    rating: number;
    user?: UserEntity;
}

interface ScheduleEntity {
    id: string;
    mode: string;
    location: string;
    start_time: string;
    end_time: string;
}

interface ProgrammeEntity {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    organization?: OrganizationEntity;
    schedule?: ScheduleEntity;
}

interface HistoryItem {
    id: string;
    status: string;
    applied_at: string;
    programme?: ProgrammeEntity;
    hours?: number | string;
}

interface VolunteerStats {
    rating: number;
    totalHours: number;
    history: HistoryItem[];
}

const API_BASE_URL = "http://localhost:3000";

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
                const token = localStorage.getItem('token');

                const response = await axios.get<VolunteerStats>(
                    `${API_BASE_URL}/volunteers/${user.id}/history`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
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

    // Case-insensitive filtering matching only 'upcoming' and 'completed' statuses
    const filteredHistory = (data?.history || []).filter((item) => {
        if (!item.status) return false;
        const statusLower = item.status.toLowerCase();
        return statusLower === 'upcoming' || statusLower === 'completed';
    });

    const formatStatus = (statusStr: string): string => {
        return statusStr ? statusStr.toUpperCase() : 'UNKNOWN';
    };

    // --- RECONFIGURED RANGE-BASED SCHEDULE PARSER ---
    const getScheduleInfo = (item: HistoryItem): string => {
        const schedule = item.programme?.schedule;
        if (!schedule || !schedule.start_time) return 'N/A';

        try {
            const startDate = new Date(schedule.start_time);
            if (isNaN(startDate.getTime())) return schedule.start_time;

            const timeOptions: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            };

            const dateLabelOptions: Intl.DateTimeFormatOptions = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            };

            const fullDateTimeOptions: Intl.DateTimeFormatOptions = {
                ...dateLabelOptions,
                ...timeOptions
            };

            if (schedule.end_time) {
                const endDate = new Date(schedule.end_time);
                if (!isNaN(endDate.getTime())) {
                    // If the project starts and ends on the same calendar day, compress the string
                    if (startDate.toDateString() === endDate.toDateString()) {
                        const dateStr = startDate.toLocaleDateString('en-GB', dateLabelOptions);
                        const startTimeStr = startDate.toLocaleTimeString('en-GB', timeOptions);
                        const endTimeStr = endDate.toLocaleTimeString('en-GB', timeOptions);
                        return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
                    } else {
                        // Display separate timestamps side-by-side if the project spans over multiple days
                        const startStr = startDate.toLocaleString('en-GB', fullDateTimeOptions);
                        const endStr = endDate.toLocaleString('en-GB', fullDateTimeOptions);
                        return `${startStr} - ${endStr}`;
                    }
                }
            }

            // Fallback for single date items missing an explicit end timestamp
            return startDate.toLocaleString('en-GB', fullDateTimeOptions);
        } catch {
            return schedule.start_time;
        }
    };

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
                        Rating: <span className="star">★</span> {data?.rating ? data.rating.toFixed(1) : "0.0"}
                    </p>
                </div>

                <GenericTable headers={headers}>
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((row) => (
                            <tr key={row.id}>
                                <td>{row.programme?.title || 'General Activity'}</td>
                                <td>{row.programme?.organization?.user?.username || 'Independent'}</td>
                                <td>
                                    <span className="pill schedule-pill">
                                        {getScheduleInfo(row)}
                                    </span>
                                </td>
                                <td>{row.hours ?? 0}h</td>
                                <td>
                                    <span className={`pill status-pill ${row.status ? row.status.toLowerCase() : 'unknown'}`}>
                                        {formatStatus(row.status)}
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
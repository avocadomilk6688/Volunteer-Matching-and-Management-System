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

    // ─── RUNTIME CALCULATIONS FOR DYNAMIC RENDERING FALLBACKS ───

    /**
     * Determines if the current date/time has passed the program's scheduled end time.
     */
    const isProgramTimePassed = (item: HistoryItem): boolean => {
        const endTime = item.programme?.schedule?.end_time;
        if (!endTime) return false;
        return new Date() > new Date(endTime);
    };

    /**
     * Overrides and calculates total accrued credit hours directly from timestamps
     * if the database field returns empty/zero for a concluded timeline.
     */
    const getDisplayHours = (item: HistoryItem): number => {
        if (item.hours && Number(item.hours) > 0) {
            return Number(item.hours);
        }

        if (isProgramTimePassed(item) && item.programme?.schedule) {
            const start = new Date(item.programme.schedule.start_time).getTime();
            const end = new Date(item.programme.schedule.end_time).getTime();
            if (!isNaN(start) && !isNaN(end)) {
                return Math.max(0, Math.round((end - start) / (1000 * 60 * 60)));
            }
        }

        return 0;
    };

    /**
     * Forces status evaluation to 'COMPLETED' if the program timeline is over,
     * overriding stale database layout flags.
     */
    const getDisplayStatus = (item: HistoryItem): string => {
        if (!item.status) return 'UNKNOWN';
        if (item.status.toLowerCase() === 'upcoming' && isProgramTimePassed(item)) {
            return 'COMPLETED';
        }
        return item.status.toUpperCase();
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

    // Calculate total hours contribution dynamically across all visible records
    const dynamicTotalHours = filteredHistory.reduce((accumulator, currentRow) => {
        return accumulator + getDisplayHours(currentRow);
    }, 0);

    return (
        <div className="history-wrapper">
            <Header />
            <div className="history-content">
                <h1 className="history-title">Volunteering History</h1>

                {/* ─── DYNAMICALLY AGGREGATED RUNTIME SUMMATION STATS ─── */}
                <div className="history-stats">
                    <p>Total hours contributed: {dynamicTotalHours}h</p>
                    <p>
                        Rating: <span className="star">★</span> {data?.rating ? data.rating.toFixed(1) : "0.0"}
                    </p>
                </div>

                <GenericTable headers={headers}>
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((row) => {
                            const calculatedStatus = getDisplayStatus(row);
                            return (
                                <tr key={row.id}>
                                    <td>{row.programme?.title || 'General Activity'}</td>
                                    <td>{row.programme?.organization?.user?.username || 'Independent'}</td>
                                    <td>
                                        <span className="pill schedule-pill">
                                            {getScheduleInfo(row)}
                                        </span>
                                    </td>
                                    <td>{getDisplayHours(row)}h</td>
                                    <td>
                                        <span className={`pill status-pill ${calculatedStatus.toLowerCase()}`}>
                                            {calculatedStatus}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
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
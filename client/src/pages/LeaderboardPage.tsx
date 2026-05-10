import { Header } from './Header';
import './leaderboard_page.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

// Interfaces for the Backend Snapshot Data
interface MonthlyPointResponse {
    points: number;
    volunteer: {
        id: string;
        profile_picture_url: string;
        user: {
            username: string;
        };
    };
}

interface VolunteerRank {
    id: string;
    points: number;
    profile_picture_url: string;
    user: {
        username: string;
    };
}

export function LeaderboardPage() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const navigate = useNavigate();

    const [volunteers, setVolunteers] = useState<VolunteerRank[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [loading, setLoading] = useState(true);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await axios.get<MonthlyPointResponse[]>(
                    `http://localhost:3000/volunteers/leaderboard`,
                    { params: { month: selectedMonth, year: currentYear } }
                );

                // Mapping snapshot data back to your preferred UI structure
                const formattedData = response.data.map((record: MonthlyPointResponse) => ({
                    id: record.volunteer.id,
                    points: Math.round(record.points),
                    profile_picture_url: record.volunteer.profile_picture_url,
                    user: record.volunteer.user
                }));

                setVolunteers(formattedData);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [selectedMonth, currentYear]);

    const first = volunteers[0];
    const second = volunteers[1];
    const third = volunteers[2];
    const remaining = volunteers.slice(3);

    return (
        <div className="leaderboard-wrapper">
            <Header />
            <div className="leaderboard-content">

                {/* Header structure adjusted for side-by-side layout */}
                <div className="leaderboard-header">
                    <h1>{months[selectedMonth - 1]} {currentYear}</h1>
                    <select
                        className="month-selector"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                        {months.map((name, index) => (
                            <option key={name} value={index + 1}>{name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="loading-state">Loading Leaderboard...</div>
                ) : volunteers.length > 0 ? (
                    <>
                        <div className="podium-container">
                            {/* 2nd Place - Reverted to rank-box */}
                            <div className={`podium-item second ${!second ? 'hidden' : ''}`}>
                                <div
                                    className="avatar-circle"
                                    style={{ backgroundImage: `url(${second?.profile_picture_url})`, backgroundSize: 'cover' }}
                                ></div>
                                <div className="podium-info">
                                    <span className="name">{second?.user.username || '---'}</span>
                                    <span className="score">{second?.points || 0} pts</span>
                                </div>
                                <div className="rank-box">2</div>
                            </div>

                            {/* 1st Place - Reverted to rank-box */}
                            <div className={`podium-item first ${!first ? 'hidden' : ''}`}>
                                <div
                                    className="avatar-circle"
                                    style={{ backgroundImage: `url(${first?.profile_picture_url})`, backgroundSize: 'cover' }}
                                ></div>
                                <div className="podium-info">
                                    <span className="name">{first?.user.username || '---'}</span>
                                    <span className="score">{first?.points || 0} pts</span>
                                </div>
                                <div className="rank-box">1</div>
                            </div>

                            {/* 3rd Place - Reverted to rank-box */}
                            <div className={`podium-item third ${!third ? 'hidden' : ''}`}>
                                <div
                                    className="avatar-circle"
                                    style={{ backgroundImage: `url(${third?.profile_picture_url})`, backgroundSize: 'cover' }}
                                ></div>
                                <div className="podium-info">
                                    <span className="name">{third?.user.username || '---'}</span>
                                    <span className="score">{third?.points || 0} pts</span>
                                </div>
                                <div className="rank-box">3</div>
                            </div>
                        </div>

                        <div className="leaderboard-list">
                            {remaining.length > 0 ? (
                                remaining.map((item, index) => (
                                    <div key={item.id} className="list-row">
                                        <span className="list-rank">{index + 4}th</span>
                                        <div
                                            className="list-avatar"
                                            style={{ backgroundImage: `url(${item.profile_picture_url})`, backgroundSize: 'cover' }}
                                        ></div>
                                        <span className="list-name">{item.user.username}</span>
                                        <span className="list-score">{item.points}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data">No more ranked volunteers.</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-leaderboard">
                        <p>No activity recorded for {months[selectedMonth - 1]}.</p>
                        <button className="cta-button" onClick={() => navigate('/volunteer-home')}>
                            Find a Programme
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
import { Header } from './Header';
import './leaderboard_page.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface VolunteerRank {
    id: string;
    points: number;
    profile_picture_url: string;
    user: {
        username: string;
    };
}

export function LeaderboardPage() {
    const [volunteers, setVolunteers] = useState<VolunteerRank[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                // Ensure this matches your NestJS route
                const response = await axios.get<VolunteerRank[]>('http://localhost:3000/volunteers/leaderboard');
                setVolunteers(response.data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="leaderboard-wrapper">
                <Header />
                <div className="loading-state">Loading Leaderboard...</div>
            </div>
        );
    }

    // Top 3 for the Podium
    const first = volunteers[0];
    const second = volunteers[1];
    const third = volunteers[2];

    // 4th Place onwards for the List
    const remaining = volunteers.slice(3);

    return (
        <div className="leaderboard-wrapper">
            <Header />
            <div className="leaderboard-content">
                <div className="leaderboard-header">
                    <h1>Leaderboard - April 2026</h1>
                    <select className="month-selector" id="month">
                        <option value="4">April</option>
                        {/* Static for now since monthly points aren't implemented */}
                    </select>
                </div>

                <div className="podium-container">
                    {/* 2nd Place */}
                    <div className={`podium-item second ${!second ? 'hidden' : ''}`}>
                        <div 
                            className="avatar-circle" 
                            style={{ backgroundImage: `url(${second?.profile_picture_url})`, backgroundSize: 'cover' }}
                        ></div>
                        <div className="podium-info">
                            <span className="name">{second?.user.username || '---'}</span>
                            <span className="score">{second?.points || 0}</span>
                        </div>
                        <div className="rank-box">2</div>
                    </div>

                    {/* 1st Place */}
                    <div className={`podium-item first ${!first ? 'hidden' : ''}`}>
                        <div 
                            className="avatar-circle" 
                            style={{ backgroundImage: `url(${first?.profile_picture_url})`, backgroundSize: 'cover' }}
                        ></div>
                        <div className="podium-info">
                            <span className="name">{first?.user.username || '---'}</span>
                            <span className="score">{first?.points || 0}</span>
                        </div>
                        <div className="rank-box">1</div>
                    </div>

                    {/* 3rd Place */}
                    <div className={`podium-item third ${!third ? 'hidden' : ''}`}>
                        <div 
                            className="avatar-circle" 
                            style={{ backgroundImage: `url(${third?.profile_picture_url})`, backgroundSize: 'cover' }}
                        ></div>
                        <div className="podium-info">
                            <span className="name">{third?.user.username || '---'}</span>
                            <span className="score">{third?.points || 0}</span>
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
            </div>
        </div>
    );
}
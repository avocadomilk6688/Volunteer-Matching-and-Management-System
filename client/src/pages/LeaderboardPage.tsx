import { Header } from './Header';
import './leaderboard_page.css';

export function LeaderboardPage() {
    const leaderboardData = [
        { rank: "4th", name: "Maria", score: 160 },
        { rank: "5th", name: "Kevin", score: 155 },
        { rank: "6th", name: "Angelina", score: 150 },
        { rank: "7th", name: "Sammy", score: 130 },
        { rank: "8th", name: "Patrick", score: 90 },
        { rank: "9th", name: "Albert", score: 75 },
        { rank: "10th", name: "Lisa", score: 45 },
    ];

    return (
        <div className="leaderboard-wrapper">
            <Header />
            <div className="leaderboard-content">
                <div className="leaderboard-header">
                    <h1>Leaderboard - January 2026</h1>
                    <select className="month-selector" id="month">
                        <option value="month">Month</option>
                        <option value="january">January</option>
                        <option value="february">February</option>
                        <option value="march">March</option>
                        <option value="april">April</option>
                        <option value="may">May</option>
                        <option value="june">June</option>
                        <option value="july">July</option>
                        <option value="august">August</option>
                        <option value="september">September</option>
                        <option value="october">October</option>
                        <option value="november">November</option>
                        <option value="december">December</option>
                    </select>
                </div>

                <div className="podium-container">
                    {/* 2nd Place */}
                    <div className="podium-item second">
                        <div className="avatar-circle"></div>
                        <div className="podium-info">
                            <span className="name">Lydia</span>
                            <span className="score">200</span>
                        </div>
                        <div className="rank-box">2</div>
                    </div>

                    {/* 1st Place */}
                    <div className="podium-item first">
                        <div className="avatar-circle"></div>
                        <div className="podium-info">
                            <span className="name">Maggie</span>
                            <span className="score">225</span>
                        </div>
                        <div className="rank-box">1</div>
                    </div>

                    {/* 3rd Place */}
                    <div className="podium-item third">
                        <div className="avatar-circle"></div>
                        <div className="podium-info">
                            <span className="name">John</span>
                            <span className="score">175</span>
                        </div>
                        <div className="rank-box">3</div>
                    </div>
                </div>

                <div className="leaderboard-list">
                    {leaderboardData.map((item, index) => (
                        <div key={index} className="list-row">
                            <span className="list-rank">{item.rank}</span>
                            <div className="list-avatar"></div>
                            <span className="list-name">{item.name}</span>
                            <span className="list-score">{item.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
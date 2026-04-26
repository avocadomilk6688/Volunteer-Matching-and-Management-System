import { Header } from './Header';
import { GenericTable } from './Table';
import './volunteering_history_page.css';

export function VolunteeringHistoryPage() {
    const historyData = [
        {
            id: 1,
            programme: "Green Earth Clean-Up Drive",
            org: "EcoGuardians Malaysia",
            schedule: "20/11/2025 9:00am - 11:00am",
            hours: "-",
            status: "Upcoming"
        },
        {
            id: 2,
            programme: "Bright Minds Tutoring Sessions",
            org: "BrightPath Learning Foundation",
            schedule: "4/10/2025 9:00am - 2:00pm",
            hours: "5h",
            status: "Completed"
        },
        {
            id: 3,
            programme: "Paws & Care Animal Shelter Support",
            org: "Silver Horizons Cultural Centre",
            schedule: "1/9/2025 1:00pm - 4:00pm",
            hours: "3h",
            status: "Completed"
        }
    ];

    const headers = ["Programme", "Organization", "Schedule", "Completed Hours", "Status"];

    return (
        <div className="history-wrapper">
            <Header />
            <div className="history-content">
                <h1 className="history-title">Volunteering History</h1>

                <div className="history-stats">
                    <p>Total hours contributed: 8h</p>
                    <p>Rating: <span className="star">★</span> 5.0</p>
                </div>

                <GenericTable headers={headers}>
                    {historyData.map((row) => (
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
                    ))}
                </GenericTable>
            </div>
        </div>
    );
}
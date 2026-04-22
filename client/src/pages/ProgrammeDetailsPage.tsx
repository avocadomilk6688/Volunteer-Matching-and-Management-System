import { AiFillStar, AiOutlineStar, AiOutlineFlag } from 'react-icons/ai'
import { Header } from './Header'
import './programme_details_page.css'

export function ProgrammeDetailsPage() {
    return (
        <div className="sign-up-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="programme-details">
                    <div className="programme-image"></div>
                    <div className="header-row">
                        <div className="programme-name">Green Earth Clean-Up Drive</div>
                        <div className="tool-bar">
                            <button className="chat-button">Chat</button>
                            <button className="join-button">Join</button>
                            <AiOutlineStar className="save-button"></AiOutlineStar>
                            <AiOutlineFlag className="report-button"></AiOutlineFlag>
                        </div>
                    </div>
                    <div className="organization-details">
                        <div className="organization-profile-pic"></div>
                        <div className="organization-name">EcoGuardians Malaysia</div>
                        <div className="organization-rating">
                            <AiFillStar className="star-icon" />
                            <p className="organization-rating-text">4.9</p>
                        </div>
                    </div>
                    <div className="metadata">
                        <div className="skills">
                            Skills:
                            <div className="skill">Teamwork</div>
                            <div className="skill">Waste management</div>
                            <div className="skill">Event coordination</div>
                        </div>
                        <div className="interests">
                            Interests:
                            <div className="interest">Sustainability</div>
                            <div className="interest">Community service</div>
                        </div>
                    </div>
                    <div className="programme-logistics">
                        <p>Mode: Physical</p>
                        <p>Schedule: 20/11/2025 9:00am - 11:00am</p>
                        <p>Location: Pantai Kelanang, Selangor</p>
                    </div>
                    <div className="programme-description">
                        <h2>Programme Description</h2>
                        <p>The Green Earth Clean‑Up Drive is a community‑based initiative aimed at promoting environmental responsibility and sustainable living. Volunteers work together to collect litter from parks, riversides, and residential areas while raising awareness about recycling and proper waste management. The programme not only improves the cleanliness of shared spaces but also fosters teamwork, civic pride, and a stronger connection to nature. Participants gain practical skills in organizing eco‑friendly activities and inspire others to adopt greener habits for a healthier planet.</p>
                    </div>
                    <div className="organization-description">
                        <h2>Organization Description</h2>
                        <p>EcoGuardians Malaysia is a non‑profit community organization dedicated to promoting environmental sustainability and civic responsibility. Established to empower local residents, the group organizes clean‑up drives, recycling campaigns, and educational workshops that encourage greener habits. By fostering collaboration between volunteers, schools, and local councils, EcoGuardians Malaysia aims to create healthier public spaces and inspire long‑term environmental stewardship. The organization values teamwork, awareness, and practical action, making it a trusted partner in community‑based eco initiatives.
                            Address: Lot 12, Jalan Hijau Indah, Taman Bukit Ampang, 68000 Ampang, Selangor
                            Contact number: 03-12345678
                            Email address: contact@ecoguardians.my</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
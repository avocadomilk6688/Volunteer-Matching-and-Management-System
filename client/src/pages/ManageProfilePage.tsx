import { useState } from 'react';
import { Header } from './Header';
import './manage_profile.css';

export function ManageProfilePage() {
    // Hardcoded initial data
    const [skills] = useState(['Gardening', 'Creative', 'Communication']);
    const [interests] = useState(['Animal Welfare', 'Sustainability']);

    return (
        <div className="profile-wrapper">
            <Header />
            <div className="profile-content">
                <h1 className="profile-title">Manage Profile</h1>

                {/* Avatar Section */}
                <div className="avatar-section">
                    <div className="avatar-large"></div>
                    <button className="secondary-btn">Change profile picture</button>
                </div>

                {/* Form Grid */}
                <div className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name:</label>
                            <input type="text" defaultValue="Volunteer 1" />
                        </div>
                        <div className="form-group small">
                            <label>Gender:</label>
                            <select defaultValue="Female">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Contact number:</label>
                            <input type="text" defaultValue="012-3456789" />
                        </div>
                        <div className="form-group small">
                            <label>Location:</label>
                            <select defaultValue="Selangor">
                                <option value="Selangor">Selangor</option>
                                <option value="Kuala Lumpur">Kuala Lumpur</option>
                                <option value="Melaka">Melaka</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags Sections */}
                    <div className="tags-section">
                        <label>Skills:</label>
                        <div className="tags-container">
                            {skills.map(skill => (
                                <span key={skill} className="tag-pill">
                                    {skill} <span className="remove-tag">x</span>
                                </span>
                            ))}
                            <button className="add-tag-btn">+</button>
                        </div>
                    </div>

                    <div className="tags-section">
                        <label>Interests:</label>
                        <div className="tags-container">
                            {interests.map(interest => (
                                <span key={interest} className="tag-pill">
                                    {interest} <span className="remove-tag">x</span>
                                </span>
                            ))}
                            <button className="add-tag-btn">+</button>
                        </div>
                    </div>

                    {/* Resume Section */}
                    <div className="resume-section">
                        <label>Resume:</label>
                        <div className="resume-actions">
                            <a href="#" className="resume-link">resume.pdf</a>
                            <button className="secondary-btn">Upload resume</button>
                        </div>
                    </div>

                    <button className="save-changes-btn">Save Changes</button>
                </div>
            </div>
        </div>
    );
}
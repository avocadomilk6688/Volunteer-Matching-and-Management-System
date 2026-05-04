import { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import './manage_profile.css';

// --- Constants ---
const API_BASE_URL = "http://localhost:3000";

// --- Interfaces ---
interface TagItem { id: string; name: string; }
interface SkillEntity { id: string; skill_name: string; }
interface InterestEntity { id: string; interest_name: string; }
interface UserEntity { id: string; username: string; }

interface VolunteerProfileResponse {
    id: string;
    gender: string | null;
    location: string | null;
    contact_number: string | null;
    profile_picture_url: string | null;
    resume_url: string | null;
    user: UserEntity;
    skills: SkillEntity[];
    interests: InterestEntity[];
}

export function ManageProfilePage() {
    const { user } = useAuth();

    // Form State
    const [username, setUsername] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [contact, setContact] = useState<string>('');
    const [location, setLocation] = useState<string>('');

    // File State
    const [profilePicUrl, setProfilePicUrl] = useState<string>('');
    const [resumeUrl, setResumeUrl] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedResume, setSelectedResume] = useState<File | null>(null);

    // Refs for hidden file inputs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    // Tag Selection State
    const [mySkills, setMySkills] = useState<TagItem[]>([]);
    const [myInterests, setMyInterests] = useState<TagItem[]>([]);
    const [allSkills, setAllSkills] = useState<TagItem[]>([]);
    const [allInterests, setAllInterests] = useState<TagItem[]>([]);

    const [showSkillBox, setShowSkillBox] = useState<boolean>(false);
    const [showInterestBox, setShowInterestBox] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // --- Helpers ---
    const formatFileName = (url: string) => {
        if (!url) return "No resume uploaded";
        const parts = url.split('/');
        const fullName = parts[parts.length - 1];
        // Removes the "resume-123456789-" prefix added by Multer
        return fullName.replace(/^resume-\d+-/, '');
    };

    useEffect(() => {
        if (!user?.id) return;
        const initLoad = async () => {
            try {
                const profileRes = await axios.get<VolunteerProfileResponse>(`${API_BASE_URL}/volunteers/${user.id}`);
                const v = profileRes.data;

                setUsername(v.user?.username || '');
                setGender(v.gender || 'F');
                setContact(v.contact_number || '');
                setLocation(v.location || 'Selangor');
                setProfilePicUrl(v.profile_picture_url || '');
                setResumeUrl(v.resume_url || '');

                setMySkills(v.skills.map((s) => ({ id: s.id, name: s.skill_name })));
                setMyInterests(v.interests.map((i) => ({ id: i.id, name: i.interest_name })));

                const [skillsRes, interestsRes] = await Promise.all([
                    axios.get<SkillEntity[]>(`${API_BASE_URL}/volunteers/skills`),
                    axios.get<InterestEntity[]>(`${API_BASE_URL}/volunteers/interests`)
                ]);
                setAllSkills(skillsRes.data.map((s) => ({ id: s.id, name: s.skill_name })));
                setAllInterests(interestsRes.data.map((i) => ({ id: i.id, name: i.interest_name })));
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setLoading(false);
            }
        };
        initLoad();
    }, [user?.id]);

    // Handle File Selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            // Create local blob preview for immediate UI feedback
            setProfilePicUrl(URL.createObjectURL(file));
        }
    };

    const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedResume(e.target.files[0]);
        }
    };

    const toggleTag = (item: TagItem, type: 'skill' | 'interest') => {
        if (type === 'skill') {
            const exists = mySkills.find(s => s.id === item.id);
            if (exists) setMySkills(mySkills.filter(s => s.id !== item.id));
            else setMySkills([...mySkills, item]);
        } else {
            const exists = myInterests.find(i => i.id === item.id);
            if (exists) setMyInterests(myInterests.filter(i => i.id !== item.id));
            else setMyInterests([...myInterests, item]);
        }
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('gender', gender);
            formData.append('location', location);
            formData.append('contact_number', contact);
            formData.append('skills', JSON.stringify(mySkills.map(s => ({ id: s.id, skill_name: s.name }))));
            formData.append('interests', JSON.stringify(myInterests.map(i => ({ id: i.id, interest_name: i.name }))));

            if (selectedImage) formData.append('profile_picture', selectedImage);
            if (selectedResume) formData.append('resume', selectedResume);

            await axios.patch(`${API_BASE_URL}/volunteers/${user?.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Profile updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Error saving profile.");
        }
    };

    if (loading) return <div className="loading-state">Loading Profile...</div>;

    return (
        <div className="profile-wrapper">
            <Header />
            <div className="profile-content">
                <h1 className="profile-title">Manage Profile</h1>

                {/* Avatar Section */}
                <div className="avatar-section">
                    <div className="avatar-large" style={{
                        backgroundImage: `url(${profilePicUrl.startsWith('blob:')
                            ? profilePicUrl // If it's a new preview
                            : profilePicUrl
                                ? `${API_BASE_URL}${profilePicUrl}` // If it's saved on the server
                                : `https://ui-avatars.com/api/?name=${username || 'Volunteer'}&background=random`
                            })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}></div>

                    <input
                        type="file"
                        ref={imageInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <button className="secondary-btn" onClick={() => imageInputRef.current?.click()}>
                        Change profile picture
                    </button>
                </div>

                <div className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Username:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="form-group small">
                            <label>Gender:</label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Contact number:</label>
                            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
                        </div>
                        <div className="form-group small">
                            <label>Location:</label>
                            <select value={location} onChange={(e) => setLocation(e.target.value)}>
                                <option value="Selangor">Selangor</option>
                                <option value="Kuala Lumpur">Kuala Lumpur</option>
                                <option value="Melaka">Melaka</option>
                            </select>
                        </div>
                    </div>

                    <div className="tags-section">
                        <label>Skills:</label>
                        <div className="tags-container">
                            {mySkills.map(skill => (
                                <span key={skill.id} className="tag-pill">
                                    {skill.name} <span className="remove-tag" onClick={() => toggleTag(skill, 'skill')}>x</span>
                                </span>
                            ))}
                            <button className="add-tag-btn" onClick={() => setShowSkillBox(!showSkillBox)}>+</button>
                            {showSkillBox && (
                                <div className="selection-box">
                                    <h4>Available Skills</h4>
                                    <div className="selection-grid">
                                        {allSkills.map(s => (
                                            <div key={s.id} className={`selection-item ${mySkills.find(ms => ms.id === s.id) ? 'selected' : ''}`} onClick={() => toggleTag(s, 'skill')}>
                                                {s.name}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="done-btn" onClick={() => setShowSkillBox(false)}>Done</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="tags-section">
                        <label>Interests:</label>
                        <div className="tags-container">
                            {myInterests.map(interest => (
                                <span key={interest.id} className="tag-pill">
                                    {interest.name} <span className="remove-tag" onClick={() => toggleTag(interest, 'interest')}>x</span>
                                </span>
                            ))}
                            <button className="add-tag-btn" onClick={() => setShowInterestBox(!showInterestBox)}>+</button>
                            {showInterestBox && (
                                <div className="selection-box">
                                    <h4>Available Interests</h4>
                                    <div className="selection-grid">
                                        {allInterests.map(i => (
                                            <div key={i.id} className={`selection-item ${myInterests.find(mi => mi.id === i.id) ? 'selected' : ''}`} onClick={() => toggleTag(i, 'interest')}>
                                                {i.name}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="done-btn" onClick={() => setShowInterestBox(false)}>Done</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="resume-section">
                        <label>Resume:</label>
                        <div className="resume-actions">
                            {selectedResume ? (
                                <span className="resume-link">{selectedResume.name} (ready to upload)</span>
                            ) : (
                                <a
                                    href={resumeUrl ? `${API_BASE_URL}${resumeUrl}` : "#"}
                                    className="resume-link"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {formatFileName(resumeUrl)}
                                </a>
                            )}

                            <input
                                type="file"
                                ref={resumeInputRef}
                                style={{ display: 'none' }}
                                accept="application/pdf"
                                onChange={handleResumeChange}
                            />
                            <button className="secondary-btn" onClick={() => resumeInputRef.current?.click()}>
                                Upload resume
                            </button>
                        </div>
                    </div>

                    <button className="save-changes-btn" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}
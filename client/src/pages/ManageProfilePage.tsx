import { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { useAuth } from '../context/auth/useAuth';
import axios from 'axios';
import './manage_profile.css';


const API_BASE_URL = "http://localhost:3000";

const MALAYSIAN_STATES = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
    "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu",
    "Kuala Lumpur", "Labuan", "Putrajaya"
];

// --- Strict Interfaces ---
interface TagItem { id: string; name: string; }
interface SkillEntity { id: string; skill_name: string; }
interface InterestEntity { id: string; interest_name: string; }
interface UserEntity { id: string; username: string; email: string; }
interface RegistrationRecord { id: string; address: string | null; }

interface OrganizationProfileResponse {
    id: string;
    description: string | null;
    contact_number: string | null;
    profile_picture_url: string | null;
    user: UserEntity;
    registrationRecord: RegistrationRecord;
}

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
    const { user, setUser } = useAuth();
    const isOrg = user?.role === 'organization';

    // Shared States
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [contact, setContact] = useState<string>('');
    const [profilePicUrl, setProfilePicUrl] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    // Password States
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    // Organization Specific States
    const [address, setAddress] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    // Volunteer Specific States
    const [gender, setGender] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [resumeUrl, setResumeUrl] = useState<string>('');
    const [selectedResume, setSelectedResume] = useState<File | null>(null);
    const [mySkills, setMySkills] = useState<TagItem[]>([]);
    const [myInterests, setMyInterests] = useState<TagItem[]>([]);
    const [allSkills, setAllSkills] = useState<TagItem[]>([]);
    const [allInterests, setAllInterests] = useState<TagItem[]>([]);

    const [showSkillBox, setShowSkillBox] = useState<boolean>(false);
    const [showInterestBox, setShowInterestBox] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.id) return;
        const initLoad = async () => {
            try {
                if (isOrg) {
                    const res = await axios.get<OrganizationProfileResponse>(`${API_BASE_URL}/organizations/${user.id}`);
                    const d = res.data;
                    setUsername(d.user?.username || '');
                    setEmail(d.user?.email || '');
                    setContact(d.contact_number || '');
                    setProfilePicUrl(d.profile_picture_url || '');
                    setDescription(d.description || '');
                    setAddress(d.registrationRecord?.address || '');
                } else {
                    const res = await axios.get<VolunteerProfileResponse>(`${API_BASE_URL}/volunteers/${user.id}`);
                    const d = res.data;
                    setUsername(d.user?.username || '');
                    setEmail(d.user?.email || '');
                    setContact(d.contact_number || '');
                    setProfilePicUrl(d.profile_picture_url || '');
                    setGender(d.gender || 'F');
                    setLocation(d.location || 'Selangor');
                    setResumeUrl(d.resume_url || '');

                    // Fixed 'any' by using defined entity interfaces
                    setMySkills(d.skills.map((s: SkillEntity) => ({ id: s.id, name: s.skill_name })));
                    setMyInterests(d.interests.map((i: InterestEntity) => ({ id: i.id, name: i.interest_name })));

                    const [sRes, iRes] = await Promise.all([
                        axios.get<SkillEntity[]>(`${API_BASE_URL}/volunteers/skills`),
                        axios.get<InterestEntity[]>(`${API_BASE_URL}/volunteers/interests`)
                    ]);
                    setAllSkills(sRes.data.map((s: SkillEntity) => ({ id: s.id, name: s.skill_name })));
                    setAllInterests(iRes.data.map((i: InterestEntity) => ({ id: i.id, name: i.interest_name })));
                }
            } catch (err) {
                console.error("Load failed", err);
            } finally {
                setLoading(false);
            }
        };
        initLoad();
    }, [user?.id, isOrg]);

    const handleSave = async () => {
        if (newPassword !== confirmPassword) return alert("Passwords do not match!");

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            if (newPassword) formData.append('password', newPassword);
            formData.append('contact_number', contact);

            if (isOrg) {
                formData.append('address', address);
                formData.append('description', description);
            } else {
                formData.append('gender', gender);
                formData.append('location', location);
                formData.append('skills', JSON.stringify(mySkills.map(s => ({ id: s.id, skill_name: s.name }))));
                formData.append('interests', JSON.stringify(myInterests.map(i => ({ id: i.id, interest_name: i.name }))));
                if (selectedResume) formData.append('resume', selectedResume);
            }

            if (selectedImage) formData.append('profile_picture', selectedImage);

            const endpoint = isOrg ? `${API_BASE_URL}/organizations/${user?.id}` : `${API_BASE_URL}/volunteers/${user?.id}`;

            // 1. Send Update and get response
            const response = await axios.patch(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. The server returns the updated Profile (Volunteer or Organization entity)
            const updatedProfileData = response.data;

            // 3. Update global Auth state IMMEDIATELY
            if (setUser && user) {
                const updatedUser = {
                    ...user,
                    username,
                    email,
                    // We update the specific nested key the Header listens to
                    [isOrg ? 'organization' : 'volunteer']: updatedProfileData
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setNewPassword('');
            setConfirmPassword('');
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Error saving profile." + err);
        }
    };

    const getFullImageUrl = (url: string | null | undefined) => {
        if (!url) return `https://ui-avatars.com/api/?name=${username}&background=random`;
        if (url.startsWith('blob:') || url.startsWith('http')) return url;

        // If the path points to frontend public assets folder, serve it directly
        if (url.startsWith('/images/')) return url;

        // Fallback for user-uploaded files that actually live on the backend storage
        return `${API_BASE_URL}${url}`;
    };

    const toggleTag = (item: TagItem, type: 'skill' | 'interest') => {
        const list = type === 'skill' ? mySkills : myInterests;
        const setter = type === 'skill' ? setMySkills : setMyInterests;
        const exists = list.find(t => t.id === item.id);
        if (exists) setter(list.filter(t => t.id !== item.id));
        else setter([...list, item]);
    };

    if (loading) return <div className="loading-state">Loading Profile...</div>;

    return (
        <div className="profile-wrapper">
            <Header />
            <div className="profile-content">
                <h1 className="profile-title">Manage Profile</h1>

                <div className="avatar-section">
                    <div className="avatar-large" style={{
                        backgroundImage: `url(${getFullImageUrl(profilePicUrl)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}></div>
                    <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            setSelectedImage(file);
                            setProfilePicUrl(URL.createObjectURL(file));
                        }
                    }} />
                    <button className="secondary-btn" onClick={() => imageInputRef.current?.click()}>Change profile picture</button>
                </div>

                <div className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Contact number:</label>
                            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
                        </div>
                        {isOrg ? (
                            <div className="form-group">
                                <label>Address:</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Gender:</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {isOrg ? (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address:</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>New Password:</label>
                                <input type="password" placeholder="Leave blank" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password:</label>
                                <input type="password" placeholder="Confirm new" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address:</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Location:</label>
                                    <select value={location} onChange={(e) => setLocation(e.target.value)}>
                                        {MALAYSIAN_STATES.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group hidden-placeholder"></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Password:</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password:</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                                <div className="form-group hidden-placeholder"></div>
                            </div>
                        </>
                    )}

                    {isOrg ? (
                        <div className="form-group full-width">
                            <label>Description:</label>
                            <textarea className="desc-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    ) : (
                        <>
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
                                            <div className="selection-grid">
                                                {allSkills.map(s => (
                                                    <div key={s.id} className={`selection-item ${mySkills.find(ms => ms.id === s.id) ? 'selected' : ''}`} onClick={() => toggleTag(s, 'skill')}>{s.name}</div>
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
                                    {myInterests.map(i => (
                                        <span key={i.id} className="tag-pill">
                                            {i.name} <span className="remove-tag" onClick={() => toggleTag(i, 'interest')}>x</span>
                                        </span>
                                    ))}
                                    <button className="add-tag-btn" onClick={() => setShowInterestBox(!showInterestBox)}>+</button>
                                    {showInterestBox && (
                                        <div className="selection-box">
                                            <div className="selection-grid">
                                                {allInterests.map(i => (
                                                    <div key={i.id} className={`selection-item ${myInterests.find(mi => mi.id === i.id) ? 'selected' : ''}`} onClick={() => toggleTag(i, 'interest')}>{i.name}</div>
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
                                    <button className="secondary-btn" onClick={() => resumeInputRef.current?.click()}>Upload resume</button>
                                    <input type="file" ref={resumeInputRef} style={{ display: 'none' }} accept=".pdf" onChange={(e) => setSelectedResume(e.target.files?.[0] || null)} />
                                    {selectedResume ? <span>{selectedResume.name}</span> : resumeUrl && <a href={`${API_BASE_URL}${resumeUrl}`} target="_blank" className="resume-link">View Current Resume</a>}
                                </div>
                            </div>
                        </>
                    )}

                    <button className="save-changes-btn" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}
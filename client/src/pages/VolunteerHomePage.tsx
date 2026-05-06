import { Header } from './Header';
import './volunteer_home_page.css';
import { AiOutlineSearch, AiFillStar } from 'react-icons/ai';
import { GoTriangleLeft, GoTriangleRight, GoChevronDown } from 'react-icons/go';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useState, forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

// --- Constants ---
const MALAYSIAN_STATES = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
    "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu",
    "Kuala Lumpur", "Labuan", "Putrajaya"
];

// --- Interfaces ---
interface Programme {
    id: string;
    title: string;
    imageUrl: string;
    organization: {
        profile_picture_url: string;
        rating: number;
        user: { username: string; }
    }
}

interface DateBoxProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    placeholder?: string;
}

// BULLETPROOF DATEBOX LOGIC
const DateBox = forwardRef<HTMLDivElement, DateBoxProps>(({ value, onClick, placeholder }, ref) => {
    // If value is null, undefined, or an empty string, show placeholder
    const textToShow = (value && value.trim().length > 0) ? value : placeholder;

    return (
        <div className="date-box" onClick={onClick} ref={ref}>
            <span className="date-text">{textToShow}</span>
            <GoChevronDown className="select-arrow-icon" />
        </div>
    );
});

export function VolunteerHomePage() {
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [allSkills, setAllSkills] = useState<{ id: string, skill_name: string }[]>([]);
    const [allInterests, setAllInterests] = useState<{ id: string, interest_name: string }[]>([]);

    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [saveStatus, setSaveStatus] = useState('all');

    const [isLocOpen, setIsLocOpen] = useState(false);
    const [isSkillOpen, setIsSkillOpen] = useState(false);
    const [isInterestOpen, setIsInterestOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [skillsRes, interestsRes] = await Promise.all([
                    axios.get('http://localhost:3000/volunteers/skills'),
                    axios.get('http://localhost:3000/volunteers/interests')
                ]);
                setAllSkills(skillsRes.data);
                setAllInterests(interestsRes.data);
            } catch (err) {
                console.error("Failed to fetch filter options", err);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchProgrammes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3000/programmes', {
                    params: {
                        keyword: searchTerm,
                        location: selectedLocations.join(','),
                        skill: selectedSkills.join(','),
                        interest: selectedInterests.join(','),
                        start: startDate?.toISOString(),
                        end: endDate?.toISOString(),
                        saved: saveStatus
                    }
                });
                setProgrammes(response.data);
                setCurrentPage(1);
            } catch (error) {
                console.error("API Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgrammes();
    }, [searchTerm, selectedLocations, selectedSkills, selectedInterests, startDate, endDate, saveStatus]);

    const toggleFilter = (val: string, list: string[], setter: (val: string[]) => void) => {
        setter(list.includes(val) ? list.filter(i => i !== val) : [...list, val]);
    };

    const totalPages = Math.ceil(programmes.length / itemsPerPage);
    const currentProgrammes = programmes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="volunteer-home-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="search-filter-bar">
                    
                    <div className="search-input-container">
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search by keyword"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <AiOutlineSearch className="search-icon" />
                    </div>

                    <div className="custom-multiselect-container">
                        <div className="custom-select-box" onClick={() => setIsLocOpen(!isLocOpen)}>
                            <span className="select-text">
                                {selectedLocations.length === 0 ? "All Locations" : `${selectedLocations.length} selected`}
                            </span>
                            <GoChevronDown className="select-arrow-icon" />
                        </div>
                        {isLocOpen && (
                            <div className="multiselect-dropdown">
                                {MALAYSIAN_STATES.map(state => (
                                    <label key={state} className="checkbox-label">
                                        <input type="checkbox" checked={selectedLocations.includes(state)} onChange={() => toggleFilter(state, selectedLocations, setSelectedLocations)} /> {state}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="custom-multiselect-container">
                        <div className="custom-select-box" onClick={() => setIsSkillOpen(!isSkillOpen)}>
                            <span className="select-text">
                                {selectedSkills.length === 0 ? "All Skills" : `${selectedSkills.length} selected`}
                            </span>
                            <GoChevronDown className="select-arrow-icon" />
                        </div>
                        {isSkillOpen && (
                            <div className="multiselect-dropdown">
                                {allSkills.map(skill => (
                                    <label key={skill.id} className="checkbox-label">
                                        <input type="checkbox" checked={selectedSkills.includes(skill.id)} onChange={() => toggleFilter(skill.id, selectedSkills, setSelectedSkills)} /> {skill.skill_name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="custom-multiselect-container">
                        <div className="custom-select-box" onClick={() => setIsInterestOpen(!isInterestOpen)}>
                            <span className="select-text">
                                {selectedInterests.length === 0 ? "All Interests" : `${selectedInterests.length} selected`}
                            </span>
                            <GoChevronDown className="select-arrow-icon" />
                        </div>
                        {isInterestOpen && (
                            <div className="multiselect-dropdown">
                                {allInterests.map(interest => (
                                    <label key={interest.id} className="checkbox-label">
                                        <input type="checkbox" checked={selectedInterests.includes(interest.id)} onChange={() => toggleFilter(interest.id, selectedInterests, setSelectedInterests)} /> {interest.interest_name}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <DatePicker
                        selected={startDate}
                        onChange={(date: Date | null) => setStartDate(date)}
                        placeholderText="Start Time" // Library internal
                        customInput={<DateBox placeholder="Start Time" />} // Explicitly pass to your DateBox
                        showTimeSelect
                        dateFormat="Pp"
                    />

                    <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        placeholderText="End Time" // Library internal
                        customInput={<DateBox placeholder="End Time" />} // Explicitly pass to your DateBox
                        showTimeSelect
                        dateFormat="Pp"
                    />

                    <select className="standard-select" value={saveStatus} onChange={(e) => setSaveStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="saved">Saved</option>
                        <option value="not-saved">Not saved</option>
                    </select>
                </div>

                <div className="programmes-container">
                    {loading ? (
                        <div className="loading-state">Loading opportunities...</div>
                    ) : currentProgrammes.map((prog) => (
                        <div key={prog.id} className="programme" onClick={() => navigate(`/programme-details/${prog.id}`)}>
                            <div className="programme-image" style={{ backgroundImage: `url(${prog.imageUrl})`, backgroundSize: 'cover' }}></div>
                            <div className="programme-info">
                                <div className="programme-name">{prog.title}</div>
                                <div className="organization-info">
                                    <div className="organization-profile-pic" style={{ backgroundImage: `url(${prog.organization?.profile_picture_url || ''})`, backgroundSize: 'cover' }}></div>
                                    <div className="organization-name">{prog.organization?.user?.username || 'Unknown'}</div>
                                    <div className="organization-rating">
                                        <AiFillStar className="star-icon" />
                                        <p className="organization-rating-text">{prog.organization?.rating?.toFixed(1) || '0.0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pagination-container">
                    <GoTriangleLeft className={`pagination-arrow ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} />
                    <div className="page-number-box">{currentPage}</div>
                    <GoTriangleRight className={`pagination-arrow ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`} onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} />
                </div>
            </div>
        </div>
    );
}
import { Header } from './Header';
import './volunteer_home_page.css';
import { AiOutlineSearch, AiFillStar } from 'react-icons/ai';
import { GoTriangleLeft, GoTriangleRight, GoChevronDown, GoSync } from 'react-icons/go';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useState, forwardRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useAuth } from '../context/auth/useAuth';

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

const DateBox = forwardRef<HTMLDivElement, DateBoxProps>(({ value, onClick, placeholder }, ref) => (
    <div className="date-box" onClick={onClick} ref={ref}>
        <span className="date-text">{value || placeholder}</span>
        <GoChevronDown className="select-arrow-icon" />
    </div>
));

export function VolunteerHomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);
    const [allSkills, setAllSkills] = useState<{ id: string, skill_name: string }[]>([]);
    const [allInterests, setAllInterests] = useState<{ id: string, interest_name: string }[]>([]);

    // --- Type-safe session storage helper ---
    const getStored = <T,>(key: string, defaultValue: T): T => {
        const saved = sessionStorage.getItem(key);
        if (!saved) return defaultValue;
        try {
            return JSON.parse(saved) as T;
        } catch {
            return defaultValue;
        }
    };

    // Filter States initialized from session storage
    const [selectedLocations, setSelectedLocations] = useState<string[]>(() => getStored('v_loc', []));
    const [selectedSkills, setSelectedSkills] = useState<string[]>(() => getStored('v_skill', []));
    const [selectedInterests, setSelectedInterests] = useState<string[]>(() => getStored('v_int', []));
    const [searchTerm, setSearchTerm] = useState<string>(() => getStored('v_search', ''));

    const [startDate, setStartDate] = useState<Date | null>(() => {
        const d = sessionStorage.getItem('v_start');
        return d ? new Date(d) : null;
    });
    const [endDate, setEndDate] = useState<Date | null>(() => {
        const d = sessionStorage.getItem('v_end');
        return d ? new Date(d) : null;
    });

    const [saveStatus, setSaveStatus] = useState<string>(() => getStored('v_status', 'all'));
    const [currentPage, setCurrentPage] = useState<number>(() => getStored('v_page', 1));

    // UI Logic States
    const [isLocOpen, setIsLocOpen] = useState(false);
    const [isSkillOpen, setIsSkillOpen] = useState(false);
    const [isInterestOpen, setIsInterestOpen] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 6;

    // --- SAVE TO SESSION STORAGE ---
    const persistFilters = useCallback((page: number) => {
        sessionStorage.setItem('v_loc', JSON.stringify(selectedLocations));
        sessionStorage.setItem('v_skill', JSON.stringify(selectedSkills));
        sessionStorage.setItem('v_int', JSON.stringify(selectedInterests));
        sessionStorage.setItem('v_search', JSON.stringify(searchTerm));
        sessionStorage.setItem('v_status', JSON.stringify(saveStatus));
        sessionStorage.setItem('v_page', JSON.stringify(page));
        if (startDate) sessionStorage.setItem('v_start', startDate.toISOString());
        else sessionStorage.removeItem('v_start');
        if (endDate) sessionStorage.setItem('v_end', endDate.toISOString());
        else sessionStorage.removeItem('v_end');
    }, [selectedLocations, selectedSkills, selectedInterests, searchTerm, saveStatus, startDate, endDate]);

    const handleSearch = async (pageNumber: number = 1, isReset: boolean = false) => {
        try {
            setLoading(true);
            if (!isReset) persistFilters(pageNumber);

            /**
             * SMART ENDPOINT LOGIC:
             * We always hit the recommendation endpoint. 
             * If the user isn't logged in, we pass 'guest' to trigger 
             * the Global Quality (Rating) ranking.
             */
            const userIdParam = user?.id || 'guest';
            const url = `http://localhost:3000/programmes/recommendations/${userIdParam}`;

            const params = isReset ? {
                keyword: '',
                location: '',
                skill: '',
                interest: '',
                start: undefined,
                end: undefined,
                saved: 'all',
                userId: user?.id,
                page: 1,
                limit: itemsPerPage
            } : {
                keyword: searchTerm,
                location: selectedLocations.join(','),
                skill: selectedSkills.join(','),
                interest: selectedInterests.join(','),
                start: startDate?.toISOString(),
                end: endDate?.toISOString(),
                saved: saveStatus,
                userId: user?.id,
                page: pageNumber,
                limit: itemsPerPage
            };

            const response = await axios.get(url, { params });
            setProgrammes(response.data.items || []);
            setTotalPages(response.data.lastPage || 1);
            setCurrentPage(response.data.page || 1);
        } catch (error: unknown) {
            console.error("Search Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        sessionStorage.clear();
        setSearchTerm('');
        setSelectedLocations([]);
        setSelectedSkills([]);
        setSelectedInterests([]);
        setStartDate(null);
        setEndDate(null);
        setSaveStatus('all');
        setCurrentPage(1);
        handleSearch(1, true);
    };

    useEffect(() => {
        const loadPageData = async () => {
            try {
                const [skillsRes, interestsRes] = await Promise.all([
                    axios.get('http://localhost:3000/volunteers/skills'),
                    axios.get('http://localhost:3000/volunteers/interests')
                ]);
                setAllSkills(skillsRes.data);
                setAllInterests(interestsRes.data);

                const savedPage = getStored('v_page', 1);
                await handleSearch(savedPage);
            } catch (err: unknown) {
                console.error("Load Error:", err);
            }
        };
        loadPageData();
        // Dependencies include user?.id so the feed personalizes as soon as login finishes
    }, [user?.id]);

    const goToNextPage = () => {
        if (currentPage < totalPages) handleSearch(currentPage + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) handleSearch(currentPage - 1);
    };

    const toggleFilter = (val: string, list: string[], setter: (val: string[]) => void) => {
        setter(list.includes(val) ? list.filter(i => i !== val) : [...list, val]);
    };

    return (
        <div className="volunteer-home-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="search-filter-section">
                    <div className="filter-inputs-row">
                        <div className="search-input-container">
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Search by keyword"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                            />
                        </div>

                        {/* Location Select */}
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

                        {/* Skills Select */}
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

                        {/* Interests Select */}
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
                            placeholderText="Start Time"
                            customInput={<DateBox placeholder="Start Time" />}
                            showTimeSelect
                            dateFormat="Pp"
                        />

                        <DatePicker
                            selected={endDate}
                            onChange={(date: Date | null) => setEndDate(date)}
                            placeholderText="End Time"
                            customInput={<DateBox placeholder="End Time" />}
                            showTimeSelect
                            dateFormat="Pp"
                        />

                        <select className="standard-select" value={saveStatus} onChange={(e) => setSaveStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="saved">Saved Only</option>
                            <option value="not-saved">Not Saved</option>
                        </select>
                    </div>

                    <div className="filter-actions-row">
                        <button className="search-trigger-btn" onClick={() => handleSearch(1)}>
                            <AiOutlineSearch className="btn-icon" />
                            Search
                        </button>
                        <button className="reset-filter-btn" onClick={handleReset}>
                            <GoSync className="btn-icon reset-animate" />
                            Reset Filters
                        </button>
                    </div>
                </div>

                <div className="programmes-container">
                    {loading ? (
                        <div className="loading-state">Personalizing your feed...</div>
                    ) : programmes.length > 0 ? (
                        programmes.map((prog) => (
                            <div key={prog.id} className="programme" onClick={() => navigate(`/programme-details/${prog.id}`)}>
                                <div className="programme-image" style={{ backgroundImage: `url(${prog.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
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
                        ))
                    ) : (
                        <div className="no-results">No programmes found. Try adjusting your filters!</div>
                    )}
                </div>

                <div className="pagination-container">
                    <GoTriangleLeft className={`pagination-arrow ${currentPage === 1 ? 'disabled' : ''}`} onClick={goToPrevPage} />
                    <div className="page-number-box">{currentPage}</div>
                    <GoTriangleRight className={`pagination-arrow ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`} onClick={goToNextPage} />
                </div>
            </div>
        </div>
    );
}
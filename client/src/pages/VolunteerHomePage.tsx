import { Header } from './Header';
import './volunteer_home_page.css';
import { AiOutlineSearch, AiFillStar } from 'react-icons/ai';
import { GoTriangleLeft, GoTriangleRight, GoChevronDown } from 'react-icons/go';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useState, forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

interface Programme {
    id: string;
    title: string;
    imageUrl: string;
    organization: {
        profile_picture_url: string;
        rating: number;
        user: {
            username: string;
        }
    }
}

interface DateBoxInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    placeholder?: string;
}

const DateBox = forwardRef<HTMLDivElement, DateBoxInputProps>(
    ({ value, onClick, placeholder }, ref) => (
        <div className="date-box" onClick={onClick} ref={ref}>
            <span className="date-text">{value || placeholder}</span>
            <GoChevronDown className="select-arrow-icon" />
        </div>
    )
);

export function VolunteerHomePage() {
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedInterest, setSelectedInterest] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [saveStatus, setSaveStatus] = useState('all');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProgrammes = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3000/programmes', {
                    params: {
                        keyword: searchTerm,
                        location: selectedLocation,
                        skill: selectedSkill,
                        interest: selectedInterest,
                        start: startDate?.toISOString(),
                        end: endDate?.toISOString(),
                        saved: saveStatus
                    }
                });
                setProgrammes(response.data);
            } catch (error) {
                console.error("Nyeah! API Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgrammes();
    }, [searchTerm, selectedLocation, selectedSkill, selectedInterest, startDate, endDate, saveStatus]);

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

                    <select name="location" id="location" onChange={(e) => setSelectedLocation(e.target.value)}>
                        <option value="">All Locations</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Johor">Johor</option>
                        <option value="Penang">Penang</option>
                    </select>

                    <select name="skill" id="skill" onChange={(e) => setSelectedSkill(e.target.value)}>
                        <option value="">All Skills</option>
                        <option value="SKL001">Coding</option>
                        <option value="SKL002">Graphic design</option>
                        <option value="SKL009">Tutoring</option>
                        <option value="SKL014">Photography</option>
                    </select>

                    <select name="interest" id="interest" onChange={(e) => setSelectedInterest(e.target.value)}>
                        <option value="">All Interests</option>
                        <option value="INT001">Animal Welfare</option>
                        <option value="INT018">Gender equality</option>
                        <option value="INT003">Education</option>
                        <option value="INT013">Marine conservation</option>
                    </select>

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

                    <select name="saved" id="saved" onChange={(e) => setSaveStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="saved">Saved</option>
                        <option value="not-saved">Not saved</option>
                    </select>
                </div>

                <div className="programmes-container">
                    {loading ? (
                        <div className="loading-state">Fetching amazing opportunities for you... Nyeah!</div>
                    ) : programmes.length > 0 ? (
                        programmes.map((prog) => (
                            <div
                                key={prog.id}
                                className="programme"
                                onClick={() => navigate(`/programme-details/${prog.id}`)}
                            >
                                <div
                                    className="programme-image"
                                    style={{
                                        backgroundImage: `url(${prog.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                ></div>
                                <div className="programme-info">
                                    <div className="programme-name">{prog.title}</div>
                                    <div className="organization-info">
                                        <div
                                            className="organization-profile-pic"
                                            style={{
                                                backgroundImage: `url(${prog.organization?.profile_picture_url || ''})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        ></div>
                                        <div className="organization-name">{prog.organization?.user?.username || 'Unknown'}</div>
                                        <div className="organization-rating">
                                            <AiFillStar className="star-icon" />
                                            <p className="organization-rating-text">
                                                {prog.organization?.rating?.toFixed(1) || '0.0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No programmes found matching your filters. Try something else!</div>
                    )}
                </div>

                <div className="pagination-container">
                    <GoTriangleLeft className="pagination-arrow" />
                    <div className="page-number-box">1</div>
                    <GoTriangleRight className="pagination-arrow" />
                </div>
            </div>
        </div>
    );
}
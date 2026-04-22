import { Header } from './Header';
import './volunteer_home_page.css';
import { AiOutlineSearch, AiFillStar } from 'react-icons/ai';
import { GoTriangleLeft, GoTriangleRight, GoChevronDown } from 'react-icons/go';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router';

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
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const navigate = useNavigate();

    return (
        <div className="volunteer-home-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="search-filter-bar">
                    <div className="search-input-container">
                        <input className="search-input" type="text" placeholder="Search by keyword" />
                        <AiOutlineSearch className="search-icon" />
                    </div>
                    <select name="location" id="location">
                        <option value="selangor">Selangor</option>
                        <option value="kuala-lumpur">Kuala Lumpur</option>
                        <option value="melaka">Melaka</option>
                        <option value="johor">Johor</option>
                        <option value="penang">Penang</option>
                    </select>
                    <select name="skill" id="skill">
                        <option value="coding">Coding</option>
                        <option value="graphic-design">Graphic design</option>
                        <option value="tutoring">Tutoring</option>
                        <option value="photography">Photography</option>
                    </select>
                    <select name="interest" id="interest">
                        <option value="animal-welfare">Animal Welfare</option>
                        <option value="gender-equality">Gender equality</option>
                        <option value="education">Education</option>
                        <option value="marine conservation">Marine conservation</option>
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
                    <select name="saved" id="saved">
                        <option value="saved">Saved</option>
                        <option value="not-saved">Not saved</option>
                    </select>
                </div>
                <div className="programmes-container">
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Green Earth Clean-Up Drive</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">EcoGuardians Malaysia</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">4.9</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Bright Minds Tutoring Sessions</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">BrightPath Learning Foundation</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Healthy Living Awareness Campaign</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">WellCare Community Alliance</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">4.9</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Paws & Care Animal Shelter Support</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">Companion Hearts Rescue Society</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">5.0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Golden Years Creative Arts Workshop</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">Silver Horizons Cultural Centre</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">5.0</p>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="programme" onClick={() => navigate(`/programme-details`)}>
                        <div className="programme-image"></div>
                        <div className="programme-info">
                            <div className="programme-name">Future Skills Digital Training Bootcamp</div>
                            <div className="organization-info">
                                <div className="organization-profile-pic"></div>
                                <div className="organization-name">NextGen Tech Empowerment Initiative</div>
                                <div className="organization-rating">
                                    <AiFillStar className="star-icon" />
                                    <p className="organization-rating-text">4.8</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pagination-container">
                    <GoTriangleLeft
                        className="pagination-arrow"
                    />

                    <div className="page-number-box">1</div>

                    <GoTriangleRight
                        className="pagination-arrow"
                    />
                </div>
            </div>
        </div>
    )
}
import { useState, useEffect } from 'react';
import { Header } from './Header';
import axios from 'axios';
import './qa_page.css';

interface QAItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

export function QAPage() {
    const [questions, setQuestions] = useState<QAItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const toggleQuestion = (id: string) => {
        setActiveId(activeId === id ? null : id);
    };

    useEffect(() => {
        const fetchQA = async () => {
            try {
                setLoading(true);
                // Fetching from the interactions module endpoint
                const response = await axios.get<QAItem[]>('http://localhost:3000/interactions/qa');
                setQuestions(response.data);
            } catch (error) {
                console.error("Error fetching QA data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQA();
    }, []);

    // Dynamically filter questions based on the 'category' column in the database
    const volunteerQuestions = questions.filter(q => q.category?.toLowerCase() === 'volunteer');
    const orgQuestions = questions.filter(q => q.category?.toLowerCase() === 'organization');

    return (
        <div className="qa-wrapper">
            <Header />
            <div className="qa-content">
                <h1 className="qa-title">Q&A</h1>

                {loading ? (
                    <div className="loading-state">Loading frequently asked questions...</div>
                ) : (
                    <div className="qa-columns">
                        {/* Volunteer Column */}
                        <div className="qa-column">
                            <h2>Volunteer</h2>
                            <div className="questions-list">
                                {volunteerQuestions.length > 0 ? (
                                    volunteerQuestions.map((q) => (
                                        <div key={q.id} className="qa-item">
                                            <div className="qa-question" onClick={() => toggleQuestion(q.id)}>
                                                {q.question}
                                            </div>
                                            {activeId === q.id && <div className="qa-answer">{q.answer}</div>}
                                            <hr />
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data-msg">No volunteer questions found.</p>
                                )}
                            </div>
                        </div>

                        {/* Organization Column */}
                        <div className="qa-column">
                            <h2 className="org-heading">Organization</h2>
                            <div className="questions-list">
                                {orgQuestions.length > 0 ? (
                                    orgQuestions.map((q) => (
                                        <div key={q.id} className="qa-item">
                                            <div className="qa-question right-align" onClick={() => toggleQuestion(q.id)}>
                                                {q.question}
                                            </div>
                                            {activeId === q.id && <div className="qa-answer right-align">{q.answer}</div>}
                                            <hr />
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data-msg">No organization questions found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="qa-footer-section">
                    <p className="qa-footer">
                        Didn't see your question? Let us know through a <a href="#">support ticket</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
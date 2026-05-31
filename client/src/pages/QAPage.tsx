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

    // ─── NEW STATE MANAGEMENT FOR SUPPORT TICKET MODAL WINDOW ───
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [issueText, setIssueText] = useState<string>("");
    const [submittingTicket, setSubmittingTicket] = useState<boolean>(false);

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

    // ─── HANDLER FOR CAPTURING AND CREATING A SUPPORT TICKET ───
    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Dynamically reads the current logged-in user identity token from storage
        const sessionUserId = localStorage.getItem('userId');

        if (!sessionUserId) {
            alert("Error: Active session contextual mapping not found. Please re-authenticate via the login interface.");
            return;
        }

        if (!issueText.trim()) {
            alert("Please enter details regarding your support issue before proceeding.");
            return;
        }

        try {
            setSubmittingTicket(true);

            // Dispatches request payload structured to fit your backend DTO validation properties
            await axios.post('http://localhost:3000/interactions/support-ticket', {
                userId: sessionUserId,
                content: issueText.trim()
            });

            alert("Support ticket successfully logged in the database registry! Administrators will evaluate your issue parameters.");
            setIssueText(""); // Reset form text string buffer
            setIsModalOpen(false); // Dismiss modal view container overlay
        } catch (error) {
            console.error("Support ticket production execution failed:", error);
            alert("Failed to deliver your issue log down to the server API. Verify runtime configurations.");
        } finally {
            setSubmittingTicket(false);
        }
    };

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
                        Didn't see your question? Let us know through a{' '}
                        {/* ─── ATTACHED TRIGGER INTERACTION LINK FOR OPENING MODAL WINDOW ─── */}
                        <span className="ticket-link" onClick={() => setIsModalOpen(true)}>
                            support ticket
                        </span>.
                    </p>
                </div>
            </div>

            {/* ─── DYNAMIC SUPPORT TICKET INTERFACE POP-UP MODAL WINDOW ─── */}
            {isModalOpen && (
                <div className="ticket-modal-overlay">
                    <div className="ticket-modal-box">
                        <h3>Submit Support Ticket</h3>
                        <p>Describe the issue or system anomaly you are experiencing:</p>

                        <form onSubmit={handleTicketSubmit}>
                            <textarea
                                value={issueText}
                                onChange={(e) => setIssueText(e.target.value)}
                                placeholder="Provide detailed description parameters here..."
                                rows={5}
                                required
                            />
                            <div className="modal-buttons-row">
                                <button
                                    type="button"
                                    className="modal-cancel-btn"
                                    onClick={() => { setIsModalOpen(false); setIssueText(""); }}
                                    disabled={submittingTicket}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-submit-btn"
                                    disabled={submittingTicket}
                                >
                                    {submittingTicket ? "Submitting..." : "Submit Ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
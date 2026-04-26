import { useState } from 'react';
import { Header } from './Header';
import './qa_page.css';

export function QAPage() {
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggleQuestion = (id: string) => {
        setActiveId(activeId === id ? null : id);
    };

    const volunteerQuestions = [
        {
            id: 'v1',
            question: "How does the system recommend volunteering programs to me?",
            answer: "The VMMS uses a smart matching and discovery feature. It analyzes your specific skills, interests, location, and availability to provide personalized recommendations that align with your profile."
        },
        {
            id: 'v2',
            question: "How is my contribution recognized on the platform?",
            answer: "Your contributions are tracked via your profile, where you can earn badges, climb the leaderboard, and generate a volunteering certificate after completing programs."
        },
        {
            id: 'v3',
            question: "What should I do if I find a suspicious program listing?",
            answer: "Please use the 'Report' button on the program details page or contact our support team immediately through a support ticket."
        }
    ];

    const orgQuestions = [
        {
            id: 'o1',
            question: "Can I manage which volunteers join my program?",
            answer: "Yes, organizations have a dashboard where they can review volunteer profiles and approve or decline applications based on program requirements."
        },
        {
            id: 'o2',
            question: "How can I communicate with volunteers who have joined my program?",
            answer: "The platform provides a built-in messaging system and email notifications to help you stay in touch with your volunteer team."
        },
        {
            id: 'o3',
            question: "What happens after a volunteering program is completed?",
            answer: "Once a program ends, you can verify the hours for each volunteer and provide feedback/ratings for their contribution."
        }
    ];

    return (
        <div className="qa-wrapper">
            <Header />
            <div className="qa-content">
                <h1 className="qa-title">Q&A</h1>

                <div className="qa-columns">
                    {/* Volunteer Column */}
                    <div className="qa-column">
                        <h2>Volunteer</h2>
                        <div className="questions-list">
                            {volunteerQuestions.map((q) => (
                                <div key={q.id} className="qa-item">
                                    <div className="qa-question" onClick={() => toggleQuestion(q.id)}>
                                        {q.question}
                                    </div>
                                    {activeId === q.id && <div className="qa-answer">{q.answer}</div>}
                                    <hr />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Organization Column */}
                    <div className="qa-column">
                        <h2 className="org-heading">Organization</h2>
                        <div className="questions-list">
                            {orgQuestions.map((q) => (
                                <div key={q.id} className="qa-item">
                                    <div className="qa-question right-align" onClick={() => toggleQuestion(q.id)}>
                                        {q.question}
                                    </div>
                                    {activeId === q.id && <div className="qa-answer right-align">{q.answer}</div>}
                                    <hr />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="qa-footer">
                    Didn't see your question? Let us know through a <a href="#">support ticket</a>.
                </p>
            </div>
        </div>
    );
}
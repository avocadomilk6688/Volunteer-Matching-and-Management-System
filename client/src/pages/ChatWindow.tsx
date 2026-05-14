import './chat_window.css';
import { MdClose } from 'react-icons/md';
import { IoSendSharp } from 'react-icons/io5';

interface ChatWindowProps {
    onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {
    return (
        <div className="chat-window-container">
            {/* Sidebar for other chats */}
            <div className="chat-sidebar">
                <div className="sidebar-profile-item active">
                    <div className="profile-circle"></div>
                </div>
                <div className="sidebar-profile-item">
                    <div className="profile-circle"></div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <div className="header-left">
                        <div className="header-profile-pic"></div>
                        <span className="header-name">EcoGuardians Malaysia</span>
                    </div>
                    {/* Fixed: Hooked up the onClose prop here */}
                    <button className="header-close-btn" onClick={onClose}>
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Message Content */}
                <div className="chat-messages">
                    <div className="date-separator">15/11/2025 11:14am</div>

                    {/* User Message (Right) */}
                    <div className="message-row user">
                        <div className="message-bubble orange">
                            <p>Hi. Is the Green Earth Clean-Up Drive providing lunch?</p>
                            <span className="message-time">11:14am</span>
                        </div>
                    </div>

                    {/* Partner Message (Left) */}
                    <div className="message-row partner">
                        <div className="partner-profile-pic"></div>
                        <div className="message-bubble gray">
                            <p>Yes, lunch will be provided.</p>
                            <span className="message-time">11:15am</span>
                        </div>
                    </div>

                    {/* User Message (Right) */}
                    <div className="message-row user">
                        <div className="message-bubble orange">
                            <p>Thank you!</p>
                            <span className="message-time">11:15am</span>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="chat-input-field"
                    />
                    <button className="send-btn">
                        <IoSendSharp size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
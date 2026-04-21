import { Link } from 'react-router';
import { Header } from './Header';
import './sign_up_page.css';

export function SignUpPage() {
    return (
        <div className="sign-up-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="sign-up-container">
                    <h2>Sign Up</h2>
                    <form action="">
                        <div className="email-input">
                            <label htmlFor="email">Email address:</label><br />
                            <input type="email" id="email" />
                        </div>
                        <div className="password-input">
                            <label htmlFor="password">Password:</label><br />
                            <input type="password" id="password" />
                        </div>
                        <div className="comfirm-password-input">
                            <label htmlFor="comfirm-password">Comfirm password:</label><br />
                            <input type="password" id="password" />
                        </div>
                        <div className="role-selection">
                            <p>Role:</p>
                            <input type="radio" id="volunteer" checked />
                            <label htmlFor="volunteer">Volunteer</label>
                            <input type="radio" id="organization" />
                            <label htmlFor="organization">Organization</label>
                        </div>
                        <button className="sign-up-button">Sign Up</button>
                    </form>
                    <p className="sign-up">Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    )
}
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Header } from './Header';
import './login_page.css';

export function LoginPage() {
    const navigate = useNavigate();

    const handleLoginShortcut = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/volunteer-home');
    };

    return (
        <div className="login-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="login-container">
                    <h2>Login</h2>
                    <form action="">
                        <div className="email-input">
                            <label htmlFor="email">Email address:</label><br />
                            <input type="email" id="email" />
                        </div>
                        <div className="password-input">
                            <label htmlFor="password">Password:</label><br />
                            <input type="password" id="password" />
                        </div>
                        <div className="role-selection">
                            <p>Role:</p>
                            <input type="radio" id="volunteer" checked />
                            <label htmlFor="volunteer">Volunteer</label>
                            <input type="radio" id="organization" />
                            <label htmlFor="organization">Organization</label>
                            <input type="radio" id="admin" />
                            <label htmlFor="admin">Admin</label>
                        </div>
                        <button className="login-button" onClick={handleLoginShortcut}>Login</button>
                    </form>
                    <a className="forgot-password" href="#">Forgot password</a>
                    <p className="sign-up">Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
                </div>
            </div>
        </div>
    )
}
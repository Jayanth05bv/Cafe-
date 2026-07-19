import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.confirmed) {
            setSuccess("Registration confirmed. You can now log in.");
        }
        if (location.state?.passwordReset) {
            setSuccess("Password updated. You can now log in.");
        }
    }, [location.state?.confirmed, location.state?.passwordReset]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const data = await api.login(usernameOrEmail, password);
            api.setToken(data.token);
            if (data.username) {
                try {
                    localStorage.setItem("user", JSON.stringify({ username: data.username, email: data.email, roles: data.roles || [] }));
                } catch (_) {}
            }
            setSuccess("Login successful.");
            const to = api.getDashboardPath(data.roles || []);
            setTimeout(() => navigate(to), 800);
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box auth-box-login">
                <div className="login-shell">
                    <div className="login-hero">
                        <span className="login-kicker">Welcome Back</span>
                        <h2 className="auth-title">Sign in to your cafe account</h2>
                        <p className="login-copy">
                            Access bookings, orders, profiles, and dashboards from one warm digital cafe space.
                        </p>
                        <div className="login-feature-list">
                            <span>Orders and bookings</span>
                            <span>Owner and staff dashboards</span>
                            <span>Fast account access</span>
                        </div>
                    </div>

                    <form className="auth-form login-form" onSubmit={handleSubmit}>
                        <div className="login-form-header">
                            <h3>Account Login</h3>
                            <p>Use your username or registered email to continue.</p>
                        </div>

                        <div className="field login-field">
                            <label>Username or Email</label>
                            <input
                                type="text"
                                placeholder="Username or registered email"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="field login-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-form-meta">
                            <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>
                        </div>

                        {error && <p className="field-error login-message">{error}</p>}
                        {success && <p className="field-success login-message">{success}</p>}

                        <div className="auth-actions login-actions">
                            <button type="button" className="auth-btn secondary" onClick={() => navigate("/")}>
                                Back
                            </button>
                            <button type="submit" className="auth-btn primary" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

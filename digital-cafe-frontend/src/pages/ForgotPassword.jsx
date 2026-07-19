import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email ?? "");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setResetLink("");
        setLoading(true);
        try {
            const data = await api.forgotPassword(email);
            if (data.resetLink) {
                setSuccess(data.message || "Use the link below to reset your password.");
                setResetLink(data.resetLink);
            } else {
                setError("No account was found with this email. Use the email you used to register, or register first.");
            }
        } catch (err) {
            setError(err.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box auth-box-login">
                <h2 className="auth-title">Reset password</h2>
                <p className="check-email-message" style={{ marginBottom: "1rem" }}>
                    Enter the email address for your account. We&apos;ll send a reset link to your email and show it on this page so you can reset your password.
                </p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="field-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}
                    {success && <p className="field-success" style={{ marginBottom: "0.5rem" }}>{success}</p>}
                    {resetLink && (
                        <div className="check-email-hint" style={{ marginBottom: "0.5rem", padding: "0.75rem", background: "#f0f7f0", borderRadius: "8px" }}>
                            <p style={{ marginBottom: "0.5rem" }}>Use this link to set a new password (it also works if the email did not arrive):</p>
                            <p style={{ margin: 0 }}>
                                <a href={resetLink} style={{ wordBreak: "break-all", fontWeight: 600 }}>Reset password now</a>
                            </p>
                        </div>
                    )}
                    <div className="auth-actions">
                        <Link to="/login" className="auth-btn secondary">Back to Login</Link>
                        <button type="submit" className="auth-btn primary" disabled={loading}>
                            {loading ? "Sending…" : "Send reset link"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

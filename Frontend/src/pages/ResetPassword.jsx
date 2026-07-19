import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) setError("Missing reset token. Use the link from your email.");
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 4) {
            setError("Password must be at least 4 characters.");
            return;
        }
        setLoading(true);
        try {
            await api.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => navigate("/login", { state: { passwordReset: true } }), 2000);
        } catch (err) {
            setError(err.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <h2 className="auth-title">Reset password</h2>
                    <p className="field-error">{error}</p>
                    <div className="auth-actions" style={{ marginTop: "1rem" }}>
                        <Link to="/forgot-password" className="auth-btn primary">Request new link</Link>
                        <Link to="/login" className="auth-btn secondary">Back to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-box auth-box-login">
                <h2 className="auth-title">Set new password</h2>
                {success ? (
                    <p className="field-success">Password updated. Redirecting to login…</p>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label>New password</label>
                            <input
                                type="password"
                                placeholder="At least 4 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={4}
                            />
                        </div>
                        <div className="field">
                            <label>Confirm password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={4}
                            />
                        </div>
                        {error && <p className="field-error" style={{ marginBottom: "0.5rem" }}>{error}</p>}
                        <div className="auth-actions">
                            <Link to="/login" className="auth-btn secondary">Cancel</Link>
                            <button type="submit" className="auth-btn primary" disabled={loading}>
                                {loading ? "Updating…" : "Update password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

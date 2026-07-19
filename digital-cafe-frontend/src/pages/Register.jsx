import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

const MAX_FILE_MB = 10;

export default function Register() {
    const [step, setStep] = useState(1);
    const [identificationFile, setIdentificationFile] = useState(null);
    const [identificationError, setIdentificationError] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError("");
        setSuccess("");
        if (!username.trim() || !email.trim() || !password) {
            setError("Username, email and password are required.");
            return;
        }
        setLoading(true);
        try {
            const data = await api.register(username.trim(), email.trim(), password, "CUSTOMER");
            api.setToken(data.token);
            if (data.username) {
                try {
                    localStorage.setItem("user", JSON.stringify({ username: data.username, email: data.email, roles: data.roles || [] }));
                } catch (_) {}
            }
            setSuccess("Registration successful.");
            const to = api.getDashboardPath(data.roles || []);
            setTimeout(() => navigate(to), 800);
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box large">
                <h2 className="auth-title">Create Your Account</h2>

                <div className="stepper">
                    {[1, 2, 3, 4, 5].map((n, i) => (
                        <div className="stepper-item" key={n}>
                            <div className={`circle ${step >= n ? "active" : ""}`}>{n}</div>
                            {i !== 4 && (
                                <div className={`line ${step > n ? "active" : ""}`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <>
                        <h3>Personal Details</h3>

                        <div className="row">
                            <div className="field">
                                <label>First Name</label>
                                <input placeholder="Enter first name" />
                            </div>
                            <div className="field">
                                <label>Last Name</label>
                                <input placeholder="Enter last name" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label>Email Address</label>
                                <input type="email" placeholder="example@email.com" />
                            </div>
                            <div className="field">
                                <label>Phone Number</label>
                                <input placeholder="Enter phone number" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label>Gender</label>
                                <select>
                                    <option>Select</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Marital Status</label>
                                <select>
                                    <option>Select</option>
                                    <option>Single</option>
                                    <option>Married</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3>Academic Details</h3>

                        <div className="row">
                            <div className="field">
                                <label>Institute Name</label>
                                <input placeholder="University / College name" />
                            </div>
                            <div className="field">
                                <label>Degree</label>
                                <input placeholder="B.Tech / B.Sc / etc" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label>Passing Year</label>
                                <input placeholder="YYYY" />
                            </div>
                            <div className="field">
                                <label>Grade</label>
                                <input placeholder="A / B / C" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field field-single">
                                <label>Percentage</label>
                                <input placeholder="Enter percentage" />
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h3>Address Information</h3>

                        <div className="row">
                            <div className="field">
                                <label>Street Address</label>
                                <input placeholder="Street name" />
                            </div>
                            <div className="field">
                                <label>Plot No</label>
                                <input placeholder="Plot / Flat No" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label>City</label>
                                <input placeholder="City" />
                            </div>
                            <div className="field">
                                <label>State</label>
                                <input placeholder="State" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field field-single">
                                <label>Pincode</label>
                                <input placeholder="Postal code" />
                            </div>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <h3>Work Experience</h3>

                        <div className="row">
                            <div className="field">
                                <label>Company Name</label>
                                <input placeholder="Company / Cafe name" />
                            </div>
                            <div className="field">
                                <label>Address / Location</label>
                                <input placeholder="Address or location" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label>Start Date</label>
                                <input type="date" />
                            </div>
                            <div className="field">
                                <label>End Date</label>
                                <input type="date" />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field field-single">
                                <label>Package</label>
                                <input placeholder="Rs per annum" />
                            </div>
                        </div>
                    </>
                )}

                {step === 5 && (
                    <>
                        <h3>Account Security</h3>

                        <div className="row">
                            <div className="field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field field-single">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Choose a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="field field-identification">
                                <label>Identification</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const mb = file.size / (1024 * 1024);
                                            setIdentificationError(mb > MAX_FILE_MB ? `Max size ${MAX_FILE_MB} MB` : null);
                                            setIdentificationFile(file);
                                        } else {
                                            setIdentificationError(null);
                                            setIdentificationFile(null);
                                        }
                                    }}
                                />
                                <span className="field-hint">PDF or JPG, max 10 MB</span>
                                {identificationError && (
                                    <span className="field-error">{identificationError}</span>
                                )}
                            </div>
                        </div>

                        {error && (
                            <p className="field-error" style={{ marginTop: "0.5rem" }}>{error}</p>
                        )}
                        {success && (
                            <p className="field-success" style={{ marginTop: "0.5rem" }}>{success}</p>
                        )}
                    </>
                )}

                <div className="auth-actions">
                    {step > 1 && (
                        <button type="button" className="auth-btn secondary" onClick={() => setStep(step - 1)}>
                            Previous
                        </button>
                    )}
                    {step < 5 && (
                        <button type="button" className="auth-btn primary" onClick={() => setStep(step + 1)}>
                            Next
                        </button>
                    )}
                    {step === 5 && (
                        <button
                            type="button"
                            className="auth-btn primary"
                            onClick={handleRegister}
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Register"}
                        </button>
                    )}
                </div>

                <p className="login-link bottom">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const MAX_FILE_MB = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function FieldIcon({ children }) {
    return <span className="field-icon" aria-hidden="true">{children}</span>;
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0"></path>
            <circle cx="12" cy="8" r="4"></circle>
        </svg>
    );
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16v12H4z"></path>
            <path d="m4 8 8 6 8-6"></path>
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.78.68 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.34a2 2 0 0 1 2.11-.45c.84.33 1.72.56 2.62.68A2 2 0 0 1 22 16.92z"></path>
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"></rect>
            <path d="M8 11V8a4 4 0 1 1 8 0v3"></path>
        </svg>
    );
}

function AcademicIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 8 10-5 10 5-10 5-10-5Z"></path>
            <path d="M6 10.5v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"></path>
        </svg>
    );
}

function LocationIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"></path>
            <circle cx="12" cy="11" r="2.5"></circle>
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M16 3v4M8 3v4M3 10h18"></path>
        </svg>
    );
}

function MoneyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12"></path>
            <path d="M6 8h12"></path>
            <path d="M9 13h6a3 3 0 0 1 0 6H9"></path>
            <path d="M12 8v11"></path>
        </svg>
    );
}

function FloatingInput({
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    icon,
    error,
    success,
    autoComplete,
}) {
    const stateClass = error ? "has-error" : success ? "has-success" : "";
    const message = error || success;
    const messageClass = error ? "field-error" : "field-success";
    const typeClass = type === "date" ? "date-field" : "";

    return (
        <div className={`field floating-field ${stateClass} ${typeClass}`}>
            <div className="input-shell">
                {icon ? <FieldIcon>{icon}</FieldIcon> : null}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    autoComplete={autoComplete}
                />
                <label>{label}</label>
            </div>
            {message ? <span className={`input-status ${messageClass}`}>{message}</span> : null}
        </div>
    );
}

function FloatingSelect({
    label,
    value,
    onChange,
    icon,
    options,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const filledClass = value ? "is-filled" : "";
    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`field floating-field floating-select ${filledClass} ${open ? "is-open" : ""}`} ref={rootRef}>
            <div className="input-shell">
                {icon ? <FieldIcon>{icon}</FieldIcon> : null}
                <button
                    type="button"
                    className="floating-select-trigger"
                    onClick={() => setOpen((current) => !current)}
                    aria-expanded={open}
                >
                    <span>{selectedOption?.label || ""}</span>
                </button>
                <label>{label}</label>
            </div>
            {open ? (
                <div className="floating-select-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`floating-select-option ${option.value === value ? "is-selected" : ""}`}
                            onClick={() => {
                                onChange({ target: { value: option.value } });
                                setOpen(false);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default function RegistrationForm({
    roleValue,
    roleLabel,
    accentClass,
}) {
    const [step, setStep] = useState(1);
    const [identificationFile, setIdentificationFile] = useState(null);
    const [identificationError, setIdentificationError] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [instituteName, setInstituteName] = useState("");
    const [degree, setDegree] = useState("");
    const [passingYear, setPassingYear] = useState("");
    const [grade, setGrade] = useState("");
    const [percentage, setPercentage] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [plotNo, setPlotNo] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");
    const [pincode, setPincode] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [workLocation, setWorkLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [packageValue, setPackageValue] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const navigate = useNavigate();

    const touchField = (name) => {
        setTouched((current) => ({ ...current, [name]: true }));
    };

    const getUsernameError = () => {
        if (!username.trim()) return "Username is required.";
        if (username.trim().length < 3) return "Use at least 3 characters.";
        return "";
    };

    const getEmailError = () => {
        if (!email.trim()) return "Email is required.";
        if (!EMAIL_REGEX.test(email.trim())) return "Enter a valid email address.";
        return "";
    };

    const getPasswordError = () => {
        if (!password) return "Password is required.";
        if (password.length < 6) return "Use at least 6 characters.";
        return "";
    };

    const getPhoneError = () => {
        if (!phone.trim()) return "";
        if (!PHONE_REGEX.test(phone.trim())) return "Enter a valid 10-digit mobile number.";
        return "";
    };

    const usernameError = touched.username ? getUsernameError() : "";
    const emailError = touched.email ? getEmailError() : "";
    const passwordError = touched.password ? getPasswordError() : "";
    const phoneError = touched.phone ? getPhoneError() : "";

    const handleRegister = async () => {
        setError("");
        setSuccess("");
        setTouched((current) => ({
            ...current,
            username: true,
            email: true,
            password: true,
            phone: true,
        }));
        if (getUsernameError() || getEmailError() || getPasswordError() || getPhoneError()) {
            setError("Fix the highlighted fields before continuing.");
            return;
        }
        if (identificationError) {
            setError("Fix the identification file before continuing.");
            return;
        }
        setLoading(true);
        try {
            const data = await api.register(username.trim(), email.trim(), password, roleValue);
            api.setToken(data.token);
            if (data.username) {
                try {
                    localStorage.setItem("user", JSON.stringify({
                        username: data.username,
                        email: data.email,
                        roles: data.roles || [],
                    }));
                } catch (_) {}
            }
            setSuccess(`${roleLabel} registration successful.`);
            const to = api.getDashboardPath(data.roles || []);
            setTimeout(() => navigate(to), 800);
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container registration-shell">
            <div className={`registration-layout ${accentClass || ""}`}>
                <aside className="registration-brand-panel">
                    <div className="registration-brand-copy">
                        <p className="registration-brand-kicker">Bean To Cup</p>
                        <p className="registration-brand-role">{roleLabel} Registration</p>
                        <h2 className="registration-brand-title">Create {roleLabel} Account</h2>
                        <h1>Fresh ideas start over coffee.</h1>
                        <p>
                            {roleLabel === "Cafe Owner"
                                ? "Open your operations workspace with a polished owner onboarding flow built for menu, staff, and table control."
                                : "Join the cafe experience with quick account access, table ordering, and digital checkout in one place."}
                        </p>
                    </div>
                    <div className="registration-brand-art" aria-hidden="true">
                        <div className="coffee-card coffee-card-main">
                            <span className="coffee-card-label">Coffee Journal</span>
                            <strong>{roleLabel}</strong>
                            <small>Brewing a better digital experience</small>
                        </div>
                        <div className="coffee-cup coffee-cup-large">
                            <span className="coffee-foam"></span>
                        </div>
                        <div className="coffee-bean coffee-bean-one"></div>
                        <div className="coffee-bean coffee-bean-two"></div>
                        <div className="coffee-ring"></div>
                    </div>
                </aside>

                <div className="registration-form-column">
                    <div className={`auth-box large registration-box ${accentClass || ""}`}>
                        <div className="registration-header">
                            <button
                                type="button"
                                className="registration-back-btn"
                                onClick={() => navigate("/select-registration-type")}
                            >
                                Back
                            </button>
                        </div>

                        <input type="hidden" value={roleValue} readOnly />

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
                                    <FloatingInput
                                        label="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        icon={<UserIcon />}
                                        autoComplete="given-name"
                                    />
                                    <FloatingInput
                                        label="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        icon={<UserIcon />}
                                        autoComplete="family-name"
                                    />
                                </div>

                                <div className="row">
                                    <FloatingInput
                                        label="Email Address"
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        icon={<MailIcon />}
                                        autoComplete="email"
                                    />
                                    <FloatingInput
                                        label="Phone Number"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onBlur={() => touchField("phone")}
                                        icon={<PhoneIcon />}
                                        error={phoneError}
                                        success={touched.phone && !phoneError && phone.trim() ? "Mobile number looks valid." : ""}
                                        autoComplete="tel"
                                    />
                                </div>

                                <div className="row">
                                    <FloatingSelect
                                        label="Gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        icon={<UserIcon />}
                                        options={[
                                            { value: "male", label: "Male" },
                                            { value: "female", label: "Female" },
                                            { value: "other", label: "Other" },
                                        ]}
                                    />
                                    <FloatingSelect
                                        label="Marital Status"
                                        value={maritalStatus}
                                        onChange={(e) => setMaritalStatus(e.target.value)}
                                        icon={<UserIcon />}
                                        options={[
                                            { value: "single", label: "Single" },
                                            { value: "married", label: "Married" },
                                        ]}
                                    />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h3>Academic Details</h3>

                                <div className="row">
                                    <FloatingInput
                                        label="Institute Name"
                                        value={instituteName}
                                        onChange={(e) => setInstituteName(e.target.value)}
                                        icon={<AcademicIcon />}
                                    />
                                    <FloatingInput
                                        label="Degree"
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        icon={<AcademicIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <FloatingInput
                                        label="Passing Year"
                                        value={passingYear}
                                        onChange={(e) => setPassingYear(e.target.value)}
                                        icon={<CalendarIcon />}
                                    />
                                    <FloatingInput
                                        label="Grade"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        icon={<AcademicIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <div className="field field-single">
                                        <FloatingInput
                                            label="Percentage"
                                            value={percentage}
                                            onChange={(e) => setPercentage(e.target.value)}
                                            icon={<AcademicIcon />}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <h3>Address Information</h3>

                                <div className="row">
                                    <FloatingInput
                                        label="Street Address"
                                        value={streetAddress}
                                        onChange={(e) => setStreetAddress(e.target.value)}
                                        icon={<LocationIcon />}
                                    />
                                    <FloatingInput
                                        label="Plot No"
                                        value={plotNo}
                                        onChange={(e) => setPlotNo(e.target.value)}
                                        icon={<LocationIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <FloatingInput
                                        label="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        icon={<LocationIcon />}
                                    />
                                    <FloatingInput
                                        label="State"
                                        value={stateName}
                                        onChange={(e) => setStateName(e.target.value)}
                                        icon={<LocationIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <div className="field field-single">
                                        <FloatingInput
                                            label="Pincode"
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value)}
                                            icon={<LocationIcon />}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <h3>Work Experience</h3>

                                <div className="row">
                                    <FloatingInput
                                        label="Company Name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        icon={<AcademicIcon />}
                                    />
                                    <FloatingInput
                                        label="Address / Location"
                                        value={workLocation}
                                        onChange={(e) => setWorkLocation(e.target.value)}
                                        icon={<LocationIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <FloatingInput
                                        label="Start Date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        icon={<CalendarIcon />}
                                    />
                                    <FloatingInput
                                        label="End Date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        icon={<CalendarIcon />}
                                    />
                                </div>

                                <div className="row">
                                    <div className="field field-single">
                                        <FloatingInput
                                            label="Package"
                                            value={packageValue}
                                            onChange={(e) => setPackageValue(e.target.value)}
                                            icon={<MoneyIcon />}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 5 && (
                            <>
                                <h3>Account Security</h3>

                                <div className="row">
                                    <FloatingInput
                                        label="Username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onBlur={() => touchField("username")}
                                        icon={<UserIcon />}
                                        error={usernameError}
                                        success={touched.username && !usernameError && username.trim() ? "Username looks good." : ""}
                                        autoComplete="username"
                                    />
                                    <FloatingInput
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => touchField("email")}
                                        icon={<MailIcon />}
                                        error={emailError}
                                        success={touched.email && !emailError && email.trim() ? "Email format looks valid." : ""}
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="row">
                                    <div className="field field-single">
                                        <FloatingInput
                                            label="Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => touchField("password")}
                                            icon={<LockIcon />}
                                            error={passwordError}
                                            success={touched.password && !passwordError && password ? "Password strength is acceptable." : ""}
                                            autoComplete="new-password"
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
                                        <span className="field-hint">
                                            PDF or JPG, max 10 MB
                                            {identificationFile ? ` - ${identificationFile.name}` : ""}
                                        </span>
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
                                    {loading ? "Registering..." : `Register as ${roleLabel}`}
                                </button>
                            )}
                        </div>

                        <p className="login-link bottom">
                            Already have an account? <Link to="/login">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

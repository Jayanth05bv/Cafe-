import { useMemo, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const ROLE_OPTIONS = [
    {
        value: "WAITER",
        title: "Waiter Registration",
        shortLabel: "Waiter",
        description: "Create a waiter account for table service, customer requests, and order handling on the floor.",
        icon: "🧑‍🍽",
        accentClass: "waiter",
    },
    {
        value: "CHEF",
        title: "Chef Registration",
        shortLabel: "Chef",
        description: "Create a chef account for kitchen order execution, preparation workflow, and food readiness updates.",
        icon: "👨‍🍳",
        accentClass: "chef",
    },
];

const INITIAL_FORM = {
    firstName: "",
    lastName: "",
    contactEmail: "",
    phone: "",
    gender: "",
    maritalStatus: "",
    instituteName: "",
    degree: "",
    passingYear: "",
    grade: "",
    percentage: "",
    street: "",
    plotNo: "",
    city: "",
    stateRegion: "",
    pincode: "",
    companyName: "",
    companyLocation: "",
    startDate: "",
    endDate: "",
    packageAmount: "",
    username: "",
    email: "",
    password: "",
};

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

function FloatingSelect({ label, value, onChange, icon, options }) {
    const filledClass = value ? "is-filled" : "";
    return (
        <div className={`field floating-field ${filledClass}`}>
            <div className="input-shell">
                {icon ? <FieldIcon>{icon}</FieldIcon> : null}
                <select value={value} onChange={onChange} className="owner-staff-native-select">
                    <option value=""></option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <label>{label}</label>
            </div>
        </div>
    );
}

export default function OwnerStaffRegistrationPanel({ onSubmit, loading }) {
    const [selectedRole, setSelectedRole] = useState("");
    const [roleConfirmed, setRoleConfirmed] = useState(false);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(INITIAL_FORM);
    const [identificationFile, setIdentificationFile] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [touched, setTouched] = useState({});

    const selectedRoleMeta = useMemo(
        () => ROLE_OPTIONS.find((option) => option.value === selectedRole),
        [selectedRole]
    );

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const touchField = (name) => {
        setTouched((current) => ({ ...current, [name]: true }));
    };

    const usernameError = touched.username
        ? (!form.username.trim() ? "Username is required." : form.username.trim().length < 3 ? "Use at least 3 characters." : "")
        : "";
    const emailError = touched.email
        ? (!form.email.trim() ? "Email is required." : !EMAIL_REGEX.test(form.email.trim()) ? "Enter a valid email address." : "")
        : "";
    const passwordError = touched.password
        ? (!form.password ? "Password is required." : form.password.length < 6 ? "Use at least 6 characters." : "")
        : "";
    const phoneError = touched.phone && form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())
        ? "Enter a valid 10-digit mobile number."
        : "";

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setStep(1);
        setRoleConfirmed(false);
        setForm(INITIAL_FORM);
        setTouched({});
        setIdentificationFile(null);
        setError("");
        setSuccess("");
    };

    const submitForm = async () => {
        setTouched((current) => ({
            ...current,
            username: true,
            email: true,
            password: true,
            phone: true,
        }));
        if (!selectedRole) {
            setError("Choose a role before creating a staff account.");
            return;
        }
        if (usernameError || emailError || passwordError || phoneError) {
            setError("Fix the highlighted fields before continuing.");
            return;
        }
        if (!form.firstName.trim() || !form.lastName.trim() || !form.username.trim() || !form.email.trim() || !form.password) {
            setError("Fill first name, last name, username, email, and password.");
            return;
        }
        setError("");
        setSuccess("");
        try {
            await onSubmit({
                role: selectedRole,
                identificationName: identificationFile?.name || "",
                ...form,
            });
            setSuccess(`${selectedRoleMeta?.shortLabel || "Staff"} account created.`);
            resetForm();
            setSelectedRole("");
        } catch (err) {
            setError(err.message || "Failed to create staff account");
        }
    };

    if (!roleConfirmed) {
        return (
            <div className="owner-staff-registration">
                <div className="owner-staff-registration-head">
                    <p className="registration-type-kicker">Staff Registration</p>
                    <h3>Select staff account type</h3>
                    <p className="panel-meta">Choose whether you want to onboard a waiter or a chef. The next screen uses the same structured registration flow.</p>
                </div>
                <div className="owner-staff-role-grid">
                    {ROLE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`owner-staff-role-card owner-staff-role-card-${option.accentClass} ${selectedRole === option.value ? "is-selected" : ""}`}
                            onClick={() => handleSelectRole(option.value)}
                        >
                            <div className="owner-staff-role-icon">{option.icon}</div>
                            <div className="owner-staff-role-copy">
                                <strong>{option.title}</strong>
                                <span>{option.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="owner-staff-role-footer">
                    <button
                        type="button"
                        className="owner-staff-proceed-btn"
                        disabled={!selectedRole}
                        onClick={() => {
                            if (!selectedRole) {
                                setError("Choose a role before continuing.");
                                return;
                            }
                            setRoleConfirmed(true);
                            setStep(1);
                            setError("");
                        }}
                    >
                        Proceed
                    </button>
                </div>
                {error ? <p className="field-error">{error}</p> : null}
            </div>
        );
    }

    return (
        <div className="owner-staff-registration owner-staff-form-shell">
            <div className={`owner-staff-brand owner-staff-brand-${selectedRoleMeta.accentClass}`}>
                <p className="registration-brand-kicker">Cafe Team</p>
                <p className="registration-brand-role">{selectedRoleMeta.title}</p>
                <h2 className="registration-brand-title">Create {selectedRoleMeta.shortLabel} Account</h2>
                <p>Collect personal details, background information, and secure login credentials in one clean onboarding flow.</p>
            </div>

            <div className="owner-staff-form-card">
                <div className="registration-header">
                    <button
                        type="button"
                        className="registration-back-btn"
                        onClick={() => {
                            setRoleConfirmed(false);
                            setStep(1);
                            setError("");
                        }}
                    >
                        Back
                    </button>
                </div>

                <div className="stepper">
                    {[1, 2, 3, 4, 5].map((n, i) => (
                        <div className="stepper-item" key={n}>
                            <div className={`circle ${step >= n ? "active" : ""}`}>{n}</div>
                            {i !== 4 && <div className={`line ${step > n ? "active" : ""}`}></div>}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <>
                        <h3>Personal Details</h3>
                        <div className="row">
                            <FloatingInput label="First Name" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} icon={<UserIcon />} />
                            <FloatingInput label="Last Name" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} icon={<UserIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Email Address" type="email" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} icon={<MailIcon />} />
                            <FloatingInput label="Phone Number" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} onBlur={() => touchField("phone")} icon={<PhoneIcon />} error={phoneError} success={touched.phone && !phoneError && form.phone.trim() ? "Mobile number looks valid." : ""} />
                        </div>
                        <div className="row">
                            <FloatingSelect
                                label="Gender"
                                value={form.gender}
                                onChange={(e) => updateField("gender", e.target.value)}
                                icon={<UserIcon />}
                                options={[
                                    { value: "Male", label: "Male" },
                                    { value: "Female", label: "Female" },
                                    { value: "Other", label: "Other" },
                                ]}
                            />
                            <FloatingSelect
                                label="Marital Status"
                                value={form.maritalStatus}
                                onChange={(e) => updateField("maritalStatus", e.target.value)}
                                icon={<UserIcon />}
                                options={[
                                    { value: "Single", label: "Single" },
                                    { value: "Married", label: "Married" },
                                ]}
                            />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3>Academic Details</h3>
                        <div className="row">
                            <FloatingInput label="Institute Name" value={form.instituteName} onChange={(e) => updateField("instituteName", e.target.value)} icon={<AcademicIcon />} />
                            <FloatingInput label="Degree" value={form.degree} onChange={(e) => updateField("degree", e.target.value)} icon={<AcademicIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Passing Year" value={form.passingYear} onChange={(e) => updateField("passingYear", e.target.value)} icon={<CalendarIcon />} />
                            <FloatingInput label="Grade" value={form.grade} onChange={(e) => updateField("grade", e.target.value)} icon={<AcademicIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Percentage" value={form.percentage} onChange={(e) => updateField("percentage", e.target.value)} icon={<AcademicIcon />} />
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h3>Address Information</h3>
                        <div className="row">
                            <FloatingInput label="Street Address" value={form.street} onChange={(e) => updateField("street", e.target.value)} icon={<LocationIcon />} />
                            <FloatingInput label="Plot / Flat No" value={form.plotNo} onChange={(e) => updateField("plotNo", e.target.value)} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} icon={<LocationIcon />} />
                            <FloatingInput label="State" value={form.stateRegion} onChange={(e) => updateField("stateRegion", e.target.value)} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Pincode" value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} icon={<LocationIcon />} />
                            </div>
                        </div>
                    </>
                )}

                {step === 4 && (
                    <>
                        <h3>Work Experience</h3>
                        <div className="row">
                            <FloatingInput label="Company Name" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} icon={<AcademicIcon />} />
                            <FloatingInput label="Address / Location" value={form.companyLocation} onChange={(e) => updateField("companyLocation", e.target.value)} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Start Date" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} icon={<CalendarIcon />} />
                            <FloatingInput label="End Date" type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} icon={<CalendarIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Package" value={form.packageAmount} onChange={(e) => updateField("packageAmount", e.target.value)} icon={<MoneyIcon />} />
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
                                value={form.username}
                                onChange={(e) => updateField("username", e.target.value)}
                                onBlur={() => touchField("username")}
                                icon={<UserIcon />}
                                error={usernameError}
                                success={touched.username && !usernameError && form.username.trim() ? "Username looks good." : ""}
                            />
                            <FloatingInput
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                onBlur={() => touchField("email")}
                                icon={<MailIcon />}
                                error={emailError}
                                success={touched.email && !emailError && form.email.trim() ? "Email format looks valid." : ""}
                            />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput
                                    label="Password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => updateField("password", e.target.value)}
                                    onBlur={() => touchField("password")}
                                    icon={<LockIcon />}
                                    error={passwordError}
                                    success={touched.password && !passwordError && form.password ? "Password strength is acceptable." : ""}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="field field-identification">
                                <label>Identification</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setIdentificationFile(e.target.files?.[0] || null)}
                                />
                                <span className="field-hint">
                                    PDF, JPG or PNG
                                    {identificationFile ? ` - ${identificationFile.name}` : ""}
                                </span>
                            </div>
                        </div>
                        {error && <p className="field-error" style={{ marginTop: "0.5rem" }}>{error}</p>}
                        {success && <p className="field-success" style={{ marginTop: "0.5rem" }}>{success}</p>}
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
                        <button type="button" className="auth-btn primary" onClick={submitForm} disabled={loading}>
                            {loading ? "Creating..." : `Create ${selectedRoleMeta.shortLabel} Account`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

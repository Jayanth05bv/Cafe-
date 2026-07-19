import { useState } from "react";

const MAX_FILE_MB = 10;

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

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"></rect>
            <path d="M8 11V8a4 4 0 1 1 8 0v3"></path>
        </svg>
    );
}

function FloatingInput({ label, name, type = "text", value, onChange, icon, readOnly, disabled }) {
    const typeClass = type === "date" ? "date-field" : "";

    return (
        <div className={`field floating-field ${typeClass}`}>
            <div className="input-shell">
                {icon ? <FieldIcon>{icon}</FieldIcon> : null}
                <input
                    type={type}
                    name={name}
                    placeholder=" "
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    disabled={disabled}
                />
                <label>{label}</label>
            </div>
        </div>
    );
}

function FloatingSelect({ label, name, value, onChange, icon, options }) {
    return (
        <div className={`field floating-field customer-floating-select ${value ? "is-filled" : ""}`}>
            <div className="input-shell">
                {icon ? <FieldIcon>{icon}</FieldIcon> : null}
                <select name={name} value={value} onChange={onChange}>
                    <option value="" disabled hidden></option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <label>{label}</label>
            </div>
        </div>
    );
}

export default function CustomerProfileForm({
    profileForm,
    setProfileForm,
    savingProfile,
    onSave,
    title = "Update profile",
    description = "You can update all your customer details here except your email address.",
}) {
    const [profileStep, setProfileStep] = useState(1);
    const [identificationError, setIdentificationError] = useState("");

    const handleProfileChange = (event) => {
        const { name, value } = event.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleIdentificationChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setIdentificationError("");
            return;
        }
        const mb = file.size / (1024 * 1024);
        if (mb > MAX_FILE_MB) {
            setIdentificationError(`Max size ${MAX_FILE_MB} MB`);
            return;
        }
        setIdentificationError("");
        setProfileForm((prev) => ({
            ...prev,
            identificationFileName: file.name,
        }));
    };

    const renderFileField = () => (
        <div className="row">
            <div className="field field-single customer-profile-upload-field">
                <label>Identification</label>
                <input type="file" accept=".pdf,.jpg,.jpeg" onChange={handleIdentificationChange} />
                <span className="field-hint">PDF or JPG, max 10 MB</span>
                {profileForm.identificationFileName && (
                    <span className="field-hint">Current file: {profileForm.identificationFileName}</span>
                )}
                {identificationError && <span className="field-error">{identificationError}</span>}
            </div>
        </div>
    );

    return (
        <div className="admin-panel owner-panel auth-box large registration-box customer-profile-registration">
            <h3>{title}</h3>
            <p className="panel-meta">
                {description}
            </p>
            <form className="customer-profile-form" onSubmit={(event) => onSave(event, identificationError)}>
                <div className="stepper">
                    {[1, 2, 3, 4, 5].map((n, i) => (
                        <div className="stepper-item" key={n}>
                            <div className={`circle ${profileStep >= n ? "active" : ""}`}>{n}</div>
                            {i !== 4 && <div className={`line ${profileStep > n ? "active" : ""}`}></div>}
                        </div>
                    ))}
                </div>

                {profileStep === 1 && (
                    <>
                        <h4>Personal Details</h4>
                        <div className="row">
                            <FloatingInput label="First Name" name="firstName" value={profileForm.firstName} onChange={handleProfileChange} icon={<UserIcon />} />
                            <FloatingInput label="Last Name" name="lastName" value={profileForm.lastName} onChange={handleProfileChange} icon={<UserIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Email Address" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} icon={<MailIcon />} readOnly disabled />
                            <FloatingInput label="Phone Number" name="phone" value={profileForm.phone} onChange={handleProfileChange} icon={<PhoneIcon />} />
                        </div>
                        <div className="row">
                            <FloatingSelect label="Gender" name="gender" value={profileForm.gender} onChange={handleProfileChange} icon={<UserIcon />} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
                            <FloatingSelect label="Marital Status" name="maritalStatus" value={profileForm.maritalStatus} onChange={handleProfileChange} icon={<UserIcon />} options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }]} />
                        </div>
                    </>
                )}

                {profileStep === 2 && (
                    <>
                        <h4>Academic Details</h4>
                        <div className="row">
                            <FloatingInput label="Institute Name" name="instituteName" value={profileForm.instituteName} onChange={handleProfileChange} icon={<AcademicIcon />} />
                            <FloatingInput label="Degree" name="degree" value={profileForm.degree} onChange={handleProfileChange} icon={<AcademicIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Passing Year" name="passingYear" value={profileForm.passingYear} onChange={handleProfileChange} icon={<CalendarIcon />} />
                            <FloatingInput label="Grade" name="grade" value={profileForm.grade} onChange={handleProfileChange} icon={<AcademicIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Percentage" name="percentage" value={profileForm.percentage} onChange={handleProfileChange} icon={<AcademicIcon />} />
                            </div>
                        </div>
                    </>
                )}

                {profileStep === 3 && (
                    <>
                        <h4>Address Information</h4>
                        <div className="row">
                            <FloatingInput label="Street Address" name="streetAddress" value={profileForm.streetAddress} onChange={handleProfileChange} icon={<LocationIcon />} />
                            <FloatingInput label="Plot No" name="plotNo" value={profileForm.plotNo} onChange={handleProfileChange} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="City" name="city" value={profileForm.city} onChange={handleProfileChange} icon={<LocationIcon />} />
                            <FloatingInput label="State" name="state" value={profileForm.state} onChange={handleProfileChange} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Pincode" name="pincode" value={profileForm.pincode} onChange={handleProfileChange} icon={<LocationIcon />} />
                            </div>
                        </div>
                    </>
                )}

                {profileStep === 4 && (
                    <>
                        <h4>Work Experience</h4>
                        <div className="row">
                            <FloatingInput label="Company Name" name="companyName" value={profileForm.companyName} onChange={handleProfileChange} icon={<UserIcon />} />
                            <FloatingInput label="Address / Location" name="workLocation" value={profileForm.workLocation} onChange={handleProfileChange} icon={<LocationIcon />} />
                        </div>
                        <div className="row">
                            <FloatingInput label="Start Date" name="startDate" type="date" value={profileForm.startDate || ""} onChange={handleProfileChange} icon={<CalendarIcon />} />
                            <FloatingInput label="End Date" name="endDate" type="date" value={profileForm.endDate || ""} onChange={handleProfileChange} icon={<CalendarIcon />} />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Package" name="compensationPackage" value={profileForm.compensationPackage} onChange={handleProfileChange} icon={<MoneyIcon />} />
                            </div>
                        </div>
                    </>
                )}

                {profileStep === 5 && (
                    <>
                        <h4>Account Security</h4>
                        <div className="row">
                            <FloatingInput label="Username" name="username" value={profileForm.username} onChange={handleProfileChange} icon={<UserIcon />} />
                            <FloatingInput label="Email" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} icon={<MailIcon />} readOnly disabled />
                        </div>
                        <div className="row">
                            <div className="field field-single">
                                <FloatingInput label="Password" name="password" type="password" value={profileForm.password} onChange={handleProfileChange} icon={<LockIcon />} />
                            </div>
                        </div>
                        {renderFileField()}
                        <div className="row">
                            <div className="field field-single">
                                <label>Additional Details</label>
                                <textarea name="additionalDetails" rows={4} value={profileForm.additionalDetails} onChange={handleProfileChange} placeholder="Any extra details you want to keep in your profile" />
                            </div>
                        </div>
                    </>
                )}

                <div className="customer-profile-actions">
                    {profileStep > 1 && (
                        <button type="button" className="auth-btn secondary" onClick={() => setProfileStep((prev) => prev - 1)}>
                            Previous
                        </button>
                    )}
                    {profileStep < 5 && (
                        <button type="button" className="auth-btn primary" onClick={() => setProfileStep((prev) => prev + 1)}>
                            Next
                        </button>
                    )}
                    {profileStep === 5 && (
                        <button type="submit" className="auth-btn primary" disabled={savingProfile || !!identificationError}>
                            {savingProfile ? "Saving..." : "Save profile"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

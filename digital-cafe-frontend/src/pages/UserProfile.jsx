import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerProfileForm from "../components/CustomerProfileForm";
import CustomerSidebarActions from "../components/CustomerSidebarActions";
import { api } from "../api";

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Customer", roles: ["CUSTOMER"] };
    } catch {
        return { username: "Customer", roles: ["CUSTOMER"] };
    }
}

const emptyProfile = {
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    fullName: "",
    phone: "",
    gender: "",
    maritalStatus: "",
    instituteName: "",
    degree: "",
    passingYear: "",
    grade: "",
    percentage: "",
    streetAddress: "",
    plotNo: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    companyName: "",
    workLocation: "",
    startDate: "",
    endDate: "",
    compensationPackage: "",
    workExperience: "",
    identificationFileName: "",
    additionalDetails: "",
    password: "",
};

export default function UserProfile() {
    const user = getStoredUser();
    const role = (() => {
        const r = user.roles?.[0];
        return typeof r === "string" ? r : (r?.name || "CUSTOMER");
    })();
    const [profileForm, setProfileForm] = useState(emptyProfile);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setLoadingProfile(true);
        api.getCustomerMe()
            .then((profile) => {
                setProfileForm({
                    username: profile.username || "",
                    email: profile.email || "",
                    firstName: profile.firstName || "",
                    lastName: profile.lastName || "",
                    fullName: profile.fullName || "",
                    phone: profile.phone || "",
                    gender: profile.gender || "",
                    maritalStatus: profile.maritalStatus || "",
                    instituteName: profile.instituteName || "",
                    degree: profile.degree || "",
                    passingYear: profile.passingYear || "",
                    grade: profile.grade || "",
                    percentage: profile.percentage || "",
                    streetAddress: profile.streetAddress || "",
                    plotNo: profile.plotNo || "",
                    city: profile.city || "",
                    state: profile.state || "",
                    pincode: profile.pincode || "",
                    address: profile.address || "",
                    companyName: profile.companyName || "",
                    workLocation: profile.workLocation || "",
                    startDate: profile.startDate || "",
                    endDate: profile.endDate || "",
                    compensationPackage: profile.compensationPackage || "",
                    workExperience: profile.workExperience || "",
                    identificationFileName: profile.identificationFileName || "",
                    additionalDetails: profile.additionalDetails || "",
                    password: "",
                });
            })
            .catch((err) => setMessage(err.message || "Failed to load profile."))
            .finally(() => setLoadingProfile(false));
    }, []);

    const handleSaveProfile = async (event, identificationError) => {
        event.preventDefault();
        if (identificationError) return;
        setSavingProfile(true);
        setMessage("");
        try {
            const updated = await api.updateCustomerMe({
                ...profileForm,
                fullName: profileForm.fullName || [profileForm.firstName, profileForm.lastName].filter(Boolean).join(" ").trim(),
                address: profileForm.address || [
                    profileForm.streetAddress,
                    profileForm.plotNo,
                    profileForm.city,
                    profileForm.state,
                    profileForm.pincode,
                ].filter(Boolean).join(", "),
                workExperience: profileForm.workExperience || [
                    profileForm.companyName,
                    profileForm.workLocation,
                    profileForm.compensationPackage,
                ].filter(Boolean).join(", "),
                password: profileForm.password || undefined,
            });
            setProfileForm({
                username: updated.username || "",
                email: updated.email || "",
                firstName: updated.firstName || "",
                lastName: updated.lastName || "",
                fullName: updated.fullName || "",
                phone: updated.phone || "",
                gender: updated.gender || "",
                maritalStatus: updated.maritalStatus || "",
                instituteName: updated.instituteName || "",
                degree: updated.degree || "",
                passingYear: updated.passingYear || "",
                grade: updated.grade || "",
                percentage: updated.percentage || "",
                streetAddress: updated.streetAddress || "",
                plotNo: updated.plotNo || "",
                city: updated.city || "",
                state: updated.state || "",
                pincode: updated.pincode || "",
                address: updated.address || "",
                companyName: updated.companyName || "",
                workLocation: updated.workLocation || "",
                startDate: updated.startDate || "",
                endDate: updated.endDate || "",
                compensationPackage: updated.compensationPackage || "",
                workExperience: updated.workExperience || "",
                identificationFileName: updated.identificationFileName || "",
                additionalDetails: updated.additionalDetails || "",
                password: "",
            });

            try {
                const rawUser = localStorage.getItem("user");
                const parsed = rawUser ? JSON.parse(rawUser) : {};
                localStorage.setItem("user", JSON.stringify({
                    ...parsed,
                    username: updated.username || parsed.username,
                    email: updated.email || parsed.email,
                    fullName: updated.fullName || parsed.fullName,
                }));
            } catch {
                // Ignore local user cache parse failures.
            }

            setMessage("Profile updated successfully.");
        } catch (err) {
            setMessage(err.message || "Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <DashboardLayout
            title={user.username}
            role={role}
            userEmail={user.email}
            sidebarExtra={<CustomerSidebarActions />}
        >
            <div className="dashboard dashboard-user">
                <h1 className="dashboard-title">Update profile</h1>
                {message && <p className="panel-message" style={{ marginTop: 16 }}>{message}</p>}

                <div className="chart-container" style={{ marginBottom: 24 }}>
                    <h3>Security</h3>
                    <p>Reset your password if you think your account has been compromised or you forgot it.</p>
                    <Link
                        to="/forgot-password"
                        className="admin-btn-link"
                        state={user.email ? { email: user.email } : undefined}
                    >
                        Reset password
                    </Link>
                </div>

                {loadingProfile ? (
                    <div className="chart-container">
                        <p className="empty-msg">Loading profile...</p>
                    </div>
                ) : (
                    <CustomerProfileForm
                        profileForm={profileForm}
                        setProfileForm={setProfileForm}
                        savingProfile={savingProfile}
                        onSave={handleSaveProfile}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

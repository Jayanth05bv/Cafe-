import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

const OWNER_SELECTED_CAFE_KEY = "ownerSelectedCafeId";

function getStoredUser() {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : { username: "Owner", roles: ["OWNER"] };
    } catch {
        return { username: "Owner", roles: ["OWNER"] };
    }
}

function getPrimaryImage(imageUrls) {
    return (imageUrls || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)[0] || "";
}

function getCafeLocationLabel(address) {
    if (!address) return "No location";
    const parts = String(address)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "No location";
}

export default function OwnerCafeSelect() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const [loading, setLoading] = useState(true);
    const [cafes, setCafes] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setLoading(true);
        api.getOwnerMe()
            .then((me) => {
                const assignedCafes = Array.isArray(me?.cafes) && me.cafes.length > 0
                    ? me.cafes
                    : me?.cafe ? [me.cafe] : [];
                setCafes(assignedCafes);
                if (assignedCafes.length === 0) {
                    localStorage.removeItem(OWNER_SELECTED_CAFE_KEY);
                    setMessage("No cafes are assigned to this owner yet.");
                }
            })
            .catch((err) => {
                setCafes([]);
                setMessage(err.message || "Failed to load assigned cafes.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSelectCafe = (cafeId) => {
        localStorage.setItem(OWNER_SELECTED_CAFE_KEY, String(cafeId));
        navigate("/owner");
    };

    return (
        <DashboardLayout title={user.username} role="OWNER" userEmail={user.email}>
            <div className="dashboard owner-dashboard">
                <h1 className="dashboard-title">Select Cafe</h1>
                <div className="chart-container owner-assigned-cafes-panel">
                    <div className="owner-assigned-cafes-head">
                        <div>
                            <h3>Assigned Cafes</h3>
                            <p>Choose a cafe to open its owner workspace.</p>
                        </div>
                        <span className="owner-assigned-cafes-count">{cafes.length} cafes</span>
                    </div>

                    {loading ? (
                        <p className="empty-msg" style={{ marginTop: 12 }}>Loading assigned cafes...</p>
                    ) : cafes.length === 0 ? (
                        <p className="empty-msg" style={{ marginTop: 12 }}>{message || "No cafes assigned to this owner yet."}</p>
                    ) : (
                        <div className="customer-cafe-grid owner-assigned-cafe-grid">
                            {cafes.map((assignedCafe) => {
                                const primaryImage = getPrimaryImage(assignedCafe.imageUrls || assignedCafe.logoUrl || "");
                                return (
                                    <article
                                        key={assignedCafe.id}
                                        className="customer-cafe-card owner-assigned-cafe-card"
                                    >
                                        <div className="customer-cafe-media owner-assigned-cafe-media">
                                            {primaryImage ? (
                                                <img
                                                    src={primaryImage}
                                                    alt={assignedCafe.name}
                                                    className="customer-cafe-main-image"
                                                />
                                            ) : (
                                                <div className="owner-assigned-cafe-placeholder">
                                                    <span>{String(assignedCafe.name || "C").charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="customer-cafe-content">
                                            <h4>{assignedCafe.name}</h4>
                                            <p>{getCafeLocationLabel(assignedCafe.address)}</p>
                                            <div className="customer-cafe-meta">
                                                <span>{assignedCafe.address || "Address not added"}</span>
                                                <span>{assignedCafe.phone || "Phone not added"}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="execute-btn"
                                                onClick={() => handleSelectCafe(assignedCafe.id)}
                                            >
                                                Open cafe dashboard
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

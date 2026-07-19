import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Owner", roles: ["OWNER"] };
    } catch {
        return { username: "Owner", roles: ["OWNER"] };
    }
}

export default function OwnerAccept() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const user = getStoredUser();

    useEffect(() => {
        api.getOwnerMe()
            .then(setMe)
            .catch(() => setMe(null))
            .finally(() => setLoading(false));
    }, []);

    const handleAccept = async () => {
        setSubmitting(true);
        setMessage("");
        try {
            await api.acceptOwnerAssignment();
            setMessage("Assignment accepted. Redirecting to your dashboard…");
            setTimeout(() => navigate("/owner"), 1500);
        } catch (err) {
            setMessage(err.message || "Failed to accept");
            setSubmitting(false);
        }
    };

    const hasCafe = me?.cafe != null;
    const needsAccept = hasCafe && !me?.ownerAssignmentAccepted;

    return (
        <DashboardLayout title={user.username} role="OWNER">
            <div className="dashboard owner-dashboard">
                <h1 className="dashboard-title">Accept assignment</h1>
                {loading && <p className="panel-meta">Loading…</p>}
                {!loading && !me && (
                    <>
                        <p className="panel-message owner-msg">Could not load your profile. Please log in again.</p>
                        <div className="admin-panel owner-panel owner-accept-info">
                            <h3>About accepting chefs and waiters</h3>
                            <p className="panel-meta">As an owner, once you are assigned to a cafe and accept that assignment here, you can add <strong>chefs</strong> and <strong>waiters</strong> from your Dashboard.</p>
                            <ul className="owner-accept-steps">
                                <li>An administrator assigns you to a cafe (Admin → Owners &amp; Cafes).</li>
                                <li>You accept the assignment on this page.</li>
                                <li>From your Dashboard, use the Staff section to create chef and waiter accounts. They can log in with the credentials you set.</li>
                            </ul>
                            <button type="button" className="execute-btn" onClick={() => navigate("/login")}>
                                Log in again
                            </button>
                        </div>
                    </>
                )}
                {!loading && me && !hasCafe && (
                    <div className="admin-panel owner-panel">
                        <p className="panel-meta">You have no cafe assignment yet. An administrator can assign you to a cafe from the Admin dashboard (Owners &amp; Cafes).</p>
                        <div className="admin-panel owner-panel owner-accept-info" style={{ marginTop: 16 }}>
                            <h3>Adding chefs and waiters</h3>
                            <p className="panel-meta">After you are assigned to a cafe and accept it here, go to your Dashboard and use the <strong>Staff</strong> section to add chefs and waiters. They will be able to log in with the credentials you create.</p>
                        </div>
                        <button type="button" className="execute-btn" onClick={() => navigate("/owner")}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
                {!loading && me && hasCafe && needsAccept && (
                    <>
                        <div className="admin-panel owner-panel">
                            <h3>You have been assigned to a cafe</h3>
                            <p className="panel-meta"><strong>{me.cafe.name}</strong>{me.cafe.address && ` — ${me.cafe.address}`}</p>
                            <p className="panel-meta">Accept this assignment to take ownership and manage this cafe from your dashboard.</p>
                            {message && <p className="panel-message owner-msg">{message}</p>}
                            <button type="button" className="execute-btn" onClick={handleAccept} disabled={submitting}>
                                {submitting ? "Accepting…" : "Accept assignment"}
                            </button>
                        </div>
                        <div className="admin-panel owner-panel owner-accept-info" style={{ marginTop: 16 }}>
                            <h3>After accepting: add chefs and waiters</h3>
                            <p className="panel-meta">Once you accept, go to your <strong>Dashboard</strong> and open the <strong>Staff</strong> section. There you can create chef and waiter accounts. They can log in immediately with the username and password you set.</p>
                        </div>
                    </>
                )}
                {!loading && me && hasCafe && !needsAccept && (
                    <>
                        <div className="admin-panel owner-panel">
                            <p className="panel-meta">You have already accepted your assignment to <strong>{me.cafe.name}</strong>.</p>
                            <button type="button" className="execute-btn" onClick={() => navigate("/owner")}>
                                Go to Dashboard
                            </button>
                        </div>
                        <div className="admin-panel owner-panel owner-accept-info" style={{ marginTop: 16 }}>
                            <h3>Manage chefs and waiters</h3>
                            <p className="panel-meta">From your Dashboard, use the <strong>Staff</strong> section to add or manage chefs and waiters for your cafe.</p>
                            <button type="button" className="execute-btn" onClick={() => navigate("/owner")}>
                                Open Dashboard → Staff
                            </button>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

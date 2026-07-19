import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
    CartesianGrid,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import CustomerProfileForm from "../components/CustomerProfileForm";
import { api } from "../api";

const NOTIFICATION_STORAGE_KEY = "digital-cafe-notifications";
const CHEF_ANALYTICS_COLORS = ["#f59e0b", "#3b82f6", "#16a34a", "#8b5cf6", "#ef4444"];

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Chef", roles: ["CHEF"] };
    } catch {
        return { username: "Chef", roles: ["CHEF"] };
    }
}

function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDateTime(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
}

function getOrderStatusClass(status) {
    if (["PENDING", "CONFIRMED", "PAID"].includes(status)) return "pending";
    if (["PREPARING", "COOKING"].includes(status)) return "cooking";
    if (status === "READY") return "ready";
    return "";
}

function getOrderStatusLabel(status) {
    if (["PENDING", "CONFIRMED", "PAID"].includes(status)) return "Pending";
    if (["PREPARING", "COOKING"].includes(status)) return "Cooking";
    if (status === "READY") return "Ready";
    if (status === "SERVED") return "Ready";
    return status || "Pending";
}

function pushReadyNotification(order) {
    try {
        const existing = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]");
        const next = [
            {
                id: `ready-${order.id}-${Date.now()}`,
                title: "Order Ready",
                message: `Order ${order.orderNumber} is ready to serve.`,
                time: new Date().toISOString(),
                read: false,
            },
            ...(Array.isArray(existing) ? existing : []),
        ];
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next.slice(0, 20)));
    } catch (_) {
        // Ignore notification cache failures.
    }
}

function renderOrderCard(order, updateStatus, timeLabel, timeValue, isUpdating) {
    return (
        <div
            key={order.id}
            className={`order-card ${getOrderStatusClass(order.status)}`.trim()}
        >
            <div className="order-header">
                <strong className="order-id">Order #{order.orderNumber}</strong>
                <span className={`order-badge ${getOrderStatusClass(order.status)}`.trim()}>
                    {getOrderStatusLabel(order.status)}
                </span>
            </div>
            <div className="order-meta">
                <span className="order-time">
                    {timeLabel}: {timeValue}
                </span>
                <span className="order-time">
                    Items: {order.items?.length || 0}
                </span>
            </div>
            {order.items?.length > 0 && (
                <div className="order-items">
                    {order.items.map((item, i) => (
                        <div key={i} className="order-item-row">
                            <span className="order-item-icon" aria-hidden="true" />
                            <div className="order-item-copy">
                                <span className="order-item-name">
                                    {item.quantity}x {item.menuItem?.name || "Item"}
                                </span>
                                {item.specialInstructions && (
                                    <span className="order-item-note">
                                        {item.specialInstructions}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="order-actions">
                <button
                    type="button"
                    className="order-action-primary"
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    disabled={isUpdating || !["PENDING", "CONFIRMED", "PAID"].includes(order.status)}
                >
                    Start Cooking
                </button>
                <button
                    type="button"
                    className="order-action-secondary"
                    onClick={() => updateStatus(order.id, "READY")}
                    disabled={isUpdating || order.status !== "PREPARING"}
                >
                    Mark as Ready
                </button>
            </div>
        </div>
    );
}

export default function ChefDashboard() {
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePanel, setActivePanel] = useState("dashboard");
    const [message, setMessage] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [updatingOrderIds, setUpdatingOrderIds] = useState([]);
    const [cafeId, setCafeId] = useState(null);
    const [cafeName, setCafeName] = useState("");
    const [profileForm, setProfileForm] = useState({
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
    });
    const user = getStoredUser();
    const chefNavItems = [
        {
            key: "home",
            label: "Home",
            path: "/",
        },
        {
            key: "dashboard",
            label: "Dashboard",
            active: activePanel === "dashboard",
            onClick: () => setActivePanel("dashboard"),
        },
        {
            key: "settings",
            label: "Settings",
            active: activePanel === "settings",
            onClick: () => setActivePanel("settings"),
        },
        {
            key: "analytics",
            label: "Analytics",
            active: activePanel === "analytics",
            onClick: () => setActivePanel("analytics"),
        },
    ];

    const loadOrders = () => {
        if (!cafeId) {
            setOrders([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.getChefOrders(cafeId)
            .then((data) => setOrders(Array.isArray(data) ? data : []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        api.getChefMe()
            .then((profile) => {
                const nextCafeId = profile.cafeId || null;
                setCafeId(nextCafeId);
                setCafeName(profile.cafeName || "");
                if (!nextCafeId) {
                    setOrders([]);
                    setMenuItems([]);
                    setMessage("No cafe is assigned to this chef yet.");
                    return;
                }
                return Promise.all([
                    api.getChefOrders(nextCafeId).catch(() => []),
                    api.getCustomerMenu(nextCafeId).catch(() => []),
                ]).then(([ordersData, menuData]) => {
                    setOrders(Array.isArray(ordersData) ? ordersData : []);
                    setMenuItems(Array.isArray(menuData) ? menuData : []);
                });
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!cafeId) return undefined;
        const id = setInterval(loadOrders, 5000);
        return () => clearInterval(id);
    }, [cafeId]);

    const chefOrders = orders.filter((o) => ["PENDING", "CONFIRMED", "PAID", "PREPARING", "READY", "SERVED"].includes(o.status));
    const kitchenQueue = chefOrders.filter((o) => ["PENDING", "CONFIRMED", "PAID", "PREPARING"].includes(o.status));
    const processed = chefOrders.filter((o) => ["READY", "SERVED"].includes(o.status));
    const pendingOrders = chefOrders.filter((o) => ["PENDING", "CONFIRMED", "PAID"].includes(o.status));
    const cookingOrders = chefOrders.filter((o) => ["PREPARING", "COOKING"].includes(o.status));
    const readyOrders = chefOrders.filter((o) => o.status === "READY");
    const dailyOrderTrend = (() => {
        const labels = [];
        const counts = new Map();
        const now = new Date();
        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            labels.push({
                key,
                day: d.toLocaleDateString(undefined, { weekday: "short" }),
            });
            counts.set(key, 0);
        }
        chefOrders.forEach((order) => {
            if (!order.createdAt) return;
            const key = new Date(order.createdAt).toISOString().slice(0, 10);
            if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
        });
        return labels.map(({ key, day }) => ({ day, orders: counts.get(key) || 0 }));
    })();
    const chefStatusBreakdown = [
        { name: "Pending", value: pendingOrders.length },
        { name: "Cooking", value: cookingOrders.length },
        { name: "Ready", value: readyOrders.length },
    ].filter((entry) => entry.value > 0);

    const updateStatus = async (orderId, status) => {
        const previousOrders = orders;
        const nextUpdatedAt = new Date().toISOString();
        let updatedOrderSnapshot = null;

        setUpdatingOrderIds((prev) => [...prev, orderId]);
        setOrders((current) =>
            current.map((order) => {
                if (order.id !== orderId) return order;
                updatedOrderSnapshot = {
                    ...order,
                    status,
                    updatedAt: nextUpdatedAt,
                };
                return updatedOrderSnapshot;
            })
        );

        if (status === "READY" && updatedOrderSnapshot) {
            pushReadyNotification(updatedOrderSnapshot);
        }

        try {
            await api.updateOrderStatus(orderId, status);
        } catch (e) {
            setOrders(previousOrders);
            alert(e.message);
        } finally {
            setUpdatingOrderIds((prev) => prev.filter((id) => id !== orderId));
        }
    };

    useEffect(() => {
        if (activePanel !== "settings") return;
        setLoadingProfile(true);
        api.getChefMe()
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
            .catch((err) => setMessage(err.message || "Failed to load chef profile."))
            .finally(() => setLoadingProfile(false));
    }, [activePanel]);

    const handleSaveProfile = async (event, identificationError) => {
        event.preventDefault();
        if (identificationError) return;
        setSavingProfile(true);
        setMessage("");
        try {
            const updated = await api.updateChefMe({
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
            setProfileForm((prev) => ({
                ...prev,
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
            }));
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
                // Ignore local cache parse failures.
            }
            setMessage("Chef profile updated successfully.");
        } catch (err) {
            setMessage(err.message || "Failed to update chef profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <DashboardLayout
            title={user.username}
            role="CHEF"
            userEmail={user.email}
            brandTitle={cafeName || "Cafe"}
            navItemsOverride={chefNavItems}
            showResetPasswordLink={false}
        >
            <div className="dashboard chef-dashboard">
                <h1 className="dashboard-title">{cafeName || "Chef Dashboard"}</h1>
                {message && <p className="panel-message" style={{ marginTop: 16 }}>{message}</p>}

                {activePanel === "home" && (
                    <>
                        <div className="card-grid">
                            <div className="card kpi-card">
                                <h3>Menu items</h3>
                                <p>{menuItems.length}</p>
                            </div>
                            <div className="card kpi-card kpi-card--danger">
                                <h3>Kitchen queue</h3>
                                <p>{kitchenQueue.length}</p>
                            </div>
                            <div className="card kpi-card kpi-card--info">
                                <h3>Chef orders</h3>
                                <p>{chefOrders.length}</p>
                            </div>
                        </div>

                        <div className="chart-row two-col">
                            <div className="chart-container">
                                <h3>Menu</h3>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : menuItems.length === 0 ? (
                                    <p className="empty-msg">No menu items available.</p>
                                ) : (
                                    <ul className="owner-status-list">
                                        {menuItems.map((m) => (
                                            <li key={m.id || m.name}>
                                                {m.name} - ${Number(m.price || 0).toFixed(2)} ({m.category})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="chart-container">
                                <h3>All customer orders</h3>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : chefOrders.length === 0 ? (
                                    <p className="empty-msg">No customer orders yet.</p>
                                ) : (
                                    <ul className="owner-status-list">
                                        {chefOrders.slice(0, 10).map((o) => (
                                            <li key={o.id}>
                                                #{o.orderNumber} - {o.status} ·{" "}
                                                {o.totalAmount != null ? `$${Number(o.totalAmount).toFixed(2)}` : "-"}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activePanel === "dashboard" && (
                    <>
                        <div className="card-grid">
                            <div className="card kpi-card kpi-card--danger">
                                <h3>Kitchen Queue</h3>
                                <p>{kitchenQueue.length}</p>
                            </div>
                            <div className="card kpi-card kpi-card--success">
                                <h3>Ready / Served</h3>
                                <p>{processed.length}</p>
                            </div>
                            <div className="card kpi-card kpi-card--info">
                                <h3>Total Orders</h3>
                                <p>{chefOrders.length}</p>
                            </div>
                            <div className="card kpi-card">
                                <h3>Current Time</h3>
                                <p>{new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="kanban-board">
                            <div className="kanban-column kanban-column--pending">
                                <div className="kanban-column-head">
                                    <h3>Pending</h3>
                                    <span className="kanban-count">{pendingOrders.length}</span>
                                </div>
                                <div className="kanban-column-body">
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : pendingOrders.length === 0 ? (
                                        <p className="empty-msg">No pending orders</p>
                                    ) : (
                                        <div className="orders-list">
                                            {pendingOrders.map((order) =>
                                                renderOrderCard(
                                                    order,
                                                    updateStatus,
                                                    "Order time",
                                                    formatDateTime(order.createdAt),
                                                    updatingOrderIds.includes(order.id)
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="kanban-column kanban-column--cooking">
                                <div className="kanban-column-head">
                                    <h3>Cooking</h3>
                                    <span className="kanban-count">{cookingOrders.length}</span>
                                </div>
                                <div className="kanban-column-body">
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : cookingOrders.length === 0 ? (
                                        <p className="empty-msg">No cooking orders</p>
                                    ) : (
                                        <div className="orders-list">
                                            {cookingOrders.map((order) =>
                                                renderOrderCard(
                                                    order,
                                                    updateStatus,
                                                    "Started",
                                                    formatDateTime(order.updatedAt || order.createdAt),
                                                    updatingOrderIds.includes(order.id)
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="kanban-column kanban-column--ready">
                                <div className="kanban-column-head">
                                    <h3>Ready</h3>
                                    <span className="kanban-count">{readyOrders.length}</span>
                                </div>
                                <div className="kanban-column-body">
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : readyOrders.length === 0 ? (
                                        <p className="empty-msg">No ready orders</p>
                                    ) : (
                                        <div className="orders-list">
                                            {readyOrders.map((order) =>
                                                renderOrderCard(
                                                    order,
                                                    updateStatus,
                                                    "Updated",
                                                    formatTime(order.updatedAt),
                                                    updatingOrderIds.includes(order.id)
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="summary-box">
                            <h3>Order analytics</h3>
                            <p>
                                All customer orders are shown to the chef. Kitchen queue: <strong>{kitchenQueue.length}</strong> ·
                                Ready/served: <strong>{processed.length}</strong>. When the chef marks an order ready, it moves to the waiter dashboard.
                            </p>
                        </div>
                    </>
                )}

                {activePanel === "settings" && (
                    <div className="admin-panel owner-panel">
                        <h3>Chef profile settings</h3>
                        <p className="panel-meta">
                            Update your chef details here. The flow matches the registration-style information entered by the owner, except email stays locked.
                        </p>
                        <div className="admin-card-tile">
                            <h4 className="admin-card-tile-title">Reset password</h4>
                            <p className="admin-card-tile-desc">
                                Use the password reset flow to change your password securely.
                            </p>
                            <Link to="/forgot-password" className="admin-btn-link">
                                Go to password reset
                            </Link>
                        </div>
                        {loadingProfile ? (
                            <div className="summary-box">
                                <p>Loading profile...</p>
                            </div>
                        ) : (
                            <CustomerProfileForm
                                profileForm={profileForm}
                                setProfileForm={setProfileForm}
                                savingProfile={savingProfile}
                                onSave={handleSaveProfile}
                                title="Update chef profile"
                                description="Update your chef registration details here except your email address."
                            />
                        )}
                    </div>
                )}

                {activePanel === "analytics" && (
                    <div className="owner-analytics">
                        <h3>Kitchen analytics</h3>
                        <div className="card-grid owner-cards">
                            <div className="card admin-card kpi-card kpi-card--info">
                                <h3>Daily Orders</h3>
                                <p>{dailyOrderTrend[dailyOrderTrend.length - 1]?.orders || 0}</p>
                            </div>
                            <div className="card admin-card kpi-card kpi-card--danger">
                                <h3>Pending</h3>
                                <p>{pendingOrders.length}</p>
                            </div>
                            <div className="card admin-card kpi-card kpi-card--success">
                                <h3>Ready</h3>
                                <p>{readyOrders.length}</p>
                            </div>
                        </div>
                        <div className="chart-row two-col owner-analytics-charts">
                            <div className="chart-container owner-analytics-chart-card">
                                <h3>Daily orders</h3>
                                <div className="owner-chart-wrap">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={dailyOrderTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="chart-container owner-analytics-chart-card">
                                <h3>Order status mix</h3>
                                <div className="owner-chart-wrap">
                                    {chefStatusBreakdown.length === 0 ? (
                                        <p className="empty-msg">No order data yet.</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={chefStatusBreakdown}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={88}
                                                    innerRadius={42}
                                                    paddingAngle={3}
                                                >
                                                    {chefStatusBreakdown.map((entry, idx) => (
                                                        <Cell key={entry.name} fill={CHEF_ANALYTICS_COLORS[idx % CHEF_ANALYTICS_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

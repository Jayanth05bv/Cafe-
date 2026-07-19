import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";
import CustomerProfileForm from "../components/CustomerProfileForm";

const NOTIFICATION_STORAGE_KEY = "digital-cafe-notifications";
const READY_ORDER_POLL_MS = 5000;
const TOAST_TIMEOUT_MS = 3000;
const HIGHLIGHT_TIMEOUT_MS = 6000;

function getOrderStatusClass(status) {
    if (["PENDING", "CONFIRMED", "PAID"].includes(status)) return "pending";
    if (["PREPARING", "COOKING"].includes(status)) return "cooking";
    if (status === "READY") return "ready";
    return "";
}

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Waiter", roles: ["WAITER"] };
    } catch {
        return { username: "Waiter", roles: ["WAITER"] };
    }
}

function loadStoredNotifications() {
    try {
        const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function saveStoredNotifications(list) {
    try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {
        // Ignore storage failures.
    }
}

function playNotificationSound() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.18);
        gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.28);
        oscillator.onended = () => {
            audioContext.close().catch(() => {});
        };
    } catch (_) {
        // Ignore audio playback failures, usually caused by browser autoplay restrictions.
    }
}

function getReadyAgeMinutes(order) {
    const preparedAt = order?.updatedAt || order?.createdAt;
    if (!preparedAt) return 0;
    const diffMs = Date.now() - new Date(preparedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
}

function formatReadyAge(order) {
    const minutes = getReadyAgeMinutes(order);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} min ago`;
}

function getReadyUrgency(order) {
    const minutes = getReadyAgeMinutes(order);
    if (minutes < 5) return "fresh";
    if (minutes < 10) return "soon";
    return "urgent";
}

function formatOrderStage(status) {
    if (["PENDING", "CONFIRMED", "PAID"].includes(status)) return "Awaiting kitchen";
    if (["PREPARING", "COOKING"].includes(status)) return "Being prepared";
    if (status === "READY") return "Ready to serve";
    if (status === "SERVED") return "Served";
    return status || "Pending";
}

function formatTableStatus(status) {
    if (!status) return "Available";
    return String(status)
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function WaiterDashboard() {
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [activePanel, setActivePanel] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [cafeId, setCafeId] = useState(null);
    const [cafeName, setCafeName] = useState("");
    const [message, setMessage] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [highlightedOrderIds, setHighlightedOrderIds] = useState([]);
    const [notifications, setNotifications] = useState(loadStoredNotifications);
    const [notificationOpen, setNotificationOpen] = useState(false);
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
    const readyOrderIdsRef = useRef([]);
    const hasLoadedReadyOrdersRef = useRef(false);
    const notificationRef = useRef(null);
    const orderCardRefs = useRef({});
    const user = getStoredUser();
    const waiterNavItems = [
        {
            key: "home",
            label: "Home",
            active: false,
            onClick: () => {
                window.location.href = "/";
            },
        },
        {
            key: "dashboard",
            label: "Dashboard",
            active: activePanel === "dashboard",
            onClick: () => setActivePanel("dashboard"),
        },
        {
            key: "settings",
            label: "Update Profile",
            active: activePanel === "settings",
            onClick: () => setActivePanel("settings"),
        },
    ];

    const loadOrders = () => {
        if (!cafeId) {
            setOrders([]);
            setTables([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([
            api.getWaiterOrders(cafeId).then((d) => Array.isArray(d) ? d : []),
            api.getWaiterTables(cafeId).then((d) => Array.isArray(d) ? d : []),
        ])
            .then(([o, t]) => {
                setOrders(o);
                setTables(t);
            })
            .catch(() => { setOrders([]); setTables([]); })
            .finally(() => setLoading(false));
    };

    const handleMarkServed = (orderId) => {
        api.updateWaiterOrderStatus(orderId, "SERVED").then(() => loadOrders()).catch((e) => alert(e.message));
    };

    useEffect(() => {
        setLoading(true);
        api.getWaiterMe()
            .then((profile) => {
                const nextCafeId = profile.cafeId || null;
                setCafeId(nextCafeId);
                setCafeName(profile.cafeName || "");
                if (!nextCafeId) {
                    setMessage("No cafe is assigned to this waiter yet.");
                    setOrders([]);
                    setTables([]);
                    return;
                }
                return Promise.all([
                    api.getWaiterOrders(nextCafeId).then((d) => Array.isArray(d) ? d : []),
                    api.getWaiterTables(nextCafeId).then((d) => Array.isArray(d) ? d : []),
                ]).then(([o, t]) => {
                    setOrders(o);
                    setTables(t);
                });
            })
            .catch(() => {
                setOrders([]);
                setTables([]);
            })
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        if (!cafeId) return undefined;
        const id = setInterval(loadOrders, READY_ORDER_POLL_MS);
        return () => clearInterval(id);
    }, [cafeId]);

    useEffect(() => {
        if (activePanel !== "settings") return;
        setLoadingProfile(true);
        api.getWaiterMe()
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
            .catch((err) => setMessage(err.message || "Failed to load waiter profile."))
            .finally(() => setLoadingProfile(false));
    }, [activePanel]);

    const readyToDeliver = orders.filter((o) => o.status === "READY");
    const delivered = orders.filter((o) => o.status === "SERVED");
    const activeServiceOrders = orders.filter((o) => o.status && !["SERVED", "CANCELLED"].includes(o.status));
    const inProgressOrders = activeServiceOrders.filter((o) => o.status !== "READY");

    useEffect(() => {
        const currentReadyIds = readyToDeliver.map((o) => o.id);
        const previousReadyIds = readyOrderIdsRef.current;
        const newlyReadyOrders = readyToDeliver.filter((o) => !previousReadyIds.includes(o.id));

        if (hasLoadedReadyOrdersRef.current && newlyReadyOrders.length > 0) {
            try {
                const existing = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]");
                const next = [
                    ...newlyReadyOrders.map((order) => ({
                        id: `ready-${order.id}-${Date.now()}`,
                        title: "Order Ready",
                        message: `Order ${order.orderNumber} is ready to serve.`,
                        time: new Date().toISOString(),
                        orderId: order.id,
                        read: false,
                    })),
                    ...(Array.isArray(existing) ? existing : []),
                ];
                const trimmed = next.slice(0, 20);
                saveStoredNotifications(trimmed);
                setNotifications(trimmed);
            } catch (_) {}
            setToastMessage("New order ready!");
            setHighlightedOrderIds((prev) => Array.from(new Set([...prev, ...newlyReadyOrders.map((order) => order.id)])));
            playNotificationSound();
        }

        hasLoadedReadyOrdersRef.current = true;
        readyOrderIdsRef.current = currentReadyIds;
    }, [readyToDeliver]);

    useEffect(() => {
        if (!toastMessage) return undefined;
        const timeoutId = window.setTimeout(() => setToastMessage(""), TOAST_TIMEOUT_MS);
        return () => window.clearTimeout(timeoutId);
    }, [toastMessage]);

    useEffect(() => {
        if (highlightedOrderIds.length === 0) return undefined;
        const timeoutId = window.setTimeout(() => setHighlightedOrderIds([]), HIGHLIGHT_TIMEOUT_MS);
        return () => window.clearTimeout(timeoutId);
    }, [highlightedOrderIds]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((entry) => !entry.read).length;

    const handleNotificationClick = (notification) => {
        const next = notifications.map((entry) =>
            entry.id === notification.id ? { ...entry, read: true } : entry
        );
        setNotifications(next);
        saveStoredNotifications(next);
        setNotificationOpen(false);
        if (notification.orderId && orderCardRefs.current[notification.orderId]) {
            orderCardRefs.current[notification.orderId].scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    const handleMarkAllRead = () => {
        const next = notifications.map((entry) => ({ ...entry, read: true }));
        setNotifications(next);
        saveStoredNotifications(next);
    };

    const handleSaveProfile = async (event, identificationError) => {
        event.preventDefault();
        if (identificationError) return;
        setSavingProfile(true);
        setMessage("");
        try {
            const updated = await api.updateWaiterMe({
                ...profileForm,
                fullName:
                    profileForm.fullName ||
                    [profileForm.firstName, profileForm.lastName]
                        .filter(Boolean)
                        .join(" ")
                        .trim(),
                address:
                    profileForm.address ||
                    [
                        profileForm.streetAddress,
                        profileForm.plotNo,
                        profileForm.city,
                        profileForm.state,
                        profileForm.pincode,
                    ]
                        .filter(Boolean)
                        .join(", "),
                workExperience:
                    profileForm.workExperience ||
                    [
                        profileForm.companyName,
                        profileForm.workLocation,
                        profileForm.compensationPackage,
                    ]
                        .filter(Boolean)
                        .join(", "),
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
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...parsed,
                        username: updated.username || parsed.username,
                        email: updated.email || parsed.email,
                        fullName: updated.fullName || parsed.fullName,
                    })
                );
            } catch {
                // Ignore local cache parse failures.
            }
            setMessage("Waiter profile updated successfully.");
        } catch (err) {
            setMessage(err.message || "Failed to update waiter profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const now = new Date();
    const tablesWithStatus = tables.map((t) => {
        const tableOrders = (orders || []).filter(
            (o) => o.cafeTable && o.cafeTable.id === t.id
        );
        const activeOrder =
            tableOrders
                .filter(
                    (o) => o.status && !["SERVED", "CANCELLED"].includes(o.status)
                )
                .sort(
                    (a, b) =>
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                )[0] || null;
        const hasOrder = !!activeOrder;
        const served =
            activeOrder &&
            activeOrder.status === "SERVED";
        let waitingMinutes = null;
        if (activeOrder?.createdAt) {
            const created = new Date(activeOrder.createdAt).getTime();
            waitingMinutes = Math.max(
                0,
                Math.round((now.getTime() - created) / 60000)
            );
        }
        const occupancy =
            t.status ||
            (hasOrder ? "OCCUPIED" : "AVAILABLE");
        const people =
            activeOrder && activeOrder.partySize != null
                ? activeOrder.partySize
                : null;
        return {
            table: t,
            activeOrder,
            hasOrder,
            served,
            waitingMinutes,
            occupancy,
            people,
        };
    });

    return (
        <DashboardLayout
            title={user.username}
            role="WAITER"
            userEmail={user.email}
            brandTitle={cafeName || "Cafe"}
            navItemsOverride={waiterNavItems}
        >
            <div className="dashboard waiter-dashboard">
                {activePanel === "dashboard" && (
                    <>
                <div className="waiter-dashboard-head">
                    <div className="waiter-dashboard-hero">
                        <div className="waiter-dashboard-hero-copy">
                            <span className="waiter-dashboard-kicker">Service control</span>
                            <h1 className="dashboard-title">Waiter Dashboard</h1>
                            <p className="waiter-dashboard-subtitle">
                                Track ready orders, monitor table activity, and complete service quickly from one place.
                            </p>
                            {cafeName && (
                                <div className="waiter-dashboard-cafe-chip">
                                    <span className="waiter-dashboard-cafe-dot" aria-hidden="true" />
                                    {cafeName}
                                </div>
                            )}
                        </div>
                        <div className="waiter-dashboard-hero-actions">
                            <div className="waiter-live-status-card">
                                <span className="waiter-live-status-label">Ready now</span>
                                <strong>{readyToDeliver.length}</strong>
                                <p>{readyToDeliver.length === 1 ? "Order waiting to be served" : "Orders waiting to be served"}</p>
                            </div>
                            <div className="waiter-notification-wrap" ref={notificationRef}>
                                <button
                                    type="button"
                                    className={`waiter-notification-btn ${notificationOpen ? "active" : ""}`}
                                    aria-label="Order notifications"
                                    aria-expanded={notificationOpen}
                                    onClick={() => setNotificationOpen((open) => !open)}
                                >
                                    <svg className="waiter-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="waiter-notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                                    )}
                                </button>
                                {notificationOpen && (
                                    <div className="waiter-notification-dropdown">
                                        <div className="waiter-notification-header">
                                            <span>Recent order updates</span>
                                            {unreadCount > 0 && (
                                                <button type="button" className="waiter-notification-mark-all" onClick={handleMarkAllRead}>
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="waiter-notification-list">
                                            {notifications.length === 0 ? (
                                                <p className="waiter-notification-empty">No new orders</p>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <button
                                                        key={notification.id}
                                                        type="button"
                                                        className={`waiter-notification-item ${notification.read ? "read" : ""}`}
                                                        onClick={() => handleNotificationClick(notification)}
                                                    >
                                                        <strong>{notification.title}</strong>
                                                        <p>{notification.message}</p>
                                                        <span className="waiter-notification-time">
                                                            {new Date(notification.time).toLocaleTimeString()}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {message && <p className="panel-message waiter-panel-message">{message}</p>}
                {toastMessage && <div className="admin-toast admin-toast-success waiter-live-toast">{toastMessage}</div>}

                <div className="card-grid waiter-kpi-grid">
                    <div className="card waiter-kpi-card">
                        <h3>Ready Orders</h3>
                        <p>{readyToDeliver.length}</p>
                        <span>Orders from chef ready to serve</span>
                    </div>
                    <div className="card highlight waiter-kpi-card waiter-kpi-card-highlight">
                        <h3>Serve Now</h3>
                        <p>{readyToDeliver.length}</p>
                        <span>Priority queue needing immediate action</span>
                    </div>
                    <div className="card waiter-kpi-card">
                        <h3>Delivered</h3>
                        <p>{delivered.length}</p>
                        <span>Orders marked served successfully</span>
                    </div>
                    <div className="card waiter-kpi-card">
                        <h3>Active Orders</h3>
                        <p>{activeServiceOrders.length}</p>
                        <span>All non-cancelled orders in this cafe</span>
                    </div>
                </div>

                <div className="waiter-service-strip">
                    <div className="waiter-service-strip-item">
                        <span className="waiter-service-strip-label">Cafe tables</span>
                        <strong>{tables.length}</strong>
                    </div>
                    <div className="waiter-service-strip-item">
                        <span className="waiter-service-strip-label">Notifications</span>
                        <strong>{unreadCount}</strong>
                    </div>
                    <div className="waiter-service-strip-item">
                        <span className="waiter-service-strip-label">In progress</span>
                        <strong>{inProgressOrders.length}</strong>
                    </div>
                </div>

                {readyToDeliver.length > 0 && (
                    <div className="menu-message menu-message-success" role="status">
                        {readyToDeliver.length} order{readyToDeliver.length > 1 ? "s are" : " is"} ready to serve. Waiter attention needed.
                    </div>
                )}

                <div className="chart-row two-col waiter-main-grid">
                    <div className="chart-container waiter-panel waiter-panel-primary">
                        <div className="waiter-panel-head">
                            <div>
                                <p className="waiter-panel-eyebrow">Service queue</p>
                                <h3>Orders ready for waiter</h3>
                            </div>
                            <span className="waiter-panel-count">{readyToDeliver.length}</span>
                        </div>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="waiter-ready-grid">
                                {readyToDeliver.length === 0 ? (
                                    <div className="waiter-orders-empty-state">
                                        <p className="empty-msg">No orders are ready to serve</p>
                                        {inProgressOrders.length > 0 && (
                                            <p className="waiter-orders-empty-note">
                                                {inProgressOrders.length} active order{inProgressOrders.length === 1 ? "" : "s"} are still in progress below.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    readyToDeliver.map((order) => (
                                        <div
                                            key={order.id}
                                            ref={(node) => {
                                                if (node) orderCardRefs.current[order.id] = node;
                                                else delete orderCardRefs.current[order.id];
                                            }}
                                            className={`waiter-ready-card waiter-ready-card--${getReadyUrgency(order)} ${highlightedOrderIds.includes(order.id) ? "order-card--new-ready" : ""}`.trim()}
                                        >
                                            <div className="waiter-ready-card-head">
                                                <div>
                                                    <span className="waiter-ready-kicker">Ready order</span>
                                                    <h4>Table {order.cafeTable?.tableNumber || "-"}</h4>
                                                </div>
                                                <span className={`waiter-ready-indicator waiter-ready-indicator--${getReadyUrgency(order)}`}>
                                                    {formatReadyAge(order)}
                                                </span>
                                            </div>
                                            <div className="waiter-ready-meta">
                                                <span>Order #{order.orderNumber}</span>
                                                <span>{order.items?.length || 0} items</span>
                                            </div>
                                            {order.items?.length > 0 && (
                                                <div className="waiter-ready-items">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="waiter-ready-item">
                                                            <span className="waiter-ready-bullet" aria-hidden="true" />
                                                            <span>
                                                                {item.quantity}x {item.menuItem?.name || "Item"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="waiter-ready-footer">
                                                <span className="waiter-ready-time">
                                                    Prepared {formatReadyAge(order)}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="waiter-serve-btn"
                                                    onClick={() => handleMarkServed(order.id)}
                                                >
                                                    Serve Now
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="chart-container waiter-panel waiter-active-panel">
                        <div className="waiter-panel-head">
                            <div>
                                <p className="waiter-panel-eyebrow">Live activity</p>
                                <h3>Active cafe orders</h3>
                            </div>
                            <span className="waiter-panel-count">{inProgressOrders.length}</span>
                        </div>
                        {inProgressOrders.length === 0 ? (
                            <p className="empty-msg">No active in-progress orders right now.</p>
                        ) : (
                            <div className="waiter-active-orders-list">
                                {inProgressOrders.map((order) => (
                                    <div key={order.id} className="waiter-active-order-card">
                                        <div className="waiter-active-order-top">
                                            <strong>#{order.orderNumber}</strong>
                                            <span className={`owner-order-status-badge owner-order-status-${String(order.status || "unknown").toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="waiter-active-order-meta">
                                            <span>Table {order.cafeTable?.tableNumber || "-"}</span>
                                            <span>{order.items?.length || 0} items</span>
                                            <span>{formatOrderStage(order.status)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="waiter-floor-grid">
                    <div className="chart-container waiter-panel waiter-floor-panel">
                        <div className="waiter-panel-head">
                            <div>
                                <p className="waiter-panel-eyebrow">Floor overview</p>
                                <h3>Table status</h3>
                            </div>
                            <span className="waiter-panel-count">{tables.length}</span>
                        </div>
                        <div className="tables-grid waiter-table-grid">
                            {tablesWithStatus.length === 0 && !loading && (
                                <p className="empty-msg">No tables</p>
                            )}
                            {tablesWithStatus.map(
                                ({
                                    table: t,
                                    activeOrder,
                                    hasOrder,
                                    served,
                                    waitingMinutes,
                                    occupancy,
                                    people,
                                }) => (
                                    <div
                                        key={t.id}
                                        className={`table-card waiter-table-card status-${(occupancy || "")
                                            .toLowerCase()
                                            .replace(/[^a-z]/g, "")}`}
                                    >
                                        <div
                                            className={`waiter-table-status-strip status-${(occupancy || "")
                                                .toLowerCase()
                                                .replace(/[^a-z]/g, "")}`}
                                        />
                                        <div className="waiter-table-card-head">
                                            <div className="waiter-table-card-copy">
                                                <span className="waiter-table-card-label">
                                                    Table
                                                </span>
                                                <span className="table-number">
                                                    {t.tableNumber}
                                                </span>
                                            </div>
                                            <span
                                                className={`waiter-table-status-pill status-${(occupancy || "")
                                                    .toLowerCase()
                                                    .replace(/[^a-z]/g, "")}`}
                                            >
                                                {hasOrder
                                                    ? formatTableStatus(
                                                          occupancy || "OCCUPIED"
                                                      )
                                                    : "Available"}
                                            </span>
                                        </div>
                                        <div className="waiter-table-meta-list">
                                            <span className="waiter-table-meta-chip">
                                                Seats {t.capacity ?? "-"}
                                            </span>
                                            <span className="waiter-table-meta-chip">
                                                Guests{" "}
                                                {people != null
                                                    ? people
                                                    : hasOrder
                                                    ? "-"
                                                    : "0"}
                                            </span>
                                            <span className="waiter-table-meta-chip">
                                                {hasOrder ? "Order active" : "Open now"}
                                            </span>
                                        </div>
                                        {hasOrder && (
                                            <div className="waiter-table-order-block">
                                                <div className="waiter-table-order-head">
                                                    <div>
                                                        <strong>
                                                            {activeOrder.orderNumber ||
                                                                `Order #${activeOrder.id}`}
                                                        </strong>
                                                        <span>
                                                            {formatOrderStage(
                                                                activeOrder.status
                                                            )}
                                                        </span>
                                                    </div>
                                                    <span className="waiter-table-order-time">
                                                        {waitingMinutes != null
                                                            ? `${waitingMinutes} min`
                                                            : "-"}
                                                    </span>
                                                </div>
                                                <div className="waiter-table-order-stats">
                                                    <span>
                                                        Items{" "}
                                                        {activeOrder.items?.length || 0}
                                                    </span>
                                                    <span>
                                                        Served {served ? "Yes" : "No"}
                                                    </span>
                                                </div>
                                                <div className="order-items waiter-table-order-items">
                                                    {activeOrder.items?.map(
                                                        (item, i) => (
                                                            <span key={i}>
                                                                {item.quantity}x{" "}
                                                                {item.menuItem
                                                                    ?.name ||
                                                                    "Item"}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {!hasOrder && (
                                            <p className="waiter-table-empty-note">
                                                No active service on this table.
                                            </p>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="summary-box">
                    <h3>Delivery summary</h3>
                    <p>
                        Ready to deliver: <strong>{readyToDeliver.length}</strong> · Delivered: <strong>{delivered.length}</strong>.
                        The waiter only sees orders after the chef marks them ready, and a notification is added for each newly ready order.
                    </p>
                </div>
                    </>
                )}
                {activePanel === "settings" && (
                    <div className="admin-panel owner-panel">
                        {message && <p className="panel-message waiter-panel-message">{message}</p>}
                        <h3>Waiter profile settings</h3>
                        <p className="panel-meta">
                            Update your waiter details here. The flow matches the chef profile update page and keeps your email locked.
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
                                title="Update waiter profile"
                                description="Update your waiter registration details here except your email address."
                            />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function getDashboardPath(roles) {
    if (!roles || !roles.length) return "/user";
    if (roles.includes("ADMIN")) return "/admin";
    if (roles.includes("OWNER")) return "/owner";
    if (roles.includes("CHEF")) return "/chef";
    if (roles.includes("WAITER")) return "/waiter";
    return "/user";
}

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

const NOTIFICATION_STORAGE_KEY = "digital-cafe-notifications";

function loadNotifications() {
    try {
        const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        }
    } catch (_) {}
    return [
        { id: "1", title: "Welcome", message: "Your account is ready. Visit your dashboard to get started.", time: new Date().toISOString(), read: false },
        { id: "2", title: "Reminder", message: "Complete your profile for a better experience.", time: new Date().toISOString(), read: false },
    ];
}

function saveNotifications(list) {
    try {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
}

export default function Navbar() {
    const navigate = useNavigate();
    const token = api.getToken();
    const user = getStoredUser();
    const isLoggedIn = Boolean(token && user);

    const [notifications, setNotifications] = useState(loadNotifications);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleNotificationToggle = () => {
        setNotificationOpen((open) => !open);
    };

    const handleMarkAsRead = (id) => {
        setNotifications((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
            saveNotifications(next);
            return next;
        });
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) => {
            const next = prev.map((n) => ({ ...n, read: true }));
            saveNotifications(next);
            return next;
        });
    };

    const handleLogout = () => {
        api.setToken(null);
        try {
            localStorage.removeItem("user");
        } catch (_) {}
        navigate("/");
    };

    const dashboardPath = user?.roles?.length ? getDashboardPath(user.roles) : "/user";

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span className="navbar-brand-mark" aria-hidden="true">
                    <img src="/bean-to-cup-logo.svg" alt="" className="navbar-brand-logo" />
                </span>
                <span className="navbar-brand-copy">
                    <strong>Bean To Cup</strong>
                    <small>Fresh cafe moments</small>
                </span>
            </Link>

            <div className="navbar-right">
                <ul className="navbar-links">
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <a href="/#about">About</a>
                    </li>
                    <li>
                        <a href="/#services">Services</a>
                    </li>
                    <li>
                        <a href="/#gallery">Gallery</a>
                    </li>
                </ul>

                <ul className="navbar-actions">
                    {isLoggedIn ? (
                        <>
                            <li>
                                <Link to={dashboardPath} className="nav-dashboard">Dashboard</Link>
                            </li>
                            <li className="nav-notification-wrap" ref={notificationRef}>
                                <button
                                    type="button"
                                    className={`nav-notification-btn ${notificationOpen ? "active" : ""}`}
                                    aria-label="Notifications"
                                    aria-expanded={notificationOpen}
                                    onClick={handleNotificationToggle}
                                >
                                    <svg className="nav-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="nav-notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                                    )}
                                </button>
                                {notificationOpen && (
                                    <div className="nav-notification-dropdown">
                                        <div className="nav-notification-dropdown-header">
                                            <span>Notifications</span>
                                            {unreadCount > 0 && (
                                                <button type="button" className="nav-notification-mark-all" onClick={handleMarkAllRead}>
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="nav-notification-list">
                                            {notifications.length === 0 ? (
                                                <p className="nav-notification-empty">No notifications</p>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`nav-notification-item ${n.read ? "read" : ""}`}
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                    >
                                                        <strong>{n.title}</strong>
                                                        <p>{n.message}</p>
                                                        <span className="nav-notification-time">
                                                            {new Date(n.time).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                            <li className="nav-user">
                                <span className="nav-username">{user?.username || "User"}</span>
                            </li>
                            <li>
                                <button type="button" className="nav-logout" onClick={handleLogout}>
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login">Login</Link>
                            </li>
                            <li className="register">
                                <Link to="/register">Register</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}

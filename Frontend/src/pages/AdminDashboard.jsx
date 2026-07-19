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
    LineChart,
    Line,
    AreaChart,
    Area,
    CartesianGrid,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import { api } from "../api";

// Vivid, high‑contrast palette for dashboard charts
const COLORS = ["#f97316", "#22c55e", "#6366f1", "#e11d48", "#14b8a6"];
const ADMIN_ORDER_PAGE_SIZE = 8;
const ADMIN_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
});
const ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});
const ADMIN_COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
});

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Admin", roles: ["ADMIN"] };
    } catch {
        return { username: "Admin", roles: ["ADMIN"] };
    }
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
}

function formatAdminOrderCurrency(value) {
    return value != null ? ADMIN_CURRENCY_FORMATTER.format(Number(value)) : "—";
}

function formatAdminDateTime(value) {
    return value ? ADMIN_DATE_FORMATTER.format(new Date(value)) : "—";
}

function formatAdminCompactNumber(value) {
    return ADMIN_COMPACT_NUMBER_FORMATTER.format(Number(value || 0));
}

function formatAdminPercentChange(value) {
    const amount = Number(value || 0);
    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toFixed(0)}% from previous period`;
}

function OrderActionIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

function AdminAnalyticsKpiIcon({ type }) {
    if (type === "cafes") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 19.5h15M6 19.5V7.5l6-3 6 3v12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 11.5h.01M15 11.5h.01M12 15.5h.01" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
        );
    }
    if (type === "orders") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 6h10M7 12h10M7 18h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
                <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
            </svg>
        );
    }
    if (type === "revenue") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.5v17M16.5 7.5c0-1.7-1.8-3-4.5-3S7.5 5.8 7.5 7.5s1.8 3 4.5 3 4.5 1.3 4.5 3-1.8 3-4.5 3-4.5-1.3-4.5-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.5 12A5.5 5.5 0 0 1 12 6.5h6v11h-6A5.5 5.5 0 0 1 6.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        </svg>
    );
}

function getCafeLocationLabel(address) {
    if (!address) return "No location";
    const parts = String(address)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length === 0) return "No location";
    return parts[parts.length - 1];
}

const USERS_PER_PAGE = 8;

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalUsers: 0, totalCafes: 0, totalOrders: 0 });
    const [users, setUsers] = useState([]);
    const [cafes, setCafes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activePanel, setActivePanel] = useState("reports");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [loading, setLoading] = useState(false);
    const [activeAdminAnalyticsSlice, setActiveAdminAnalyticsSlice] = useState(null);
    const [showCreateOwnerForm, setShowCreateOwnerForm] = useState(false);
    const [userStatusFilter, setUserStatusFilter] = useState("All");
    const [userSearch, setUserSearch] = useState("");
    const [cafeSearch, setCafeSearch] = useState("");
    const [cafeLocationFilter, setCafeLocationFilter] = useState("");
    const [userPage, setUserPage] = useState(1);
    const [ownerWizardStep, setOwnerWizardStep] = useState(0);
    const [ownerWizardError, setOwnerWizardError] = useState("");
    const [ownerWizardData, setOwnerWizardData] = useState({
        firstName: "",
        lastName: "",
        workExperience: "",
        email: "",
        password: "",
        cafeName: "",
        tagline: "",
        description: "",
        contactNumber: "",
        openingTime: "",
        closingTime: "",
        street: "",
        city: "",
        stateRegion: "",
        pincode: "",
        fssaiNumber: "",
        gstNumber: "",
        tradeLicense: "",
        accountHolder: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        bankPassword: "",
        logoUrl: "",
        cafeImages: "",
    });
    const [selectedOwnerId, setSelectedOwnerId] = useState(null);
    const [selectedCafeId, setSelectedCafeId] = useState(null);
    const [editingCafeId, setEditingCafeId] = useState(null);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
    const [orderDateFilter, setOrderDateFilter] = useState("");
    const [orderSort, setOrderSort] = useState({ key: "createdAt", direction: "desc" });
    const [orderPage, setOrderPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const user = getStoredUser();

    const clearToast = () => {
        setMessage("");
        setMessageType("success");
    };

    const showToast = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    const loadStats = () => api.getAdminStats().then(setStats).catch(() => {});
    const loadUsers = () => api.getAdminUsers().then(setUsers).catch(() => setUsers([]));
    const loadCafes = () => api.getAdminCafes().then(setCafes).catch(() => setCafes([]));
    const loadOrders = () => api.getAdminOrders().then(setOrders).catch(() => setOrders([]));

    // Initial load: grab high‑level stats plus users and orders
    useEffect(() => {
        loadStats();
        loadUsers();
        loadOrders();
    }, []);

    useEffect(() => {
        if (activePanel === "users") {
            loadUsers();
        }
        if (activePanel === "cafes") {
            loadCafes();
        }
        if (activePanel === "owners-cafes") {
            loadUsers();
            loadCafes();
        }
        if (activePanel === "reports" || activePanel === "orders") {
            loadOrders();
        }
    }, [activePanel]);

    useEffect(() => {
        if (!message) return undefined;
        const timeoutId = window.setTimeout(() => {
            clearToast();
        }, 3000);
        return () => window.clearTimeout(timeoutId);
    }, [message]);

    const handleCreateCafeOwner = async ({ firstName, lastName, email, password, workExperience, contactNumber, fullAddress }) => {
        if (!firstName || !lastName || !email || !password) {
            showToast("First name, last name, email and password are required.", "error");
            return null;
        }
        const username = (firstName + lastName).replace(/\s/g, "").toLowerCase() || email.split("@")[0];
        setLoading(true);
        clearToast();
        try {
            const owner = await api.createUser({
                username,
                email,
                password,
                roles: ["OWNER"],
                fullName: `${firstName} ${lastName}`.trim(),
                phone: contactNumber || undefined,
                address: fullAddress || undefined,
                workExperience: workExperience || undefined,
            });
            loadUsers();
            loadStats();
            showToast("Cafe owner created. Login credentials can be shared with the owner.");
            return owner;
        } catch (err) {
            showToast(err.message || "Failed to create cafe owner", "error");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUserEnabled = async (u) => {
        try {
            await api.updateUserEnabled(u.id, !u.enabled);
            loadUsers();
            loadStats();
            showToast(u.enabled ? "User disabled." : "User enabled.");
        } catch (err) {
            showToast(err.message || "Failed to update", "error");
        }
    };

    const handleUpdateCafe = async (e, cafe) => {
        e.preventDefault();
        const form = e.target;
        const name = form.editName.value.trim();
        const address = form.editAddress.value.trim() || null;
        const phone = form.editPhone.value.trim() || null;
        const description = form.editDesc.value.trim() || null;
        const logoUrl = form.editLogoUrl?.value?.trim() || null;
        const imageUrls = form.editImageUrls?.value?.trim() || null;
        const bankAccountHolder = form.editBankAccountHolder?.value?.trim() || null;
        const bankName = form.editBankName?.value?.trim() || null;
        const bankAccountNumber = form.editBankAccountNumber?.value?.trim() || null;
        const bankIfscCode = form.editBankIfscCode?.value?.trim() || null;
        const revenueRaw = form.editRevenue?.value?.trim();
        const revenue = revenueRaw === "" || revenueRaw == null ? null : Number(revenueRaw);
        if (!name) return;
        setLoading(true);
        clearToast();
        try {
            await api.updateCafe(cafe.id, {
                name,
                address,
                phone,
                description,
                logoUrl,
                imageUrls,
                bankAccountHolder,
                bankName,
                bankAccountNumber,
                bankIfscCode,
                bankAccount: [bankName, bankAccountNumber, bankIfscCode].filter(Boolean).join(" | ") || null,
                revenue,
            });
            loadCafes();
            loadStats();
            showToast("Cafe updated.");
        } catch (err) {
            showToast(err.message || "Failed to update cafe", "error");
        } finally {
            setLoading(false);
        }
    };

    const normalizeRole = (r) => {
        const raw = typeof r === "string" ? r : r?.name;
        if (raw == null) return "";
        const s = String(raw).toUpperCase().replace(/^ROLE_/, "");
        return s;
    };
    const hasRole = (u, roleName) =>
        (u.roles || []).some((r) => normalizeRole(r) === roleName.toUpperCase());
    const owners = (users || []).filter((u) => hasRole(u, "OWNER"));
    const isAdminUser = (u) => hasRole(u, "ADMIN");
    const roleNames = (u) =>
        (u.roles || []).map((r) => normalizeRole(r) || (r?.name ?? r)).filter(Boolean).join(", ") || "—";

    const filteredCafes = (cafes || []).filter((cafe) => {
        const search = cafeSearch.trim().toLowerCase();
        const location = cafeLocationFilter.trim().toLowerCase();
        const nameMatches = !search || (cafe.name || "").toLowerCase().includes(search);
        const locationMatches = !location || (cafe.address || "").toLowerCase().includes(location);
        return nameMatches && locationMatches;
    }).sort((a, b) => Number(a?.revenue || 0) - Number(b?.revenue || 0));

    const managedUsers = (users || []).filter((u) => !hasRole(u, "OWNER"));
    const filteredManagedUsers = managedUsers.filter((u) => {
        if (userStatusFilter === "Active" && !u.enabled) return false;
        if (userStatusFilter === "Inactive" && u.enabled) return false;
        if (userSearch.trim()) {
            const q = userSearch.trim().toLowerCase();
            if (!(u.username || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });
    const totalUserPages = Math.max(1, Math.ceil(filteredManagedUsers.length / USERS_PER_PAGE));
    const currentUserPage = Math.min(userPage, totalUserPages);
    const paginatedUsers = filteredManagedUsers.slice(
        (currentUserPage - 1) * USERS_PER_PAGE,
        currentUserPage * USERS_PER_PAGE
    );

    useEffect(() => {
        setUserPage(1);
    }, [userSearch, userStatusFilter, users.length]);

    const handleAssignOwnerToCafe = async () => {
        if (!selectedOwnerId || !selectedCafeId) {
            showToast("Select an owner and a cafe.", "error");
            return;
        }
        setLoading(true);
        clearToast();
        try {
            await api.updateUserCafe(Number(selectedOwnerId), Number(selectedCafeId));
            loadUsers();
            loadCafes();
            loadStats();
            showToast("Owner assigned to cafe. Owner must accept in their dashboard.");
            setSelectedOwnerId(null);
            setSelectedCafeId(null);
        } catch (err) {
            showToast(err.message || "Failed to assign", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUnassignOwner = async (ownerUser) => {
        setLoading(true);
        clearToast();
        try {
            await api.updateUserCafe(ownerUser.id, null);
            loadUsers();
            loadStats();
            showToast("Owner unassigned from cafe.");
        } catch (err) {
            showToast(err.message || "Failed to unassign", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        setLoading(true);
        clearToast();
        try {
            const [usersData, cafesData, statsData, ordersData] = await Promise.all([
                api.getAdminUsers(),
                api.getAdminCafes(),
                api.getAdminStats(),
                api.getAdminOrders().catch(() => []),
            ]);
            const blob = new Blob([JSON.stringify({ users: usersData, cafes: cafesData, stats: statsData, orders: ordersData }, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `digital-cafe-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast("Export downloaded.");
        } catch (err) {
            showToast(err.message || "Export failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePurgeUserData = async () => {
        const confirmed = window.confirm(
            "This will permanently delete all non-admin users and their related orders from the database.\n\nAre you sure you want to continue?"
        );
        if (!confirmed) return;
        setLoading(true);
        clearToast();
        try {
            const result = await api.purgeUserData();
            loadUsers();
            loadOrders();
            loadStats();
            const deletedUsers = result?.deletedUsers ?? 0;
            const deletedOrders = result?.deletedOrders ?? 0;
            showToast(`Deleted ${deletedUsers} users and ${deletedOrders} related orders.`);
        } catch (err) {
            showToast(err.message || "Failed to delete user data", "error");
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // --- Derived, live metrics based on DB data ---
    const ordersWithDates = (orders || []).filter((o) => o.createdAt);
    const usersById = new Map((users || []).map((u) => [u.id, u]));

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const cutoff30 = now.getTime() - THIRTY_DAYS_MS;
    const cutoff7 = now.getTime() - SEVEN_DAYS_MS;
    const cutoffPrev7 = cutoff7 - SEVEN_DAYS_MS;

    const ordersLast30 = ordersWithDates.filter((o) => new Date(o.createdAt).getTime() >= cutoff30);
    const ordersLast7 = ordersWithDates.filter((o) => new Date(o.createdAt).getTime() >= cutoff7);
    const ordersPrev7 = ordersWithDates.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= cutoffPrev7 && t < cutoff7;
    });

    // Distinct customers with at least one order in last 30 days = "visitors"
    const customersLast30 = new Set(
        ordersLast30
            .map((o) => o.customer && o.customer.id)
            .filter((id) => id != null)
    );
    const totalVisitorsLast30 = customersLast30.size || stats.totalUsers || 0;

    // "Conversion" ≈ users who have at least one order / total registered users
    const allCustomerIds = new Set(
        ordersWithDates
            .map((o) => o.customer && o.customer.id)
            .filter((id) => id != null)
    );
    const convertedUsers = allCustomerIds.size;
    const totalUsers = stats.totalUsers || users.length || 0;
    const conversionRate = totalUsers > 0 ? (convertedUsers / totalUsers) * 100 : 0;

    // Growth WoW based on total orders last 7 days vs previous 7 days.
    const growthWoW =
        ordersPrev7.length === 0
            ? ordersLast7.length > 0
                ? 100
                : 0
            : ((ordersLast7.length - ordersPrev7.length) / ordersPrev7.length) * 100;

    // Active sessions = orders that are not PAID or CANCELLED
    const activeSessions = (orders || []).filter(
        (o) => o.status && o.status !== "PAID" && o.status !== "CANCELLED"
    ).length;

    // Bounce rate ≈ users with no orders
    const bouncedUsers = totalUsers - convertedUsers;
    const bounceRate = totalUsers > 0 ? (bouncedUsers / totalUsers) * 100 : 0;

    // Simple "avg session" = average orders per converted user (in minutes-style display below)
    const avgOrdersPerUser = convertedUsers > 0 ? stats.totalOrders / convertedUsers : 0;

    // Weekly bar chart: last 7 days, grouped by day of week.
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyCounts = new Map();
    const returningCounts = new Map();
    const seenCustomersBeforeDay = new Set();

    // Iterate in chronological order so "new vs returning" is meaningful.
    const ordersSorted = [...ordersLast7].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    ordersSorted.forEach((o) => {
        const created = new Date(o.createdAt);
        const dayLabel = weekdayLabels[created.getDay()];
        const customerId = o.customer && o.customer.id;
        const key = dayLabel;
        if (!weeklyCounts.has(key)) weeklyCounts.set(key, { users: 0, returning: 0 });
        const entry = weeklyCounts.get(key);
        if (customerId == null || !usersById.has(customerId)) {
            entry.users += 1;
        } else if (seenCustomersBeforeDay.has(customerId)) {
            entry.returning += 1;
        } else {
            entry.users += 1;
            seenCustomersBeforeDay.add(customerId);
        }
        weeklyCounts.set(key, entry);
    });

    const weeklyData = weekdayLabels.map((label) => ({
        day: label,
        users: (weeklyCounts.get(label) || {}).users || 0,
        returning: (weeklyCounts.get(label) || {}).returning || 0,
    }));

    // Visitors pie: total new vs returning customers overall
    const orderCountsPerCustomer = new Map();
    ordersWithDates.forEach((o) => {
        const id = o.customer && o.customer.id;
        if (id == null) return;
        orderCountsPerCustomer.set(id, (orderCountsPerCustomer.get(id) || 0) + 1);
    });
    let newCustomersCount = 0;
    let returningCustomersCount = 0;
    orderCountsPerCustomer.forEach((count) => {
        if (count <= 1) newCustomersCount += 1;
        else returningCustomersCount += 1;
    });
    const visitorsPie = [
        { name: "New", value: newCustomersCount },
        { name: "Returning", value: returningCustomersCount },
        { name: "Other", value: Math.max(totalVisitorsLast30 - newCustomersCount - returningCustomersCount, 0) },
    ];

    // Orders by status — useful overview of open vs completed orders
    const orderStatusCounts = (orders || []).reduce((acc, o) => {
        const status = o.status || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    const orderStatusChartData = Object.entries(orderStatusCounts).map(([status, count]) => ({
        status,
        count,
    }));
    const ordersTotalRevenue = (orders || []).reduce(
        (sum, o) => sum + (Number(o.totalAmount) || 0),
        0
    );
    const adminStatusPieData = orderStatusChartData.map((item) => ({
        name: item.status,
        value: item.count,
    }));
    const peakTrafficDay = weeklyData.reduce((best, current) => {
        const currentTotal = (current.users || 0) + (current.returning || 0);
        const bestTotal = (best?.users || 0) + (best?.returning || 0);
        return currentTotal > bestTotal ? current : best;
    }, weeklyData[0] || { day: "N/A", users: 0, returning: 0 });
    const mostCommonStatus = orderStatusChartData.reduce((best, current) => (
        !best || current.count > best.count ? current : best
    ), null);
    const highestRevenueDay = ordersWithDates.reduce((accumulator, order) => {
        const key = new Date(order.createdAt).toISOString().slice(0, 10);
        accumulator[key] = (accumulator[key] || 0) + Number(order.totalAmount || 0);
        return accumulator;
    }, {});
    const highestRevenueEntry = Object.entries(highestRevenueDay).reduce((best, current) => (
        !best || current[1] > best[1] ? current : best
    ), null);
    const adminAnalyticsKpis = [
        {
            key: "cafes",
            accent: "sky",
            label: "Total Cafes",
            value: stats.totalCafes,
            change: growthWoW / 2,
            meta: "Active cafe locations",
        },
        {
            key: "orders",
            accent: "emerald",
            label: "Total Orders",
            value: stats.totalOrders,
            change: growthWoW,
            meta: "All-time order volume",
        },
        {
            key: "revenue",
            accent: "violet",
            label: "Total Revenue",
            value: formatAdminOrderCurrency(ordersTotalRevenue),
            change: growthWoW,
            meta: "Gross platform revenue",
        },
        {
            key: "sessions",
            accent: "amber",
            label: "Active Sessions",
            value: activeSessions,
            change: conversionRate - bounceRate,
            meta: "Orders still in progress",
        },
    ];
    const adminInsights = [
        {
            key: "peak",
            accent: "sky",
            label: "Peak Day",
            value: peakTrafficDay?.day || "N/A",
            meta: `${(peakTrafficDay?.users || 0) + (peakTrafficDay?.returning || 0)} customer sessions`,
        },
        {
            key: "status",
            accent: "amber",
            label: "Most Common Status",
            value: mostCommonStatus?.status || "N/A",
            meta: `${mostCommonStatus?.count || 0} orders in this state`,
        },
        {
            key: "revenue-day",
            accent: "violet",
            label: "Highest Revenue Day",
            value: highestRevenueEntry ? formatAdminDateTime(highestRevenueEntry[0]).split(",")[0] : "N/A",
            meta: highestRevenueEntry ? formatAdminOrderCurrency(highestRevenueEntry[1]) : "No revenue data",
        },
    ];
    const activeAdminStatusSliceData = activeAdminAnalyticsSlice != null
        ? adminStatusPieData[activeAdminAnalyticsSlice] || null
        : null;
    const normalizedOrderSearch = orderSearch.trim().toLowerCase();
    const filteredOrders = [...(orders || [])]
        .filter((order) => {
            const matchesSearch = !normalizedOrderSearch
                || String(order.orderNumber || "").toLowerCase().includes(normalizedOrderSearch)
                || String(order.id || "").toLowerCase().includes(normalizedOrderSearch)
                || String(order.customer?.username || "").toLowerCase().includes(normalizedOrderSearch)
                || String(order.customer?.email || "").toLowerCase().includes(normalizedOrderSearch);
            const matchesStatus = orderStatusFilter === "ALL" || String(order.status || "") === orderStatusFilter;
            const matchesDate = !orderDateFilter
                || (order.createdAt && new Date(order.createdAt).toISOString().slice(0, 10) === orderDateFilter);
            return matchesSearch && matchesStatus && matchesDate;
        })
        .sort((left, right) => {
            if (orderSort.key === "totalAmount") {
                const amountDelta = Number(left?.totalAmount || 0) - Number(right?.totalAmount || 0);
                return orderSort.direction === "asc" ? amountDelta : -amountDelta;
            }
            const dateDelta = new Date(left?.createdAt || 0).getTime() - new Date(right?.createdAt || 0).getTime();
            return orderSort.direction === "asc" ? dateDelta : -dateDelta;
        });
    const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ADMIN_ORDER_PAGE_SIZE));
    const safeOrderPage = Math.min(orderPage, totalOrderPages);
    const paginatedOrders = filteredOrders.slice(
        (safeOrderPage - 1) * ADMIN_ORDER_PAGE_SIZE,
        safeOrderPage * ADMIN_ORDER_PAGE_SIZE
    );

    useEffect(() => {
        setOrderPage(1);
    }, [orderSearch, orderStatusFilter, orderDateFilter, orderSort]);

    useEffect(() => {
        if (orderPage !== safeOrderPage) {
            setOrderPage(safeOrderPage);
        }
    }, [orderPage, safeOrderPage]);

    const toggleOrderSort = (key) => {
        setOrderSort((current) => {
            if (current.key === key) {
                return {
                    key,
                    direction: current.direction === "asc" ? "desc" : "asc",
                };
            }
            return { key, direction: "desc" };
        });
    };

    const getOrderSortIndicator = (key) => {
        if (orderSort.key !== key) return "Sort";
        return orderSort.direction === "asc" ? "Ascending" : "Descending";
    };

    const projectsActivity = [
        { name: "Digital Cafe", status: "Developing", progress: 75, color: "#ef4444" },
        { name: "Menu System", status: "Updating", progress: 90, color: "#22c55e" },
        { name: "Orders Module", status: "Updating", progress: 85, color: "#22c55e" },
        { name: "Payments", status: "Support", progress: 100, color: "#16a34a" },
        { name: "Reports", status: "Support", progress: 100, color: "#16a34a" },
    ];

    const salesLineData = [
        { date: "Jan 12", sales: 5, events: 3 },
        { date: "Jan 19", sales: 8, events: 5 },
        { date: "Jan 26", sales: 12, events: 7 },
        { date: "Feb 2", sales: 15, events: 10 },
        { date: "Feb 10", sales: 18, events: 14 },
    ];

    const executeSection = (
        <div className="sidebar-execute">
            <div className="execute-actions">
                <button type="button" className={`execute-btn ${activePanel === "orders" ? "active" : ""}`} onClick={() => setActivePanel(activePanel === "orders" ? "reports" : "orders")}>Orders</button>
                <button type="button" className={`execute-btn ${activePanel === "users" ? "active" : ""}`} onClick={() => setActivePanel(activePanel === "users" ? "reports" : "users")}>Staff</button>
                <button type="button" className={`execute-btn ${activePanel === "cafes" ? "active" : ""}`} onClick={() => setActivePanel(activePanel === "cafes" ? "reports" : "cafes")}>Manage Cafes</button>
                <button type="button" className={`execute-btn ${activePanel === "owners-cafes" ? "active" : ""}`} onClick={() => setActivePanel(activePanel === "owners-cafes" ? "reports" : "owners-cafes")}>Owners & Cafes</button>
                <button type="button" className={`execute-btn ${activePanel === "reports" ? "active" : ""}`} onClick={() => setActivePanel("reports")}>View Reports</button>
                <button type="button" className={`execute-btn ${activePanel === "settings" ? "active" : ""}`} onClick={() => setActivePanel(activePanel === "settings" ? "reports" : "settings")}>Settings</button>
            </div>
        </div>
    );

    return (
        <DashboardLayout title={user.username} role="ADMIN" sidebarExtra={executeSection}>
            {message && <div className={`admin-toast admin-toast-${messageType}`}>{message}</div>}
            <div className="dashboard dashboard-admin">
                <header className="admin-dashboard-header">
                    <div className="admin-dashboard-header-inner">
                        <div>
                            <h1 className="admin-dashboard-title">Admin Dashboard</h1>
                            <p className="admin-dashboard-subtitle">Manage your digital café platform.</p>
                        </div>
                    </div>
                </header>

                {/* Staff panel */}
                {activePanel === "users" && (
                    <div className="admin-panel admin-user-management">
                        <header className="admin-section-header">
                            <div>
                                <h2 className="admin-section-title">Staff Management</h2>
                                <p className="admin-section-subtitle">Manage registered staff, approvals, and role-based access.</p>
                            </div>
                            <div className="admin-header-actions">
                                <button
                                    type="button"
                                    className="admin-create-owner-btn"
                                    onClick={() => setShowCreateOwnerForm((prev) => !prev)}
                                    title="Create Cafe Owner"
                                >
                                    <span className="admin-plus-icon">+</span>
                                    {showCreateOwnerForm ? "Hide Popup" : "Create Cafe Owner"}
                                </button>
                            </div>
                        </header>

                        {/* Pending approvals table */}
                        <div className="admin-card-tile user-list-tile">
                            <h3 className="admin-card-tile-title">Pending approvals</h3>
                            <p className="admin-card-tile-desc">
                                Users listed here do not have active access yet. Approve to enable the account or keep them inactive.
                            </p>
                            <div className="data-table-wrap admin-users-table-wrap">
                                <table className="data-table admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Roles</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(users || [])
                                            .filter((u) => !u.enabled && !hasRole(u, "OWNER"))
                                            .map((u) => {
                                                const roleNames = (u.roles || [])
                                                    .map((r) => normalizeRole(r) || (r?.name ?? r))
                                                    .filter(Boolean)
                                                    .join(", ") || "—";
                                                return (
                                                    <tr key={`pending-${u.id}`}>
                                                        <td>{u.username}</td>
                                                        <td>{roleNames}</td>
                                                        <td>{u.email}</td>
                                                        <td>INACTIVE</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="admin-btn-success btn-sm"
                                                                onClick={() => handleToggleUserEnabled(u)}
                                                            >
                                                                Approve
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {(users || []).filter((u) => !u.enabled && !hasRole(u, "OWNER")).length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: "center", fontSize: "0.9rem" }}>
                                                    No pending approvals. All staff accounts are active or disabled.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Filters + user tiles (all staff) */}
                        <div className="admin-card-tile user-list-tile">
                            <div className="admin-filters">
                                <div className="admin-filter-group">
                                    <label>Status</label>
                                    <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                                        <option value="All">All</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="admin-filter-group admin-search">
                                    <label>Search</label>
                                    <input
                                        type="text"
                                        placeholder="Email or username"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="admin-user-card-grid">
                                {!paginatedUsers.length ? (
                                    <p className="empty-msg" style={{ gridColumn: "1/-1" }}>
                                        No users found for current filters.
                                    </p>
                                ) : (
                                    paginatedUsers.map((u) => {
                                        const isAdmin = isAdminUser(u);
                                        const statusLabel = u.enabled ? "Active" : "Inactive";
                                        return (
                                            <div key={u.id} className="admin-user-card">
                                                <div className="admin-user-card-header">
                                                    <div className="admin-user-avatar">
                                                        {(u.username || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="admin-user-main">
                                                        <div className="admin-user-name">{u.username}</div>
                                                        <div className="admin-user-email">{u.email}</div>
                                                    </div>
                                                    <div className="admin-user-status-select">
                                                        <span className={`badge-pill ${u.enabled ? "badge-success" : "badge-muted"}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="admin-user-card-body">
                                                    <div className="admin-user-role-pill">{roleNames(u)}</div>
                                                </div>
                                                <div className="admin-user-card-footer">
                                                    {isAdmin ? (
                                                        <span className="admin-user-note">Admin account (no actions)</span>
                                                    ) : u.enabled ? (
                                                        <button
                                                            type="button"
                                                            className="admin-btn-danger btn-sm"
                                                            onClick={() => handleToggleUserEnabled(u)}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="admin-btn-success btn-sm"
                                                            onClick={() => handleToggleUserEnabled(u)}
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="admin-pagination">
                                <button
                                    type="button"
                                    className="btn-sm"
                                    disabled={currentUserPage <= 1}
                                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <span>Page {currentUserPage} of {totalUserPages}</span>
                                <button
                                    type="button"
                                    className="btn-sm"
                                    disabled={currentUserPage >= totalUserPages}
                                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        {/* Create Cafe Owner wizard is rendered below, outside this panel */}
                    </div>
                )}

                {/* Manage Cafes panel */}
                {activePanel === "cafes" && (
                    <div className="admin-panel">
                        <h3>Manage Cafes (from DB)</h3>
                        <p className="panel-meta">
                            Create cafe using the step-wise registration flow to capture owner, logo, gallery images and bank details.
                        </p>
                        <button
                            type="button"
                            className="admin-create-owner-btn"
                            onClick={() => {
                                setShowCreateOwnerForm(true);
                                setOwnerWizardStep(0);
                            }}
                        >
                            <span className="admin-plus-icon">+</span>
                            Add New Cafe (Step-wise)
                        </button>
                        <div className="cafe-filters">
                            <label className="cafe-filter-field">
                                <span>Search by cafe name</span>
                                <input
                                    className="cafe-filter-input"
                                    type="text"
                                    value={cafeSearch}
                                    onChange={(e) => setCafeSearch(e.target.value)}
                                    placeholder="e.g. Central Perk"
                                />
                            </label>
                            <label className="cafe-filter-field">
                                <span>Filter by city/location</span>
                                <input
                                    className="cafe-filter-input"
                                    type="text"
                                    value={cafeLocationFilter}
                                    onChange={(e) => setCafeLocationFilter(e.target.value)}
                                    placeholder="e.g. Bengaluru"
                                />
                            </label>
                        </div>
                        <div className="cafes-list">
                            {filteredCafes.map((c) => (
                                <div key={c.id} className="cafe-list-row">
                                    <div className="cafe-list-main">
                                        {c.logoUrl ? (
                                            <img
                                                src={c.logoUrl}
                                                alt={`${c.name} logo`}
                                                className="cafe-list-logo"
                                            />
                                        ) : (
                                            <div className="cafe-list-logo cafe-list-logo-placeholder">
                                                {(c.name || "C").slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="cafe-list-copy">
                                            <strong className="cafe-list-name">{c.name}</strong>
                                            <span className="cafe-list-location">{getCafeLocationLabel(c.address)}</span>
                                        </div>
                                    </div>
                                    <div className="cafe-list-address">{c.address || "No address available"}</div>
                                    <div className="cafe-list-revenue">{formatCurrency(c.revenue)}</div>
                                    <div className="cafe-list-actions">
                                        <button
                                            type="button"
                                            className="execute-btn btn-sm"
                                            onClick={() => setEditingCafeId((current) => (current === c.id ? null : c.id))}
                                        >
                                            {editingCafeId === c.id ? "Close" : "Update"}
                                        </button>
                                    </div>
                                    {editingCafeId === c.id && (
                                        <form onSubmit={(e) => handleUpdateCafe(e, c)} className="admin-form cafe-inline-edit-form">
                                            <div className="cafe-inline-section">
                                                <h4 className="cafe-inline-section-title">Cafe Info</h4>
                                                <div className="cafe-card-grid">
                                                    <label className="cafe-field">
                                                        <span>Name</span>
                                                        <input name="editName" defaultValue={c.name} placeholder="e.g. Central Perk Cafe" required />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>Phone</span>
                                                        <input name="editPhone" defaultValue={c.phone || ""} placeholder="e.g. +91 9876543210" />
                                                    </label>
                                                    <label className="cafe-field cafe-card-span-2">
                                                        <span>Address</span>
                                                        <input name="editAddress" defaultValue={c.address || ""} placeholder="e.g. MG Road, Bengaluru" />
                                                    </label>
                                                    <label className="cafe-field cafe-card-span-2">
                                                        <span>Description</span>
                                                        <input name="editDesc" defaultValue={c.description || ""} placeholder="e.g. Cozy cafe with specialty coffee" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="cafe-inline-section">
                                                <h4 className="cafe-inline-section-title">Branding</h4>
                                                <div className="cafe-card-grid">
                                                    <label className="cafe-field">
                                                        <span>Logo URL</span>
                                                        <input name="editLogoUrl" defaultValue={c.logoUrl || ""} placeholder="e.g. https://example.com/logo.png" />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>Image URLs</span>
                                                        <input name="editImageUrls" defaultValue={c.imageUrls || ""} placeholder="e.g. img1.jpg, img2.jpg" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="cafe-inline-section">
                                                <h4 className="cafe-inline-section-title">Bank Details</h4>
                                                <div className="cafe-card-grid">
                                                    <label className="cafe-field">
                                                        <span>Account Holder</span>
                                                        <input name="editBankAccountHolder" defaultValue={c.bankAccountHolder || ""} placeholder="e.g. Cafe Foods Pvt Ltd" />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>Bank Name</span>
                                                        <input name="editBankName" defaultValue={c.bankName || ""} placeholder="e.g. HDFC Bank" />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>Account Number</span>
                                                        <input name="editBankAccountNumber" defaultValue={c.bankAccountNumber || ""} placeholder="e.g. 1234567890" />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>IFSC Code</span>
                                                        <input name="editBankIfscCode" defaultValue={c.bankIfscCode || ""} placeholder="e.g. HDFC0001234" />
                                                    </label>
                                                    <label className="cafe-field">
                                                        <span>Revenue</span>
                                                        <input name="editRevenue" type="number" step="0.01" min="0" defaultValue={c.revenue != null ? c.revenue : ""} placeholder="e.g. 150000" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="cafe-inline-edit-actions">
                                                <button type="submit" className="execute-btn btn-sm" disabled={loading}>Save</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ))}
                            {filteredCafes.length === 0 && !loading && (
                                <p className="empty-msg">
                                    {cafes.length === 0
                                        ? "No cafes. Add one with the step-wise button above."
                                        : "No cafes match the current search or location filter."}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Owners & Cafes panel — selection-based (no dropdowns) */}
                {activePanel === "owners-cafes" && (
                    <div className="admin-panel">
                        <h3>Owners &amp; Cafes</h3>
                        <p className="panel-meta">Select an OWNER on the left and a cafe on the right, then click Assign. Owners must accept the assignment in their dashboard.</p>
                        <div className="owners-cafes-layout">
                            <div className="owners-list">
                                <h4>Owners</h4>
                                {owners.length === 0 && <p className="empty-msg">No staff with OWNER role yet.</p>}
                                {owners.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        className={`owners-row ${selectedOwnerId === u.id ? "selected" : ""}`}
                                        onClick={() => setSelectedOwnerId(u.id)}
                                    >
                                        <span className="owners-row-main">{u.username}</span>
                                        <span className="owners-row-sub">{u.email}</span>
                                        <span className="owners-row-pill">
                                            {u.cafe ? u.cafe.name : "No cafe"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="owners-cafes-right">
                                <div className="cafes-select-list">
                                    <h4>Cafes</h4>
                                    {cafes.length === 0 && <p className="empty-msg">No cafes in database.</p>}
                                    {cafes.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={`owners-row ${selectedCafeId === c.id ? "selected" : ""}`}
                                            onClick={() => setSelectedCafeId(c.id)}
                                        >
                                            <span className="owners-row-main">{c.name}</span>
                                            <span className="owners-row-sub">{c.address || "No address"}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    className="execute-btn owners-assign-btn"
                                    onClick={handleAssignOwnerToCafe}
                                    disabled={
                                        loading ||
                                        owners.length === 0 ||
                                        cafes.length === 0 ||
                                        !selectedOwnerId ||
                                        !selectedCafeId
                                    }
                                >
                                    {loading ? "Assigning…" : "Assign owner to selected cafe"}
                                </button>
                            </div>
                        </div>
                        <div className="data-table-wrap" style={{ display: "none" }}>
                            <table className="data-table">
                                <thead><tr><th>Owner</th><th>Email</th><th>Cafe</th><th>Accepted</th><th>Action</th></tr></thead>
                                <tbody>
                                    {owners.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.cafe ? u.cafe.name : "—"}</td>
                                            <td>{u.cafe ? (u.ownerAssignmentAccepted ? "Yes" : "No (pending)") : "—"}</td>
                                            <td>
                                                {u.cafe && (
                                                    <button type="button" className="btn-sm" onClick={() => handleUnassignOwner(u)} disabled={loading}>
                                                        Unassign
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {owners.length === 0 && <p className="empty-msg">No staff with OWNER role. Create one in Staff with role OWNER.</p>}
                    </div>
                )}

                {/* Orders panel */}
                {activePanel === "orders" && (
                    <div className="admin-panel">
                        <h3>Customer Orders &amp; Engagement</h3>
                        <p className="panel-meta">High‑level engagement metrics plus the detailed orders table below.</p>
                        <div className="card-grid admin-cards" style={{ marginBottom: 16 }}>
                            <div className="card admin-card">
                                <h3>Total orders</h3>
                                <p>{stats.totalOrders}</p>
                            </div>
                            <div className="card admin-card">
                                <h3>Revenue (all orders)</h3>
                                <p>${ordersTotalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="card admin-card">
                                <h3>Active sessions</h3>
                                <p>{activeSessions}</p>
                            </div>
                            <div className="card admin-card">
                                <h3>Conversion (all time)</h3>
                                <p>{conversionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="chart-container owner-orders-table">
                            <div className="owner-orders-table-header">
                                <div>
                                    <p className="owner-orders-table-eyebrow">Order overview</p>
                                    <h3>Orders management</h3>
                                </div>
                                <span className="owner-orders-table-count">
                                    Showing {paginatedOrders.length} of {filteredOrders.length}
                                </span>
                            </div>
                            <div className="owner-orders-toolbar">
                                <label className="owner-orders-control owner-orders-search">
                                    <span>Search by order ID</span>
                                    <input
                                        type="search"
                                        value={orderSearch}
                                        onChange={(event) => setOrderSearch(event.target.value)}
                                        placeholder="Order number, ID, customer"
                                    />
                                </label>
                                <label className="owner-orders-control">
                                    <span>Status</span>
                                    <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                                        <option value="ALL">All statuses</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="PAID">Paid</option>
                                        <option value="READY">Ready</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </label>
                                <label className="owner-orders-control">
                                    <span>Date</span>
                                    <input type="date" value={orderDateFilter} onChange={(event) => setOrderDateFilter(event.target.value)} />
                                </label>
                            </div>
                            {filteredOrders.length > 0 ? (
                                <div className="data-table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Order #</th>
                                                <th>Actions</th>
                                                <th>Status</th>
                                                <th>
                                                    <button type="button" className="owner-orders-sort-btn" onClick={() => toggleOrderSort("totalAmount")}>
                                                        Amount
                                                        <span>{getOrderSortIndicator("totalAmount")}</span>
                                                    </button>
                                                </th>
                                                <th>
                                                    <button type="button" className="owner-orders-sort-btn" onClick={() => toggleOrderSort("createdAt")}>
                                                        Date
                                                        <span>{getOrderSortIndicator("createdAt")}</span>
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedOrders.map((order) => (
                                                <tr key={order.id} className="owner-orders-table-row">
                                                    <td>{order.orderNumber}</td>
                                                    <td>
                                                        <div className="owner-order-actions">
                                                            <button type="button" className="owner-order-action-btn" title="View Details" aria-label={`View details for order ${order.orderNumber}`} onClick={() => setSelectedOrder(order)}>
                                                                <OrderActionIcon />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`owner-order-status-badge owner-order-status-${String(order.status || "unknown").toLowerCase()}`}>
                                                            {order.status || "UNKNOWN"}
                                                        </span>
                                                    </td>
                                                    <td>{formatAdminOrderCurrency(order.totalAmount)}</td>
                                                    <td>{formatAdminDateTime(order.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                            {orders.length > 0 && filteredOrders.length > 0 && (
                                <div className="owner-orders-pagination">
                                    <p className="owner-orders-pagination-summary">Page {safeOrderPage} of {totalOrderPages}</p>
                                    <div className="owner-orders-pagination-actions">
                                        <button type="button" onClick={() => setOrderPage((current) => Math.max(1, current - 1))} disabled={safeOrderPage === 1}>Previous</button>
                                        <button type="button" onClick={() => setOrderPage((current) => Math.min(totalOrderPages, current + 1))} disabled={safeOrderPage === totalOrderPages}>Next</button>
                                    </div>
                                </div>
                            )}
                            {orders.length === 0 && (
                                <div className="owner-orders-empty-state">
                                    <div className="owner-orders-empty-illustration" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <h4>No orders yet</h4>
                                    <p>No orders yet. Customer orders will appear here automatically.</p>
                                </div>
                            )}
                            {orders.length > 0 && filteredOrders.length === 0 && <p className="empty-msg">No orders match the current search or filters.</p>}
                            {selectedOrder && (
                                <div className="owner-order-modal-overlay" onClick={() => setSelectedOrder(null)}>
                                    <div className="owner-order-modal-card" onClick={(event) => event.stopPropagation()}>
                                        <div className="owner-order-modal-head">
                                            <div>
                                                <p className="owner-order-modal-kicker">Order details</p>
                                                <h3>{selectedOrder.orderNumber}</h3>
                                            </div>
                                            <button type="button" className="owner-order-modal-close" onClick={() => setSelectedOrder(null)}>Close</button>
                                        </div>
                                        <div className="owner-order-modal-grid">
                                            <div><span>Status</span><strong>{selectedOrder.status || "UNKNOWN"}</strong><p>Current order lifecycle stage</p></div>
                                            <div><span>Total amount</span><strong>{formatAdminOrderCurrency(selectedOrder.totalAmount)}</strong><p>Captured from the system total</p></div>
                                            <div><span>Customer</span><strong>{selectedOrder.customer?.username || "Walk-in"}</strong><p>{selectedOrder.customer?.email || "No customer account linked"}</p></div>
                                            <div><span>Cafe</span><strong>{selectedOrder.cafe?.name || "No cafe assigned"}</strong><p>{selectedOrder.cafeTable?.tableNumber || "No table assigned"}</p></div>
                                            <div><span>Prepared By</span><strong>{selectedOrder.preparedBy?.username || "Not recorded"}</strong><p>{selectedOrder.preparedBy?.email || "Chef attribution not available"}</p></div>
                                            <div><span>Served By</span><strong>{selectedOrder.servedBy?.username || "Not served yet"}</strong><p>{selectedOrder.servedBy?.email || "Serving record not available"}</p></div>
                                            <div><span>Reservation slot</span><strong>{selectedOrder.reservationTimeSlot || "Not specified"}</strong><p>{selectedOrder.reservationDate || "No reservation date"}</p></div>
                                            <div><span>Guests</span><strong>{selectedOrder.guestCount || 0} guests</strong><p>{[selectedOrder.seatingPreference, selectedOrder.seatingNotes].filter(Boolean).join(" • ") || "No seating notes"}</p></div>
                                            <div><span>Created</span><strong>{formatAdminDateTime(selectedOrder.createdAt)}</strong><p>Order placement time</p></div>
                                            <div><span>Updated</span><strong>{formatAdminDateTime(selectedOrder.updatedAt)}</strong><p>Last system update</p></div>
                                            <div><span>Payment</span><strong>{selectedOrder.paymentProvider || "Not captured"}</strong><p>{selectedOrder.paymentCapturedAt ? `Captured ${formatAdminDateTime(selectedOrder.paymentCapturedAt)}` : "Payment capture pending"}</p></div>
                                            <div><span>Payment Reference</span><strong>{selectedOrder.razorpayPaymentId || selectedOrder.razorpayOrderId || "No payment reference"}</strong><p>{selectedOrder.razorpayOrderId ? `Order ref: ${selectedOrder.razorpayOrderId}` : "No gateway order reference"}</p></div>
                                        </div>
                                        <div className="owner-order-modal-items">
                                            <div className="owner-order-modal-items-head">
                                                <h4>Items</h4>
                                                <span>{selectedOrder.items?.length || 0} line items</span>
                                            </div>
                                            {(selectedOrder.items || []).length === 0 ? (
                                                <p className="empty-msg">No order items available.</p>
                                            ) : (
                                                (selectedOrder.items || []).map((item) => (
                                                    <div key={item.id || `${item.menuItem?.id}-${item.menuItem?.name}`} className="owner-order-modal-item">
                                                        <div>
                                                            <strong>{item.menuItem?.name || "Menu item"}</strong>
                                                            <p>{[item.menuItem?.category, item.specialInstructions].filter(Boolean).join(" • ") || "No special instructions"}</p>
                                                        </div>
                                                        <div className="owner-order-modal-item-meta">
                                                            <span>Qty {item.quantity || 0}</span>
                                                            <strong>{formatAdminOrderCurrency(item.unitPrice)}</strong>
                                                            <p>{selectedOrder.reservationTimeSlot ? `Served in slot ${selectedOrder.reservationTimeSlot}` : "No slot recorded"}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="data-table-wrap" style={{ display: "none" }}>
                            <table className="data-table">
                                <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th></tr></thead>
                                <tbody>
                                    {(orders || []).map((o) => (
                                        <tr key={o.id}>
                                            <td>{o.orderNumber}</td>
                                            <td>{o.customer ? (o.customer.username || o.customer.email || "—") : "Guest"}</td>
                                            <td>{o.status}</td>
                                            <td>{o.totalAmount != null ? `$${Number(o.totalAmount).toFixed(2)}` : "—"}</td>
                                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {false && orders && orders.length === 0 && <p className="empty-msg">No orders yet. Orders will appear here when customers place them from the Menu.</p>}
                    </div>
                )}

                {/* View Reports panel */}
                {activePanel === "reports" && (
                    <div className="owner-analytics">
                        <div className="owner-analytics-header">
                            <div>
                                <p className="owner-analytics-eyebrow">Performance overview</p>
                                <h3>Reports &amp; Analytics</h3>
                            </div>
                            <div className="owner-analytics-header-actions">
                                <p className="owner-analytics-subcopy">
                                    Review platform-wide KPI summaries, customer traffic patterns, revenue movement, and order status distribution.
                                </p>
                            </div>
                        </div>

                        <section className="owner-analytics-section">
                            <div className="owner-analytics-section-head">
                                <h4>KPI Overview</h4>
                            </div>
                            <div className="owner-analytics-grid owner-analytics-grid-kpi">
                                {adminAnalyticsKpis.map((kpi) => (
                                    <div
                                        key={kpi.key}
                                        className={`owner-analytics-card owner-analytics-kpi-card owner-analytics-kpi-card-${kpi.accent}`}
                                    >
                                        <div className="owner-analytics-kpi-top">
                                            <span className="owner-analytics-kpi-icon">
                                                <AdminAnalyticsKpiIcon type={kpi.key} />
                                            </span>
                                            <span className={`owner-analytics-kpi-change ${kpi.change >= 0 ? "is-positive" : "is-negative"}`}>
                                                {formatAdminPercentChange(kpi.change)}
                                            </span>
                                        </div>
                                        <strong>{typeof kpi.value === "number" ? formatAdminCompactNumber(kpi.value) : kpi.value}</strong>
                                        <span className="owner-analytics-kpi-label">{kpi.label}</span>
                                        <p className="owner-analytics-kpi-meta">{kpi.meta}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="owner-analytics-section">
                            <div className="owner-analytics-section-head">
                                <h4>Trends &amp; Performance</h4>
                                <p className="owner-analytics-filter-summary">Live system-wide analytics from the connected admin dataset.</p>
                            </div>
                            <div className="owner-analytics-grid owner-analytics-grid-trends">
                                <div className="owner-analytics-card owner-analytics-chart-card">
                                    <h5>Customer Trend</h5>
                                    <div className="owner-chart-wrap owner-chart-wrap-animated">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={weeklyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.24)" vertical={false} />
                                                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#64748b" />
                                                <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
                                                <Tooltip
                                                    formatter={(value, name) => [formatAdminCompactNumber(value), name === "users" ? "New customers" : "Returning customers"]}
                                                    contentStyle={{ background: "#ffffff", border: "1px solid rgba(148, 163, 184, 0.4)", borderRadius: 16 }}
                                                />
                                                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive animationDuration={900} />
                                                <Line type="monotone" dataKey="returning" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive animationDuration={900} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="owner-analytics-card owner-analytics-chart-card">
                                    <h5>Revenue Trend</h5>
                                    <div className="owner-chart-wrap owner-chart-wrap-animated">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={salesLineData}>
                                                <defs>
                                                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.34} />
                                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.24)" vertical={false} />
                                                <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#64748b" />
                                                <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
                                                <Tooltip
                                                    formatter={(value, name) => [
                                                        name === "sales" ? formatAdminOrderCurrency(value) : formatAdminCompactNumber(value),
                                                        name === "sales" ? "Revenue" : "Events",
                                                    ]}
                                                    contentStyle={{ background: "#ffffff", border: "1px solid rgba(148, 163, 184, 0.4)", borderRadius: 16 }}
                                                />
                                                <Area type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={3} fill="url(#adminRevenueFill)" isAnimationActive animationDuration={950} />
                                                <Line type="monotone" dataKey="events" stroke="#f97316" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={950} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="owner-analytics-section">
                            <div className="owner-analytics-section-head">
                                <h4>Insights &amp; Distribution</h4>
                            </div>
                            <div className="owner-analytics-grid owner-analytics-grid-insights">
                                <div className="owner-analytics-card owner-analytics-chart-card">
                                    <h5>Order Status Distribution</h5>
                                    <div className="owner-chart-wrap owner-chart-wrap-animated">
                                        {adminStatusPieData.length === 0 ? (
                                            <p className="empty-msg">No order data yet.</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={260}>
                                                <PieChart>
                                                    <Pie
                                                        data={adminStatusPieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={88}
                                                        innerRadius={42}
                                                        paddingAngle={3}
                                                        onMouseEnter={(_, index) => setActiveAdminAnalyticsSlice(index)}
                                                        onMouseLeave={() => setActiveAdminAnalyticsSlice(null)}
                                                        isAnimationActive
                                                        animationDuration={900}
                                                    >
                                                        {adminStatusPieData.map((entry, idx) => (
                                                            <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value, name) => {
                                                            const total = adminStatusPieData.reduce((sum, item) => sum + item.value, 0);
                                                            const percent = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                                                            return [`${value} orders (${percent}%)`, name];
                                                        }}
                                                        contentStyle={{ background: "#ffffff", border: "1px solid rgba(148, 163, 184, 0.4)", borderRadius: 16 }}
                                                    />
                                                    <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="owner-analytics-donut-total">
                                                        {activeAdminStatusSliceData ? formatAdminCompactNumber(activeAdminStatusSliceData.value) : formatAdminCompactNumber(orders.length)}
                                                    </text>
                                                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="owner-analytics-donut-label">
                                                        {activeAdminStatusSliceData ? activeAdminStatusSliceData.name : "Total Orders"}
                                                    </text>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                                <div className="owner-analytics-card owner-analytics-insight-card">
                                    <h5>Insights</h5>
                                    <div className="owner-analytics-insights-list">
                                        {adminInsights.map((insight) => (
                                            <div
                                                key={insight.key}
                                                className={`owner-analytics-insight-pill owner-analytics-insight-pill-${insight.accent}`}
                                            >
                                                <span className="owner-analytics-insight-icon" aria-hidden="true" />
                                                <div>
                                                    <strong>{insight.label}: {insight.value}</strong>
                                                    <p>{insight.meta}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Settings panel */}
                {activePanel === "settings" && (
                    <div className="admin-panel">
                        <h3>Settings</h3>
                        <p>Manage your admin profile, data export and security. These settings do not affect customer registration or the public site.</p>
                        <div className="admin-card-tile">
                            <h4 className="admin-card-tile-title">Admin profile</h4>
                            <p className="admin-card-tile-desc">
                                Signed in as <strong>{user.username}</strong>. Use Staff and Owners &amp; Cafes to manage other users.
                            </p>
                        </div>
                        <div className="admin-card-tile">
                            <h4 className="admin-card-tile-title">Data export</h4>
                            <p className="admin-card-tile-desc">
                                Download a JSON backup of users, cafes, stats and orders for analysis or offline storage.
                            </p>
                            <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={handleExportData}
                                disabled={loading}
                            >
                                {loading ? "Exporting…" : "Export data"}
                            </button>
                        </div>
                        <div className="admin-card-tile">
                            <h4 className="admin-card-tile-title">Security</h4>
                            <p className="admin-card-tile-desc">
                                Reset your admin password. You will receive an email with further instructions.
                            </p>
                            <Link to="/forgot-password" className="admin-btn-link">
                                Reset password
                            </Link>
                        </div>
                        <div className="admin-card-tile danger-zone">
                            <h4 className="admin-card-tile-title">Danger zone: delete user data</h4>
                            <p className="admin-card-tile-desc">
                                This will permanently delete <strong>all non-admin users</strong> and their related orders from the database.
                                Admin accounts are kept so the system remains accessible.
                            </p>
                            <button
                                type="button"
                                className="admin-btn-danger"
                                onClick={handlePurgeUserData}
                                disabled={loading}
                            >
                                {loading ? "Deleting…" : "Delete user data (non-admins)"}
                            </button>
                        </div>
                    </div>
                )}

                {/* No panel selected: show only placeholder */}
                {activePanel == null && (
                    <div className="admin-panel admin-welcome-panel">
                        <p className="admin-welcome-text">Use the sidebar to view content — Staff Management, Café Management, Orders, Reports &amp; Analytics, Owners &amp; Cafes, or Settings.</p>
                    </div>
                )}

                {/* Create Cafe Owner wizard — only shown from Staff > Create Cafe Owner.
                    This does not affect the public registration on the home page. */}
                {showCreateOwnerForm && (
                    <div className="owner-wizard-backdrop">
                        <div className="owner-wizard-card">
                            <h2 className="owner-wizard-title">Cafe Registration</h2>
                            <div className="owner-wizard-steps">
                                {[1, 2, 3, 4, 5].map((n, idx) => (
                                    <div
                                        key={n}
                                        className={`owner-wizard-step ${ownerWizardStep === idx ? "active" : ownerWizardStep > idx ? "completed" : ""}`}
                                    >
                                        {n}
                                    </div>
                                ))}
                            </div>
                            {ownerWizardError && (
                                <p className="owner-wizard-error">{ownerWizardError}</p>
                            )}
                            <div className="owner-wizard-body">
                                {ownerWizardStep === 0 && (
                                    <>
                                        <h3 className="owner-wizard-section-title">Owner Account</h3>
                                        <div className="owner-wizard-grid">
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                value={ownerWizardData.firstName}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        firstName: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                value={ownerWizardData.lastName}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        lastName: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="email"
                                                placeholder="owner@example.com"
                                                value={ownerWizardData.email}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        email: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="password"
                                                placeholder="Set owner password"
                                                value={ownerWizardData.password}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        password: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Work experience (e.g. 5 years in hospitality)"
                                                value={ownerWizardData.workExperience}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        workExperience: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {ownerWizardStep === 1 && (
                                    <>
                                        <h3 className="owner-wizard-section-title">Basic Information</h3>
                                        <div className="owner-wizard-grid">
                                            <input
                                                type="text"
                                                placeholder="Cafe Name"
                                                value={ownerWizardData.cafeName}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        cafeName: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tagline"
                                                value={ownerWizardData.tagline}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        tagline: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Cafe logo URL"
                                                value={ownerWizardData.logoUrl}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        logoUrl: e.target.value,
                                                    }))
                                                }
                                            />
                                            <textarea
                                                placeholder="Cafe image URLs (comma separated)"
                                                rows={2}
                                                value={ownerWizardData.cafeImages}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        cafeImages: e.target.value,
                                                    }))
                                                }
                                            />
                                            <textarea
                                                placeholder="Description"
                                                rows={3}
                                                value={ownerWizardData.description}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        description: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Contact Number"
                                                value={ownerWizardData.contactNumber}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        contactNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Opening Time"
                                                value={ownerWizardData.openingTime}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        openingTime: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Closing Time"
                                                value={ownerWizardData.closingTime}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        closingTime: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {ownerWizardStep === 2 && (
                                    <>
                                        <h3 className="owner-wizard-section-title">Address Details</h3>
                                        <div className="owner-wizard-grid">
                                            <input
                                                type="text"
                                                placeholder="Street"
                                                value={ownerWizardData.street}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        street: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={ownerWizardData.city}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        city: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={ownerWizardData.stateRegion}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        stateRegion: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                value={ownerWizardData.pincode}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        pincode: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {ownerWizardStep === 3 && (
                                    <>
                                        <h3 className="owner-wizard-section-title">Legal &amp; Compliance</h3>
                                        <div className="owner-wizard-grid">
                                            <input
                                                type="text"
                                                placeholder="FSSAI License Number"
                                                value={ownerWizardData.fssaiNumber}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        fssaiNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="GST Number"
                                                value={ownerWizardData.gstNumber}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        gstNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Trade License Number"
                                                value={ownerWizardData.tradeLicense}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        tradeLicense: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {ownerWizardStep === 4 && (
                                    <>
                                        <h3 className="owner-wizard-section-title">Banking Details</h3>
                                        <div className="owner-wizard-grid">
                                            <input
                                                type="text"
                                                placeholder="Account Holder Name"
                                                value={ownerWizardData.accountHolder}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        accountHolder: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Bank Name"
                                                value={ownerWizardData.bankName}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        bankName: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Account Number"
                                                value={ownerWizardData.accountNumber}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        accountNumber: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="IFSC Code"
                                                value={ownerWizardData.ifscCode}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        ifscCode: e.target.value,
                                                    }))
                                                }
                                            />
                                            <input
                                                type="password"
                                                placeholder="Bank Account Password"
                                                value={ownerWizardData.bankPassword}
                                                onChange={(e) =>
                                                    setOwnerWizardData((d) => ({
                                                        ...d,
                                                        bankPassword: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="owner-wizard-footer">
                                <button
                                    type="button"
                                    className="owner-wizard-btn secondary"
                                    onClick={() => {
                                        if (ownerWizardStep === 0) {
                                            setShowCreateOwnerForm(false);
                                            setOwnerWizardStep(0);
                                            setOwnerWizardData((d) => ({ ...d, bankPassword: "" }));
                                            setOwnerWizardError("");
                                        } else {
                                            setOwnerWizardStep((s) => Math.max(0, s - 1));
                                            setOwnerWizardError("");
                                        }
                                    }}
                                >
                                    {ownerWizardStep === 0 ? "Close" : "Back"}
                                </button>
                                <button
                                    type="button"
                                    className="owner-wizard-btn primary"
                                    disabled={loading}
                                    onClick={async () => {
                                        setOwnerWizardError("");
                                        // Minimal validation per step
                                        if (ownerWizardStep === 0) {
                                            if (
                                                !ownerWizardData.firstName.trim() ||
                                                !ownerWizardData.lastName.trim() ||
                                                !ownerWizardData.email.trim() ||
                                                !ownerWizardData.password
                                            ) {
                                                setOwnerWizardError("Fill owner name, email and password.");
                                                return;
                                            }
                                            setOwnerWizardStep(1);
                                            return;
                                        }
                                        if (ownerWizardStep === 1) {
                                            if (!ownerWizardData.cafeName.trim()) {
                                                setOwnerWizardError("Cafe name is required.");
                                                return;
                                            }
                                        }
                                        if (ownerWizardStep < 4) {
                                            setOwnerWizardStep((s) => s + 1);
                                            return;
                                        }
                                        // Final submit (step 4)
                                        const fullAddress = [
                                            ownerWizardData.street,
                                            ownerWizardData.city,
                                            ownerWizardData.stateRegion,
                                            ownerWizardData.pincode,
                                        ]
                                            .filter((v) => v && String(v).trim())
                                            .join(", ");

                                        const owner = await handleCreateCafeOwner({
                                            firstName: ownerWizardData.firstName,
                                            lastName: ownerWizardData.lastName,
                                            email: ownerWizardData.email,
                                            password: ownerWizardData.password,
                                            workExperience: ownerWizardData.workExperience,
                                            contactNumber: ownerWizardData.contactNumber,
                                            fullAddress,
                                        });
                                        if (!owner || !owner.id) {
                                            setOwnerWizardError("Owner creation failed.");
                                            return;
                                        }
                                        try {
                                            await api.createCafe({
                                                name: ownerWizardData.cafeName.trim(),
                                                address: fullAddress || null,
                                                phone: ownerWizardData.contactNumber || null,
                                                description: [ownerWizardData.tagline, ownerWizardData.description, ownerWizardData.fssaiNumber ? `FSSAI: ${ownerWizardData.fssaiNumber}` : null, ownerWizardData.gstNumber ? `GST: ${ownerWizardData.gstNumber}` : null, ownerWizardData.tradeLicense ? `Trade License: ${ownerWizardData.tradeLicense}` : null]
                                                    .filter(Boolean)
                                                    .join(" | "),
                                                logoUrl: ownerWizardData.logoUrl || null,
                                                imageUrls: ownerWizardData.cafeImages || null,
                                                bankAccountHolder: ownerWizardData.accountHolder || null,
                                                bankName: ownerWizardData.bankName || null,
                                                bankAccountNumber: ownerWizardData.accountNumber || null,
                                                bankIfscCode: ownerWizardData.ifscCode || null,
                                                bankAccount: [ownerWizardData.bankName, ownerWizardData.accountNumber, ownerWizardData.ifscCode].filter(Boolean).join(" | ") || null,
                                                ownerUserId: owner.id,
                                            });
                                            loadCafes();
                                            loadUsers();
                                            loadStats();
                                            setMessage("Cafe and owner created successfully.");
                                        } catch (err) {
                                            setOwnerWizardError(err.message || "Cafe creation failed after owner creation.");
                                            return;
                                        }
                                        setShowCreateOwnerForm(false);
                                        setOwnerWizardStep(0);
                                        setOwnerWizardData({
                                            firstName: "",
                                            lastName: "",
                                            workExperience: "",
                                            email: "",
                                            password: "",
                                            cafeName: "",
                                            tagline: "",
                                            description: "",
                                            contactNumber: "",
                                            openingTime: "",
                                            closingTime: "",
                                            street: "",
                                            city: "",
                                            stateRegion: "",
                                            pincode: "",
                                            fssaiNumber: "",
                                            gstNumber: "",
                                            tradeLicense: "",
                                            accountHolder: "",
                                            bankName: "",
                                            accountNumber: "",
                                            ifscCode: "",
                                            bankPassword: "",
                                            logoUrl: "",
                                            cafeImages: "",
                                        });
                                    }}
                                >
                                    {ownerWizardStep === 4 ? (loading ? "Creating…" : "Finish") : "Next"}
                                </button>
                                <button
                                    type="button"
                                    className="owner-wizard-btn danger"
                                    onClick={() => {
                                        setShowCreateOwnerForm(false);
                                        setOwnerWizardStep(0);
                                        setOwnerWizardError("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                </div>
        </DashboardLayout>
    );
}

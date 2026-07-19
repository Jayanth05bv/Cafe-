import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";
import DashboardLayout from "../components/DashboardLayout";
import OwnerStaffRegistrationPanel from "../components/OwnerStaffRegistrationPanel";
import { api } from "../api";

const TABLE_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"];
const TABLE_LOCATIONS = ["INDOOR", "WINDOW", "OUTDOOR"];
const TABLE_CARD_STATUSES = ["AVAILABLE", "RESERVED", "OCCUPIED"];
const OWNER_CHART_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#ef4444", "#0f766e", "#64748b"];
const CATEGORY_OPTIONS = [
    { value: "BEVERAGE", label: "Beverage" },
    { value: "FOOD", label: "Food" },
    { value: "DESSERT", label: "Dessert" },
    { value: "SNACK", label: "Snack" },
    { value: "BREAKFAST", label: "Breakfast" },
    { value: "STARTER", label: "Starter" },
    { value: "MAIN_COURSE", label: "Main Course" },
    { value: "COMBO", label: "Combo" },
];
const MENU_DRAFT_KEY_PREFIX = "owner-menu-draft";
const OWNER_ORDER_PAGE_SIZE = 8;
const OWNER_ORDER_POLL_MS = 10000;
const INITIAL_TABLE_FORM = {
    tableNumber: "",
    capacity: 2,
    location: "INDOOR",
};
const INITIAL_MENU_ITEM_FORM = {
    name: "",
    description: "",
    price: "",
    category: "FOOD",
    available: true,
};

const TABLE_STATUS_LABELS = {
    AVAILABLE: "Available",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
    MAINTENANCE: "Maintenance",
};
const TABLE_LOCATION_LABELS = {
    INDOOR: "Indoor",
    WINDOW: "Window",
    OUTDOOR: "Outdoor",
};
const OWNER_SETTINGS_TABS = [
    { id: "profile", label: "Profile Settings" },
    { id: "cafe", label: "Cafe Settings" },
];
const TABLE_FILTER_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "AVAILABLE", label: "Available" },
    { value: "RESERVED", label: "Reserved" },
    { value: "OCCUPIED", label: "Occupied" },
];
const OWNER_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
});
const OWNER_COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
});
const OWNER_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});
const OWNER_PROFILE_PHONE_REGEX = /^[6-9]\d{9}$/;
const OWNER_PROFILE_GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];
const OWNER_PROFILE_MARITAL_OPTIONS = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
];
const OWNER_SELECTED_CAFE_KEY = "ownerSelectedCafeId";

function parseCafeDescriptionParts(description) {
    const parts = String(description || "")
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
    const parsed = {
        tagline: "",
        description: "",
        openingTime: "",
        closingTime: "",
        fssaiNumber: "",
        gstNumber: "",
        tradeLicense: "",
    };
    parts.forEach((part) => {
        if (part.startsWith("Opening:")) parsed.openingTime = part.replace("Opening:", "").trim();
        else if (part.startsWith("Closing:")) parsed.closingTime = part.replace("Closing:", "").trim();
        else if (part.startsWith("FSSAI:")) parsed.fssaiNumber = part.replace("FSSAI:", "").trim();
        else if (part.startsWith("GST:")) parsed.gstNumber = part.replace("GST:", "").trim();
        else if (part.startsWith("Trade License:")) parsed.tradeLicense = part.replace("Trade License:", "").trim();
        else if (!parsed.tagline) parsed.tagline = part;
        else parsed.description = parsed.description ? `${parsed.description} | ${part}` : part;
    });
    return parsed;
}

function createCafeSettingsForm(cafe) {
    const parsedDescription = parseCafeDescriptionParts(cafe?.description);
    const address = String(cafe?.address || "").split(",").map((part) => part.trim()).filter(Boolean);
    return {
        cafeName: cafe?.name || "",
        tagline: parsedDescription.tagline || "",
        description: parsedDescription.description || "",
        contactNumber: cafe?.phone || "",
        openingTime: parsedDescription.openingTime || "",
        closingTime: parsedDescription.closingTime || "",
        street: address.length > 0 ? address[0] : "",
        city: address.length > 1 ? address[1] : "",
        stateRegion: address.length > 2 ? address[2] : "",
        pincode: address.length > 3 ? address[3] : "",
        fssaiNumber: parsedDescription.fssaiNumber || "",
        gstNumber: parsedDescription.gstNumber || "",
        tradeLicense: parsedDescription.tradeLicense || "",
        logoUrl: cafe?.logoUrl || "",
        cafeImages: cafe?.imageUrls || "",
        accountHolder: cafe?.bankAccountHolder || "",
        bankName: cafe?.bankName || "",
        accountNumber: cafe?.bankAccountNumber || "",
        ifscCode: cafe?.bankIfscCode || "",
    };
}

function getCafeLocationLabel(address) {
    if (!address) return "No location";
    const parts = String(address)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "No location";
}

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Owner", roles: ["OWNER"] };
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

function getCategoryLabel(category) {
    return CATEGORY_OPTIONS.find((option) => option.value === category)?.label
        || String(category || "")
            .toLowerCase()
            .split("_")
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
}

function formatOwnerCurrency(value) {
    return value != null ? OWNER_CURRENCY_FORMATTER.format(Number(value)) : "—";
}

function formatCompactNumber(value) {
    return value != null ? OWNER_COMPACT_NUMBER_FORMATTER.format(Number(value)) : "—";
}

function formatCompactCurrency(value) {
    if (value == null) {
        return "—";
    }
    return `₹${formatCompactNumber(value)}`;
}

function formatOwnerDateTime(value) {
    return value ? OWNER_DATE_FORMATTER.format(new Date(value)) : "—";
}

function getBookingStatusDisplay(status) {
    if (status === "SERVED") {
        return "COMPLETED";
    }
    if (status === "PAID" || status === "PREPARING" || status === "READY") {
        return "CHECKED-IN";
    }
    if (status === "CANCELLED") {
        return "CANCELLED";
    }
    if (status === "CONFIRMED") {
        return "CONFIRMED";
    }
    return "PENDING";
}

function getBookingStatusClass(status) {
    return getBookingStatusDisplay(status).toLowerCase();
}

function AnalyticsKpiIcon({ type }) {
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
    if (type === "average") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 16.5 9 11l3 3 7.5-8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
                <path d="M17 6h2.5v2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
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

function CafeOverviewIcon({ type }) {
    if (type === "cafe") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 9.5h10v4.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M7 6.5v-2m4 2v-2m4 2v-2M4.5 19.5h13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            </svg>
        );
    }
    if (type === "tables") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5.5" y="7" width="13" height="6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M8 13v4.5m8-4.5v4.5M3.5 10.5h2m15 0h2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            </svg>
        );
    }
    if (type === "menu") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4.5v7m3-7v7m-3-3.5h3M15.5 4.5c0 3-1.2 5-3 6.3v8.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
        </svg>
    );
}

function PasswordVisibilityIcon({ visible }) {
    return visible ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            <path d="M10.6 10.7A2.5 2.5 0 0 0 13.3 13.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            <path d="M9.9 5.6A10.6 10.6 0 0 1 12 5.4c5.1 0 8.6 4.3 9.5 5.6a.8.8 0 0 1 0 1c-.4.6-1.4 1.9-2.9 3.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
            <path d="M6.1 8.2A15.8 15.8 0 0 0 2.5 11a.8.8 0 0 0 0 1c1 1.4 4.5 5.7 9.5 5.7 1 0 2-.1 2.9-.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12c1-1.4 4.5-5.7 9.5-5.7s8.5 4.3 9.5 5.7a.8.8 0 0 1 0 1c-1 1.4-4.5 5.7-9.5 5.7S3.5 14.4 2.5 13a.8.8 0 0 1 0-1Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="12" cy="12.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.9" />
        </svg>
    );
}

function RegistrationFieldIcon({ children }) {
    return <span className="field-icon" aria-hidden="true">{children}</span>;
}

function RegistrationUserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0"></path>
            <circle cx="12" cy="8" r="4"></circle>
        </svg>
    );
}

function RegistrationMailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16v12H4z"></path>
            <path d="m4 8 8 6 8-6"></path>
        </svg>
    );
}

function RegistrationPhoneIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.78.68 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.34a2 2 0 0 1 2.11-.45c.84.33 1.72.56 2.62.68A2 2 0 0 1 22 16.92z"></path>
        </svg>
    );
}

function RegistrationAcademicIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 8 10-5 10 5-10 5-10-5Z"></path>
            <path d="M6 10.5v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"></path>
        </svg>
    );
}

function RegistrationLocationIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"></path>
            <circle cx="12" cy="11" r="2.5"></circle>
        </svg>
    );
}

function RegistrationCalendarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M16 3v4M8 3v4M3 10h18"></path>
        </svg>
    );
}

function RegistrationMoneyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12"></path>
            <path d="M6 8h12"></path>
            <path d="M9 13h6a3 3 0 0 1 0 6H9"></path>
            <path d="M12 8v11"></path>
        </svg>
    );
}

function OwnerProfileFloatingInput({
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    icon,
    error,
    success,
    autoComplete,
    readOnly = false,
}) {
    const stateClass = error ? "has-error" : success ? "has-success" : "";
    const message = error || success;
    const messageClass = error ? "field-error" : "field-success";
    const typeClass = type === "date" ? "date-field" : "";

    return (
        <div className={`field floating-field ${stateClass} ${typeClass}`}>
            <div className="input-shell">
                {icon ? <RegistrationFieldIcon>{icon}</RegistrationFieldIcon> : null}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder=" "
                    autoComplete={autoComplete}
                    readOnly={readOnly}
                />
                <label>{label}</label>
            </div>
            {message ? <span className={`input-status ${messageClass}`}>{message}</span> : null}
        </div>
    );
}

function OwnerProfileFloatingSelect({
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
                {icon ? <RegistrationFieldIcon>{icon}</RegistrationFieldIcon> : null}
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
                                onChange(option.value);
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

function calculatePercentChange(current, previous) {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
}

function formatPercentChange(value) {
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded}% from yesterday`;
}

function formatAnalyticsTick(dateKey) {
    if (!dateKey) return "";
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
}

function OrderActionIcon({ type }) {
    if (type === "view") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        );
    }
    if (type === "ready") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    d="M5 12.5 9.5 17 19 7.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M6 12.5 10 16.5 18 8.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
            <path
                d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function TableMetaIcon({ type }) {
    if (type === "seats") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10V7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V10" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M5 10h14v3.5A2.5 2.5 0 0 1 16.5 16h-9A2.5 2.5 0 0 1 5 13.5Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
                <path d="M7 16v3m10-3v3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s6-4.2 6-9.6a6 6 0 1 0-12 0c0 5.4 6 9.6 6 9.6Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="12" cy="10.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.9" />
        </svg>
    );
}

function getTableLocationLabel(location) {
    return TABLE_LOCATION_LABELS[location] || String(location || "Indoor").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

export default function OwnerDashboard() {
    const navigate = useNavigate();
    const [cafe, setCafe] = useState(null);
    const [tables, setTables] = useState([]);
    const [menu, setMenu] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [cafeId, setCafeId] = useState(null);
    const [ownerAssignedCafes, setOwnerAssignedCafes] = useState([]);
    const [activePanel, setActivePanel] = useState("cafe");
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [menuItemForm, setMenuItemForm] = useState(INITIAL_MENU_ITEM_FORM);
    const [menuImagePreviews, setMenuImagePreviews] = useState([]);
    const [menuDropActive, setMenuDropActive] = useState(false);
    const [staffMembers, setStaffMembers] = useState([]);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [staffListTab, setStaffListTab] = useState("CHEF");
    const [staffSearch, setStaffSearch] = useState("");
    const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
    const [staffStatusFilter, setStaffStatusFilter] = useState("ALL");
    const [staffActionMenuId, setStaffActionMenuId] = useState(null);
    const [staffEditDraft, setStaffEditDraft] = useState({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        enabled: true,
    });
    const [staffEditingMember, setStaffEditingMember] = useState(null);
    const [menuSearch, setMenuSearch] = useState("");
    const [menuCategoryFilter, setMenuCategoryFilter] = useState("ALL");
    const [menuPriceSort, setMenuPriceSort] = useState("default");
    const [menuFormErrors, setMenuFormErrors] = useState({});
    const [tableForm, setTableForm] = useState(INITIAL_TABLE_FORM);
    const [tableSearch, setTableSearch] = useState("");
    const [tableStatusFilter, setTableStatusFilter] = useState("ALL");
    const [tableLocationFilter, setTableLocationFilter] = useState("ALL");
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
    const [orderDateFilter, setOrderDateFilter] = useState("");
    const [orderSort, setOrderSort] = useState({ key: "createdAt", direction: "desc" });
    const [orderPage, setOrderPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
    const [highlightedOrderIds, setHighlightedOrderIds] = useState([]);
    const [bookingSearch, setBookingSearch] = useState("");
    const [bookingDateFilter, setBookingDateFilter] = useState("");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
    const [bookingTableFilter, setBookingTableFilter] = useState("ALL");
    const [bookingSort, setBookingSort] = useState("date-asc");
    const [analyticsRange, setAnalyticsRange] = useState("7d");
    const [analyticsCustomStart, setAnalyticsCustomStart] = useState("");
    const [analyticsCustomEnd, setAnalyticsCustomEnd] = useState("");
    const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState("ALL");
    const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);
    const [analyticsExporting, setAnalyticsExporting] = useState(false);
    const [settingsTab, setSettingsTab] = useState("profile");
    const [ownerProfileForm, setOwnerProfileForm] = useState({
        firstName: "",
        lastName: "",
        fullName: "",
        email: "",
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
        companyName: "",
        workLocation: "",
        startDate: "",
        endDate: "",
        compensationPackage: "",
        identificationFileName: "",
        profileImageUrl: "",
    });
    const [ownerProfileErrors, setOwnerProfileErrors] = useState({});
    const [ownerProfileSubmitting, setOwnerProfileSubmitting] = useState(false);
    const [ownerProfileImageUploading, setOwnerProfileImageUploading] = useState(false);
    const [ownerProfileModalOpen, setOwnerProfileModalOpen] = useState(false);
    const [ownerProfileEditStep, setOwnerProfileEditStep] = useState(1);
    const [ownerCafeModalOpen, setOwnerCafeModalOpen] = useState(false);
    const [ownerCafeEditStep, setOwnerCafeEditStep] = useState(1);
    const [ownerCafeSubmitting, setOwnerCafeSubmitting] = useState(false);
    const [ownerCafeForm, setOwnerCafeForm] = useState(createCafeSettingsForm(null));
    const [ownerCafeErrors, setOwnerCafeErrors] = useState({});
    const [activeAnalyticsSlice, setActiveAnalyticsSlice] = useState(null);
    const [tablePendingDelete, setTablePendingDelete] = useState(null);
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingTableDraft, setEditingTableDraft] = useState({
        tableNumber: "",
        capacity: 2,
        location: "INDOOR",
    });
    const toastTimeoutRef = useRef(null);
    const hasLoadedOrdersRef = useRef(false);
    const previousOrderIdsRef = useRef([]);
    const user = getStoredUser();

    const loadData = (resolvedCafeId = cafeId, fallbackCafeSummary = null) => {
        if (!resolvedCafeId) {
            setCafe(null);
            setTables([]);
            setMenu([]);
            setOrders([]);
            setStaffMembers([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.allSettled([
            api.getOwnerCafe(resolvedCafeId),
            api.getOwnerTables(resolvedCafeId),
            api.getOwnerMenu(resolvedCafeId),
            api.getOwnerOrders(resolvedCafeId),
            api.getOwnerStaff(resolvedCafeId),
        ])
            .then(([cafeResult, tablesResult, menuResult, ordersResult, staffResult]) => {
                const fallbackCafe = fallbackCafeSummary
                    || ownerAssignedCafes.find((assignedCafe) => assignedCafe.id === resolvedCafeId)
                    || (ownerProfile?.cafe?.id === resolvedCafeId ? ownerProfile.cafe : null)
                    || null;
                const nextCafe = cafeResult.status === "fulfilled" ? cafeResult.value : fallbackCafe;
                const nextTables = tablesResult.status === "fulfilled" && Array.isArray(tablesResult.value) ? tablesResult.value : [];
                const nextMenu = menuResult.status === "fulfilled" && Array.isArray(menuResult.value) ? menuResult.value : [];
                const nextOrders = ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value) ? ordersResult.value : [];
                const nextStaff = staffResult.status === "fulfilled" && Array.isArray(staffResult.value) ? staffResult.value : [];

                setCafe(nextCafe);
                setTables(nextTables);
                setMenu(nextMenu);
                setOrders(nextOrders);
                setStaffMembers(nextStaff);

                const hasFailure = [cafeResult, tablesResult, menuResult, ordersResult, staffResult]
                    .some((result) => result.status === "rejected");
                if (hasFailure && !nextCafe) {
                    showMsg("Some cafe data could not be loaded.", "error");
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        api.getOwnerMe()
            .then((me) => {
                setOwnerProfile(me);
                const assignedCafes = Array.isArray(me?.cafes) && me.cafes.length > 0
                    ? me.cafes
                    : me?.cafe ? [me.cafe] : [];
                const storedCafeIdRaw = localStorage.getItem(OWNER_SELECTED_CAFE_KEY);
                const storedCafeId = storedCafeIdRaw ? Number(storedCafeIdRaw) : null;
                const preferredCafeId = assignedCafes.find((assignedCafe) => assignedCafe.id === storedCafeId)?.id
                    || assignedCafes.find((assignedCafe) => assignedCafe.id === me?.cafe?.id)?.id
                    || assignedCafes[0]?.id
                    || null;
                setOwnerAssignedCafes(assignedCafes);
                if (assignedCafes.length === 0) {
                    setCafeId(null);
                    localStorage.removeItem(OWNER_SELECTED_CAFE_KEY);
                    setLoading(false);
                    navigate("/owner/select-cafe", { replace: true });
                    return;
                }
                const preferredCafeSummary = assignedCafes.find((assignedCafe) => assignedCafe.id === preferredCafeId)
                    || (me?.cafe?.id === preferredCafeId ? me.cafe : null)
                    || null;
                setCafeId(preferredCafeId);
                localStorage.setItem(OWNER_SELECTED_CAFE_KEY, String(preferredCafeId));
                loadData(preferredCafeId, preferredCafeSummary);
            })
            .catch(() => {
                setOwnerProfile(null);
                setOwnerAssignedCafes([]);
                setCafeId(null);
                localStorage.removeItem(OWNER_SELECTED_CAFE_KEY);
                setLoading(false);
                navigate("/owner/select-cafe", { replace: true });
            });
    }, [navigate]);

    useEffect(() => {
        if (!ownerProfile) {
            return;
        }
        setOwnerProfileForm({
            firstName: ownerProfile.firstName || "",
            lastName: ownerProfile.lastName || "",
            fullName: ownerProfile.fullName || ownerProfile.username || "",
            email: ownerProfile.email || "",
            phone: ownerProfile.phone || "",
            gender: ownerProfile.gender || "",
            maritalStatus: ownerProfile.maritalStatus || "",
            instituteName: ownerProfile.instituteName || "",
            degree: ownerProfile.degree || "",
            passingYear: ownerProfile.passingYear || "",
            grade: ownerProfile.grade || "",
            percentage: ownerProfile.percentage || "",
            streetAddress: ownerProfile.streetAddress || "",
            plotNo: ownerProfile.plotNo || "",
            city: ownerProfile.city || "",
            state: ownerProfile.state || "",
            pincode: ownerProfile.pincode || "",
            companyName: ownerProfile.companyName || "",
            workLocation: ownerProfile.workLocation || "",
            startDate: ownerProfile.startDate || "",
            endDate: ownerProfile.endDate || "",
            compensationPackage: ownerProfile.compensationPackage || "",
            identificationFileName: ownerProfile.identificationFileName || "",
            profileImageUrl: ownerProfile.profileImageUrl || "",
        });
        setOwnerProfileErrors({});
    }, [ownerProfile]);

    useEffect(() => {
        if (!cafeId) {
            return;
        }

        if (activePanel === "tables" || activePanel === "cafe") {
            api.getOwnerTables(cafeId)
                .then((data) => setTables(Array.isArray(data) ? data : []))
                .catch(() => {});
        }

        if (activePanel === "menu" || activePanel === "cafe") {
            api.getOwnerMenu(cafeId)
                .then((data) => setMenu(Array.isArray(data) ? data : []))
                .catch(() => {});
        }

        if (activePanel === "staff") {
            api.getOwnerStaff(cafeId)
                .then((data) => setStaffMembers(Array.isArray(data) ? data : []))
                .catch(() => {});
        }
    }, [activePanel, cafeId]);

    useEffect(() => {
        if (!ownerProfileModalOpen) {
            setOwnerProfileEditStep(1);
        }
    }, [ownerProfileModalOpen]);

    useEffect(() => {
        setOwnerCafeForm(createCafeSettingsForm(cafe));
        setOwnerCafeErrors({});
    }, [cafe]);

    useEffect(() => {
        if (!ownerCafeModalOpen) {
            setOwnerCafeEditStep(1);
        }
    }, [ownerCafeModalOpen]);

    const showMsg = (text, type = "success") => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast({
            id: Date.now(),
            text,
            type,
        });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
            toastTimeoutRef.current = null;
        }, 3200);
    };

    const validateOwnerProfileForm = (form) => {
        const nextErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.firstName.trim()) {
            nextErrors.firstName = "First name is required.";
        }
        if (!form.lastName.trim()) {
            nextErrors.lastName = "Last name is required.";
        }
        if (!form.fullName.trim()) {
            nextErrors.fullName = "Full name is required.";
        }
        if (!form.email.trim()) {
            nextErrors.email = "Email is required.";
        } else if (!emailRegex.test(form.email.trim())) {
            nextErrors.email = "Enter a valid email address.";
        }
        if (!form.phone.trim()) {
            nextErrors.phone = "Phone number is required.";
        } else if (!OWNER_PROFILE_PHONE_REGEX.test(form.phone.trim())) {
            nextErrors.phone = "Enter a valid 10-digit mobile number.";
        }
        if (form.passingYear && !/^\d{4}$/.test(form.passingYear.trim())) {
            nextErrors.passingYear = "Use a valid 4-digit year.";
        }
        if (form.startDate && form.endDate && form.startDate > form.endDate) {
            nextErrors.endDate = "End date must be after start date.";
        }
        return nextErrors;
    };

    const handleOwnerProfileFieldChange = (field, value) => {
        setOwnerProfileForm((current) => {
            const next = {
                ...current,
                [field]: value,
            };
            if (field === "firstName" || field === "lastName") {
                const fullName = `${field === "firstName" ? value : next.firstName} ${field === "lastName" ? value : next.lastName}`.trim();
                next.fullName = fullName;
            }
            return next;
        });
        setOwnerProfileErrors((current) => {
            if (!current[field]) {
                return current;
            }
            const next = { ...current };
            delete next[field];
            if ((field === "firstName" || field === "lastName") && next.fullName) {
                delete next.fullName;
            }
            return next;
        });
    };

    const handleOwnerProfileImageUpload = async (file) => {
        if (!file) {
            return;
        }
        setOwnerProfileImageUploading(true);
        try {
            const response = await api.uploadOwnerProfileImage(file);
            handleOwnerProfileFieldChange("profileImageUrl", response.url || "");
            showMsg("Profile image uploaded.");
        } catch (err) {
            showMsg(err.message || "Failed to upload profile image", "error");
        } finally {
            setOwnerProfileImageUploading(false);
        }
    };

    const openOwnerProfileModal = () => {
        setOwnerProfileErrors({});
        setOwnerProfileEditStep(1);
        setOwnerProfileModalOpen(true);
    };

    const closeOwnerProfileModal = () => {
        setOwnerProfileModalOpen(false);
        setOwnerProfileErrors({});
        setOwnerProfileForm({
            firstName: ownerProfile?.firstName || "",
            lastName: ownerProfile?.lastName || "",
            fullName: ownerProfile?.fullName || ownerProfile?.username || "",
            email: ownerProfile?.email || "",
            phone: ownerProfile?.phone || "",
            gender: ownerProfile?.gender || "",
            maritalStatus: ownerProfile?.maritalStatus || "",
            instituteName: ownerProfile?.instituteName || "",
            degree: ownerProfile?.degree || "",
            passingYear: ownerProfile?.passingYear || "",
            grade: ownerProfile?.grade || "",
            percentage: ownerProfile?.percentage || "",
            streetAddress: ownerProfile?.streetAddress || "",
            plotNo: ownerProfile?.plotNo || "",
            city: ownerProfile?.city || "",
            state: ownerProfile?.state || "",
            pincode: ownerProfile?.pincode || "",
            companyName: ownerProfile?.companyName || "",
            workLocation: ownerProfile?.workLocation || "",
            startDate: ownerProfile?.startDate || "",
            endDate: ownerProfile?.endDate || "",
            compensationPackage: ownerProfile?.compensationPackage || "",
            identificationFileName: ownerProfile?.identificationFileName || "",
            profileImageUrl: ownerProfile?.profileImageUrl || "",
        });
    };

    const handleOwnerProfileSave = async (e) => {
        e.preventDefault();
        const nextErrors = validateOwnerProfileForm(ownerProfileForm);
        setOwnerProfileErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }
        setOwnerProfileSubmitting(true);
        try {
            const savedProfile = await api.updateOwnerMe({
                firstName: ownerProfileForm.firstName.trim(),
                lastName: ownerProfileForm.lastName.trim(),
                fullName: ownerProfileForm.fullName.trim(),
                email: ownerProfileForm.email.trim(),
                phone: ownerProfileForm.phone.trim(),
                gender: ownerProfileForm.gender,
                maritalStatus: ownerProfileForm.maritalStatus,
                instituteName: ownerProfileForm.instituteName.trim(),
                degree: ownerProfileForm.degree.trim(),
                passingYear: ownerProfileForm.passingYear.trim(),
                grade: ownerProfileForm.grade.trim(),
                percentage: ownerProfileForm.percentage.trim(),
                streetAddress: ownerProfileForm.streetAddress.trim(),
                plotNo: ownerProfileForm.plotNo.trim(),
                city: ownerProfileForm.city.trim(),
                state: ownerProfileForm.state.trim(),
                pincode: ownerProfileForm.pincode.trim(),
                companyName: ownerProfileForm.companyName.trim(),
                workLocation: ownerProfileForm.workLocation.trim(),
                startDate: ownerProfileForm.startDate,
                endDate: ownerProfileForm.endDate,
                compensationPackage: ownerProfileForm.compensationPackage.trim(),
                identificationFileName: ownerProfileForm.identificationFileName.trim(),
                profileImageUrl: ownerProfileForm.profileImageUrl.trim(),
            });
            setOwnerProfile(savedProfile);
            setOwnerProfileModalOpen(false);
            showMsg("Profile settings saved.");
        } catch (err) {
            showMsg(err.message || "Failed to save profile settings", "error");
        } finally {
            setOwnerProfileSubmitting(false);
        }
    };

    const getOwnerProfileStepErrors = (step, errors) => {
        if (step === 1) {
            return ["firstName", "lastName", "phone"].filter((key) => errors[key]);
        }
        if (step === 2) {
            return ["passingYear"].filter((key) => errors[key]);
        }
        if (step === 3) {
            return [];
        }
        if (step === 4) {
            return ["endDate"].filter((key) => errors[key]);
        }
        return ["fullName", "email"].filter((key) => errors[key]);
    };

    const validateOwnerCafeForm = (form) => {
        const nextErrors = {};
        if (!form.cafeName.trim()) {
            nextErrors.cafeName = "Cafe name is required.";
        }
        if (!form.contactNumber.trim()) {
            nextErrors.contactNumber = "Contact number is required.";
        } else if (!OWNER_PROFILE_PHONE_REGEX.test(form.contactNumber.trim())) {
            nextErrors.contactNumber = "Enter a valid 10-digit contact number.";
        }
        return nextErrors;
    };

    const getOwnerCafeStepErrors = (step, errors) => {
        if (step === 1) {
            return ["cafeName", "contactNumber"].filter((key) => errors[key]);
        }
        return [];
    };

    const handleOwnerCafeFieldChange = (field, value) => {
        setOwnerCafeForm((current) => ({
            ...current,
            [field]: value,
        }));
        setOwnerCafeErrors((current) => {
            if (!current[field]) {
                return current;
            }
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const openOwnerCafeModal = () => {
        setOwnerCafeForm(createCafeSettingsForm(cafe));
        setOwnerCafeErrors({});
        setOwnerCafeEditStep(1);
        setOwnerCafeModalOpen(true);
    };

    const closeOwnerCafeModal = () => {
        setOwnerCafeModalOpen(false);
        setOwnerCafeErrors({});
        setOwnerCafeForm(createCafeSettingsForm(cafe));
    };

    const handleOwnerCafeSave = async (e) => {
        e.preventDefault();
        if (!cafeId) {
            return;
        }
        const nextErrors = validateOwnerCafeForm(ownerCafeForm);
        setOwnerCafeErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }
        setOwnerCafeSubmitting(true);
        const fullAddress = [
            ownerCafeForm.street.trim(),
            ownerCafeForm.city.trim(),
            ownerCafeForm.stateRegion.trim(),
            ownerCafeForm.pincode.trim(),
        ].filter(Boolean).join(", ");
        const description = [
            ownerCafeForm.tagline.trim(),
            ownerCafeForm.description.trim(),
            ownerCafeForm.openingTime.trim() ? `Opening: ${ownerCafeForm.openingTime.trim()}` : "",
            ownerCafeForm.closingTime.trim() ? `Closing: ${ownerCafeForm.closingTime.trim()}` : "",
            ownerCafeForm.fssaiNumber.trim() ? `FSSAI: ${ownerCafeForm.fssaiNumber.trim()}` : "",
            ownerCafeForm.gstNumber.trim() ? `GST: ${ownerCafeForm.gstNumber.trim()}` : "",
            ownerCafeForm.tradeLicense.trim() ? `Trade License: ${ownerCafeForm.tradeLicense.trim()}` : "",
        ].filter(Boolean).join(" | ");
        try {
            const updatedCafe = await api.updateOwnerCafe(cafeId, {
                name: ownerCafeForm.cafeName.trim(),
                address: fullAddress || null,
                phone: ownerCafeForm.contactNumber.trim() || null,
                description: description || null,
                logoUrl: ownerCafeForm.logoUrl.trim() || null,
                imageUrls: ownerCafeForm.cafeImages.trim() || null,
                bankAccountHolder: ownerCafeForm.accountHolder.trim() || null,
                bankName: ownerCafeForm.bankName.trim() || null,
                bankAccountNumber: ownerCafeForm.accountNumber.trim() || null,
                bankIfscCode: ownerCafeForm.ifscCode.trim() || null,
            });
            setCafe(updatedCafe);
            setOwnerAssignedCafes((current) => current.map((item) => (item.id === updatedCafe.id ? { ...item, ...updatedCafe } : item)));
            setOwnerCafeModalOpen(false);
            showMsg("Cafe settings saved.");
        } catch (err) {
            showMsg(err.message || "Failed to update cafe settings", "error");
        } finally {
            setOwnerCafeSubmitting(false);
        }
    };


    useEffect(() => () => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (!cafeId) return undefined;
        const intervalId = setInterval(() => {
            api.getOwnerOrders(cafeId)
                .then((data) => {
                    setOrders(Array.isArray(data) ? data : []);
                })
                .catch(() => {});
        }, OWNER_ORDER_POLL_MS);
        return () => clearInterval(intervalId);
    }, [cafeId]);

    useEffect(() => {
        if (loading) {
            return undefined;
        }
        const currentOrderIds = (orders || []).map((order) => order.id);
        if (!hasLoadedOrdersRef.current) {
            previousOrderIdsRef.current = currentOrderIds;
            hasLoadedOrdersRef.current = true;
            return undefined;
        }

        const newlyAddedOrderIds = currentOrderIds.filter((id) => !previousOrderIdsRef.current.includes(id));
        previousOrderIdsRef.current = currentOrderIds;

        if (newlyAddedOrderIds.length === 0) {
            return;
        }

        setHighlightedOrderIds((current) => Array.from(new Set([...current, ...newlyAddedOrderIds])));
        const timeoutId = setTimeout(() => {
            setHighlightedOrderIds((current) => current.filter((id) => !newlyAddedOrderIds.includes(id)));
        }, 4200);

        return () => clearTimeout(timeoutId);
    }, [loading, orders]);

    const refreshAnalyticsOrders = async () => {
        if (!cafeId || analyticsRefreshing) {
            return;
        }
        setAnalyticsRefreshing(true);
        try {
            const refreshedOrders = await api.getOwnerOrders(cafeId);
            setOrders(Array.isArray(refreshedOrders) ? refreshedOrders : []);
            showMsg("Analytics refreshed.");
        } catch (err) {
            showMsg(err.message || "Failed to refresh analytics", "error");
        } finally {
            setAnalyticsRefreshing(false);
        }
    };

    const exportAnalyticsSalesData = async () => {
        if (analyticsExporting) {
            return;
        }
        setAnalyticsExporting(true);
        try {
            const sourceOrders = (orders || []).slice().sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });
            const paidOrders = sourceOrders.filter((order) => ["PAID", "READY", "SERVED"].includes(order.status));
            const totalSalesRevenue = sourceOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
            const totalPaidRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
            const averageRevenue = sourceOrders.length > 0 ? totalSalesRevenue / sourceOrders.length : 0;
            const summaryRows = [
                { Metric: "Cafe Name", Value: cafe?.name || "Cafe" },
                { Metric: "Exported At", Value: formatOwnerDateTime(new Date().toISOString()) },
                { Metric: "Total Orders", Value: sourceOrders.length },
                { Metric: "Paid/Completed Orders", Value: paidOrders.length },
                { Metric: "Total Revenue", Value: formatOwnerCurrency(totalSalesRevenue) },
                { Metric: "Paid Revenue", Value: formatOwnerCurrency(totalPaidRevenue) },
                { Metric: "Average Order Value", Value: formatOwnerCurrency(averageRevenue) },
                { Metric: "Analytics Status Filter", Value: analyticsStatusFilter === "ALL" ? "All statuses" : analyticsStatusFilter },
                { Metric: "Analytics Date Range", Value: `${analyticsRangeStart.toISOString().slice(0, 10)} to ${analyticsRangeEnd.toISOString().slice(0, 10)}` },
            ];
            const detailRows = sourceOrders.map((order) => ({
                "Order ID": order.id || "—",
                "Order Number": order.orderNumber || "—",
                "Created At": formatOwnerDateTime(order.createdAt),
                "Reservation Date": order.reservationDate || "—",
                "Reservation Slot": order.reservationTimeSlot || "—",
                "Customer": order.customer?.username || "Walk-in",
                "Customer Email": order.customer?.email || "—",
                "Table Number": order.cafeTable?.tableNumber || "—",
                "Table Location": getTableLocationLabel(order.cafeTable?.location),
                "Guests": order.guestCount || 0,
                "Status": order.status || "PENDING",
                "Payment Method": order.paymentMethod || "—",
                "Payment Status": order.paymentStatus || order.status || "—",
                "Total Amount": Number(order.totalAmount) || 0,
                "Formatted Total": formatOwnerCurrency(order.totalAmount),
                "Item Count": Array.isArray(order.items) ? order.items.length : 0,
                "Prepared By": order.preparedBy || "—",
                "Served By": order.servedBy || "—",
            }));
            const workbook = XLSX.utils.book_new();
            const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
            const detailsSheet = XLSX.utils.json_to_sheet(detailRows);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Sales Summary");
            XLSX.utils.book_append_sheet(workbook, detailsSheet, "Sales Data");
            const safeCafeName = String(cafe?.name || "cafe")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            const exportDate = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(workbook, `${safeCafeName || "cafe"}-sales-${exportDate}.xlsx`);
            showMsg("Sales export downloaded.");
        } catch (err) {
            showMsg(err.message || "Failed to export analytics", "error");
        } finally {
            setAnalyticsExporting(false);
        }
    };

    useEffect(() => {
        setOrderPage(1);
    }, [orderSearch, orderStatusFilter, orderDateFilter, orderSort]);

    const normalizedMenuSearch = menuSearch.trim().toLowerCase();
    const menuDraftKey = cafeId ? `${MENU_DRAFT_KEY_PREFIX}:${cafeId}` : null;

    const resetMenuItemForm = () => {
        setMenuItemForm(INITIAL_MENU_ITEM_FORM);
        setMenuImagePreviews([]);
        setMenuDropActive(false);
        setMenuFormErrors({});
        if (menuDraftKey) {
            localStorage.removeItem(menuDraftKey);
        }
    };

    const handleMenuFormChange = (field, value) => {
        setMenuItemForm((current) => ({
            ...current,
            [field]: value,
        }));
        setMenuFormErrors((current) => ({
            ...current,
            [field]: "",
        }));
    };

    const handleRemoveMenuImage = (id) => {
        setMenuImagePreviews((current) => current.filter((image) => image.id !== id));
    };

    const handleUploadMenuImages = async (fileList) => {
        const files = Array.from(fileList || []).filter(Boolean);
        if (!files.length) return;
        if (menuImagePreviews.length + files.length > 6) {
            showMsg("Upload up to 6 images for a menu item.");
            return;
        }
        setUploadingImages(true);
        try {
            const payload = await api.uploadOwnerMenuImages(files);
            const urls = Array.isArray(payload?.urls) ? payload.urls : [];
            const nextImages = urls.map((url, index) => ({
                id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                url,
                name: files[index]?.name || `image-${index + 1}`,
            }));
            setMenuImagePreviews((current) => [...current, ...nextImages]);
        } catch (err) {
            showMsg(err.message || "Failed to upload images");
        } finally {
            setUploadingImages(false);
        }
    };

    const handleMenuDrop = async (event) => {
        event.preventDefault();
        setMenuDropActive(false);
        await handleUploadMenuImages(event.dataTransfer?.files);
    };

    useEffect(() => {
        if (!menuDraftKey) return;
        try {
            const savedDraft = JSON.parse(localStorage.getItem(menuDraftKey) || "null");
            if (!savedDraft) return;
            setMenuItemForm({
                ...INITIAL_MENU_ITEM_FORM,
                ...(savedDraft.form || {}),
            });
            setMenuImagePreviews(Array.isArray(savedDraft.images) ? savedDraft.images : []);
        } catch {
            localStorage.removeItem(menuDraftKey);
        }
    }, [menuDraftKey]);

    useEffect(() => {
        if (!menuDraftKey) return;
        const hasDraft =
            menuItemForm.name.trim()
            || menuItemForm.description.trim()
            || menuItemForm.price
            || menuItemForm.category !== INITIAL_MENU_ITEM_FORM.category
            || menuItemForm.available !== INITIAL_MENU_ITEM_FORM.available
            || menuImagePreviews.length;
        if (!hasDraft) {
            localStorage.removeItem(menuDraftKey);
            return;
        }
        localStorage.setItem(menuDraftKey, JSON.stringify({
            form: menuItemForm,
            images: menuImagePreviews,
        }));
    }, [menuDraftKey, menuImagePreviews, menuItemForm]);

    const validateMenuItemForm = () => {
        const errors = {};
        if (!menuItemForm.name.trim()) {
            errors.name = "Name is required.";
        }
        if (!String(menuItemForm.price || "").trim()) {
            errors.price = "Price is required.";
        } else if (Number(menuItemForm.price) <= 0) {
            errors.price = "Price must be positive.";
        }
        return errors;
    };

    const focusMenuForm = () => {
        setTimeout(() => {
            document.getElementById("owner-menu-name")?.focus();
            document.getElementById("owner-menu-name")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
    };

    const handleAddStaff = async (payload) => {
        const firstName = payload.firstName.trim();
        const lastName = payload.lastName.trim();
        const username = payload.username.trim();
        const email = payload.email.trim();
        const phone = payload.phone.trim();
        const gender = payload.gender || "";
        const maritalStatus = payload.maritalStatus || "";
        const instituteName = payload.instituteName.trim();
        const degree = payload.degree.trim();
        const passingYear = payload.passingYear.trim();
        const grade = payload.grade.trim();
        const percentage = payload.percentage.trim();
        const street = payload.street.trim();
        const plotNo = payload.plotNo.trim();
        const city = payload.city.trim();
        const stateRegion = payload.stateRegion.trim();
        const pincode = payload.pincode.trim();
        const companyName = payload.companyName.trim();
        const companyLocation = payload.companyLocation.trim();
        const startDate = payload.startDate;
        const endDate = payload.endDate;
        const packageAmount = payload.packageAmount.trim();
        const identificationName = payload.identificationName || "";
        const password = payload.password;
        const role = payload.role;
        if (!role || !firstName || !lastName || !username || !email || !password) {
            throw new Error("Fill role, first name, last name, username, email and password.");
        }
        const fullAddress = [street, plotNo, city, stateRegion, pincode].filter(Boolean).join(", ");
        const workExperience = [companyName, companyLocation, startDate || null, endDate || null, packageAmount ? `Package: ${packageAmount}` : null]
            .filter(Boolean)
            .join(" | ");
        const additionalDetails = [
            gender ? `Gender: ${gender}` : null,
            maritalStatus ? `Marital: ${maritalStatus}` : null,
            instituteName ? `Institute: ${instituteName}` : null,
            degree ? `Degree: ${degree}` : null,
            passingYear ? `Passing Year: ${passingYear}` : null,
            grade ? `Grade: ${grade}` : null,
            percentage ? `Percentage: ${percentage}` : null,
            identificationName ? `Identification: ${identificationName}` : null,
        ]
            .filter(Boolean)
            .join(" | ");

        setSubmitting(true);
        try {
            await api.createOwnerStaff({
                cafeId: String(cafeId),
                role,
                firstName,
                lastName,
                username,
                email,
                phone,
                address: fullAddress || undefined,
                workExperience: workExperience || undefined,
                additionalDetails: additionalDetails || undefined,
                password,
            });
            await refreshStaffMembers();
            setStaffModalOpen(false);
            showMsg("Staff created");
        } catch (err) {
            throw new Error(err.message || "Failed to create staff");
        } finally {
            setSubmitting(false);
        }
    };

    const refreshStaffMembers = async () => {
        if (!cafeId) {
            setStaffMembers([]);
            return;
        }
        const refreshedStaff = await api.getOwnerStaff(cafeId).catch(() => []);
        setStaffMembers(Array.isArray(refreshedStaff) ? refreshedStaff : []);
    };

    const handleSelectOwnerCafe = (nextCafeId) => {
        if (!nextCafeId) {
            return;
        }
        setActivePanel("cafe");
        setCafeId(nextCafeId);
        localStorage.setItem(OWNER_SELECTED_CAFE_KEY, String(nextCafeId));
        setSelectedOrder(null);
        setHighlightedOrderIds([]);
        hasLoadedOrdersRef.current = false;
        previousOrderIdsRef.current = [];
        loadData(nextCafeId);
    };

    const handleOpenStaffEdit = (member) => {
        setStaffActionMenuId(null);
        setStaffEditingMember(member);
        setStaffEditDraft({
            fullName: member.fullName || "",
            username: member.username || "",
            email: member.email || "",
            phone: member.phone || "",
            enabled: member.enabled !== false,
        });
    };

    const handleSaveStaffEdit = async () => {
        if (!staffEditingMember) return;
        setSubmitting(true);
        try {
            const updated = await api.updateOwnerStaff(staffEditingMember.id, staffEditDraft);
            setStaffMembers((prev) => (prev || []).map((member) => (
                member.id === staffEditingMember.id ? updated : member
            )));
            setStaffEditingMember(null);
            showMsg("Updated successfully");
        } catch (err) {
            showMsg(err.message || "Failed to update staff");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        const tableNumber = String(tableForm.tableNumber || "")
            .toUpperCase()
            .replace(/[^0-9A-Za-z-]/g, "")
            .trim();
        const capacity = Math.max(1, parseInt(tableForm.capacity, 10) || 1);
        const location = tableForm.location || "INDOOR";
        if (!tableNumber) {
            showMsg("Table number is required.");
            return;
        }
        setSubmitting(true);
        try {
            await api.addOwnerTable(cafeId, { tableNumber, capacity, status: "AVAILABLE", location });
            setTableForm(INITIAL_TABLE_FORM);
            loadData();
            showMsg("Table added");
        } catch (err) {
            showMsg(err.message || "Failed to add table");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTableNumberChange = (value) => {
        const sanitized = value
            .toUpperCase()
            .replace(/[^0-9A-Z-]/g, "");
        setTableForm((current) => ({
            ...current,
            tableNumber: sanitized,
        }));
    };

    const changeTableCapacity = (delta) => {
        setTableForm((current) => ({
            ...current,
            capacity: Math.max(1, (parseInt(current.capacity, 10) || 1) + delta),
        }));
    };

    const handleAddMenuItem = async (e) => {
        e.preventDefault();
        const errors = validateMenuItemForm();
        setMenuFormErrors(errors);
        if (Object.keys(errors).length) {
            return;
        }
        const name = menuItemForm.name.trim();
        const description = menuItemForm.description.trim() || null;
        const imageUrls = menuImagePreviews.map((image) => image.url).join(",");
        const price = parseFloat(menuItemForm.price) || 0;
        const category = menuItemForm.category || "FOOD";
        const available = menuItemForm.available !== false;
        setSubmitting(true);
        try {
            await api.addOwnerMenuItem(cafeId, {
                name,
                description,
                imageUrls: imageUrls || null,
                price,
                category,
                available,
            });
            resetMenuItemForm();
            loadData();
            showMsg("Menu item added.");
        } catch (err) {
            showMsg(err.message || "Failed to add menu item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartEditTable = (table) => {
        setSelectedTableId(table.id);
        setEditingTableId(table.id);
        setEditingTableDraft({
            tableNumber: table.tableNumber || "",
            capacity: table.capacity ?? 2,
            location: table.location || "INDOOR",
        });
    };

    const handleCancelEditTable = () => {
        setEditingTableId(null);
        setEditingTableDraft({ tableNumber: "", capacity: 2, location: "INDOOR" });
    };

    const handleSaveEditTable = async (table) => {
        const tableNumber = (editingTableDraft.tableNumber || "").trim();
        const capacity = parseInt(editingTableDraft.capacity, 10) || 1;
        const location = editingTableDraft.location || "INDOOR";
        if (!tableNumber) {
            showMsg("Table number is required.");
            return;
        }
        setSubmitting(true);
        try {
            const updated = {
                ...table,
                tableNumber,
                capacity,
                location,
            };
            await api.updateOwnerTable(cafeId, table.id, updated);
            setTables((prev) =>
                (prev || []).map((t) => (t.id === table.id ? updated : t))
            );
            showMsg("Updated successfully");
            handleCancelEditTable();
        } catch (err) {
            showMsg(err.message || "Failed to update table");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTableStatus = async (table, newStatus) => {
        if (!newStatus || newStatus === table.status) return;
        setSubmitting(true);
        try {
            await api.updateOwnerTable(cafeId, table.id, {
                ...table,
                status: newStatus,
            });
            setTables((prev) =>
                (prev || []).map((t) =>
                    t.id === table.id ? { ...t, status: newStatus } : t
                )
            );
            showMsg("Updated successfully");
        } catch (err) {
            showMsg(err.message || "Failed to update table");
        } finally {
            setSubmitting(false);
        }
    };

    const handleInlineTableCapacityChange = async (table, nextCapacity) => {
        const capacity = Math.max(1, parseInt(nextCapacity, 10) || 1);
        if (capacity === Number(table.capacity || 1)) return;
        setSubmitting(true);
        try {
            await api.updateOwnerTable(cafeId, table.id, {
                ...table,
                capacity,
            });
            setTables((prev) =>
                (prev || []).map((t) =>
                    t.id === table.id ? { ...t, capacity } : t
                )
            );
            showMsg("Updated successfully");
        } catch (err) {
            showMsg(err.message || "Failed to update table");
        } finally {
            setSubmitting(false);
        }
    };

    const requestDeleteTable = (table) => {
        setSelectedTableId(table.id);
        setTablePendingDelete(table);
    };

    const handleDeleteTable = async () => {
        if (!tablePendingDelete) return;
        setSubmitting(true);
        try {
            await api.deleteOwnerTable(cafeId, tablePendingDelete.id);
            setTables((prev) => (prev || []).filter((t) => t.id !== tablePendingDelete.id));
            showMsg("Deleted");
            setTablePendingDelete(null);
        } catch (err) {
            showMsg(err.message || "Failed to delete table");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleMenuAvailable = async (item) => {
        try {
            await api.updateOwnerMenuItem(cafeId, item.id, {
                ...item,
                available: !item.available,
            });
            loadData();
            showMsg("Updated successfully");
        } catch (err) {
            showMsg(err.message || "Failed to update");
        }
    };

    const handleMenuPriceBlur = async (item, event) => {
        const raw = event.target.value;
        const value = parseFloat(raw);
        if (Number.isNaN(value) || value < 0) {
            showMsg("Enter a valid non-negative price.");
            event.target.value = item.price != null ? Number(item.price).toFixed(2) : "";
            return;
        }
        const current = Number(item.price || 0);
        if (Number(value.toFixed(2)) === Number(current.toFixed(2))) {
            return;
        }
        try {
            await api.updateOwnerMenuItem(cafeId, item.id, {
                ...item,
                price: value,
            });
            showMsg("Updated successfully");
            // Update local menu state optimistically so it feels instant
            setMenu((prev) =>
                (prev || []).map((m) =>
                    m.id === item.id ? { ...m, price: value } : m
                )
            );
        } catch (err) {
            showMsg(err.message || "Failed to update price");
            event.target.value = item.price != null ? Number(item.price).toFixed(2) : "";
        }
    };

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const normalizedTableSearch = tableSearch.trim().toLowerCase();
    const normalizedOrderSearch = orderSearch.trim().toLowerCase();
    const filteredTables = (tables || []).filter((table) => {
        const matchesSearch = !normalizedTableSearch
            || String(table.tableNumber || "").toLowerCase().includes(normalizedTableSearch);
        const matchesStatus = tableStatusFilter === "ALL" || table.status === tableStatusFilter;
        const matchesLocation = tableLocationFilter === "ALL" || table.location === tableLocationFilter;
        return matchesSearch && matchesStatus && matchesLocation;
    });
    const normalizedStaffSearch = staffSearch.trim().toLowerCase();
    const chefStaff = (staffMembers || []).filter((member) => member.role === "CHEF");
    const waiterStaff = (staffMembers || []).filter((member) => member.role === "WAITER");
    const activeBaseStaffMembers = staffListTab === "CHEF" ? chefStaff : waiterStaff;
    const activeStaffMembers = activeBaseStaffMembers.filter((member) => {
        const matchesSearch = !normalizedStaffSearch
            || String(member.fullName || "").toLowerCase().includes(normalizedStaffSearch)
            || String(member.username || "").toLowerCase().includes(normalizedStaffSearch);
        const matchesRole = staffRoleFilter === "ALL" || member.role === staffRoleFilter;
        const derivedStatus = member.enabled ? "ACTIVE" : "INACTIVE";
        const matchesStatus = staffStatusFilter === "ALL" || derivedStatus === staffStatusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });
    const activeStaffTitle = staffListTab === "CHEF" ? "Chefs" : "Waiters";
    const activeEmptyMessage = staffListTab === "CHEF" ? "No chefs registered yet." : "No waiters registered yet.";
    const filteredMenu = [...(menu || [])]
        .filter((item) => {
            if (menuCategoryFilter !== "ALL" && item.category !== menuCategoryFilter) {
                return false;
            }
            if (!normalizedMenuSearch) {
                return true;
            }
            return (item.name || "").toLowerCase().includes(normalizedMenuSearch);
        })
        .sort((a, b) => {
            if (menuPriceSort === "price-asc") {
                return Number(a.price || 0) - Number(b.price || 0);
            }
            if (menuPriceSort === "price-desc") {
                return Number(b.price || 0) - Number(a.price || 0);
            }
            return (a.name || "").localeCompare(b.name || "");
        });
    const filteredOrders = [...(orders || [])]
        .filter((order) => {
            const matchesSearch = !normalizedOrderSearch
                || String(order.orderNumber || "").toLowerCase().includes(normalizedOrderSearch)
                || String(order.id || "").toLowerCase().includes(normalizedOrderSearch);
            const matchesStatus = orderStatusFilter === "ALL" || String(order.status || "") === orderStatusFilter;
            const matchesDate = !orderDateFilter
                || (order.createdAt && new Date(order.createdAt).toISOString().slice(0, 10) === orderDateFilter);
            return matchesSearch && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
            if (orderSort.key === "totalAmount") {
                const amountDelta = Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
                return orderSort.direction === "asc" ? amountDelta : -amountDelta;
            }
            const dateDelta = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            return orderSort.direction === "asc" ? dateDelta : -dateDelta;
        });
    const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / OWNER_ORDER_PAGE_SIZE));
    const safeOrderPage = Math.min(orderPage, totalOrderPages);
    const paginatedOrders = filteredOrders.slice(
        (safeOrderPage - 1) * OWNER_ORDER_PAGE_SIZE,
        safeOrderPage * OWNER_ORDER_PAGE_SIZE
    );
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
            return {
                key,
                direction: key === "createdAt" ? "desc" : "asc",
            };
        });
    };
    const getOrderSortIndicator = (key) => {
        if (orderSort.key !== key) return "Sort";
        return orderSort.direction === "asc" ? "Ascending" : "Descending";
    };
    const handleViewOrderDetails = async (orderId) => {
        setOrderDetailsLoading(true);
        try {
            const detail = await api.getOwnerOrder(orderId);
            setSelectedOrder(detail);
            if (activePanel === "bookings") {
                showMsg("Booking details opened.");
            }
        } catch (err) {
            showMsg(err.message || "Failed to load order details", "error");
        } finally {
            setOrderDetailsLoading(false);
        }
    };
    const analyticsStatusOptions = Array.from(
        new Set((orders || []).map((order) => order.status).filter(Boolean))
    ).sort((a, b) => String(a).localeCompare(String(b)));
    const analyticsRangeStart = (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (analyticsRange === "30d") {
            now.setDate(now.getDate() - 29);
            return now;
        }
        if (analyticsRange === "custom" && analyticsCustomStart) {
            return new Date(`${analyticsCustomStart}T00:00:00`);
        }
        now.setDate(now.getDate() - 6);
        return now;
    })();
    const analyticsRangeEnd = (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (analyticsRange === "custom" && analyticsCustomEnd) {
            return new Date(`${analyticsCustomEnd}T00:00:00`);
        }
        return now;
    })();
    const analyticsFilteredOrders = (orders || []).filter((order) => {
        const matchesStatus = analyticsStatusFilter === "ALL" || order.status === analyticsStatusFilter;
        if (!matchesStatus) {
            return false;
        }
        if (!order.createdAt) {
            return false;
        }
        const createdAt = new Date(order.createdAt);
        const rangeStart = new Date(analyticsRangeStart);
        const rangeEnd = new Date(analyticsRangeEnd);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setHours(23, 59, 59, 999);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= rangeStart && createdAt <= rangeEnd;
    });
    const analyticsRangeSpanDays = Math.max(
        1,
        Math.floor((analyticsRangeEnd.getTime() - analyticsRangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const analyticsPreviousRangeStart = new Date(analyticsRangeStart);
    analyticsPreviousRangeStart.setDate(analyticsPreviousRangeStart.getDate() - analyticsRangeSpanDays);
    const analyticsPreviousRangeEnd = new Date(analyticsRangeStart);
    analyticsPreviousRangeEnd.setDate(analyticsPreviousRangeEnd.getDate() - 1);
    analyticsPreviousRangeEnd.setHours(23, 59, 59, 999);
    const analyticsComparisonOrders = (orders || []).filter((order) => {
        const matchesStatus = analyticsStatusFilter === "ALL" || order.status === analyticsStatusFilter;
        if (!matchesStatus || !order.createdAt) {
            return false;
        }
        const createdAt = new Date(order.createdAt);
        return !Number.isNaN(createdAt.getTime())
            && createdAt >= analyticsPreviousRangeStart
            && createdAt <= analyticsPreviousRangeEnd;
    });
    const analyticsOpenStatuses = ["PENDING", "CONFIRMED", "PAID", "PREPARING", "READY"];
    const analyticsRevenue = analyticsFilteredOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const analyticsPreviousRevenue = analyticsComparisonOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const analyticsAverageOrderValue = analyticsFilteredOrders.length > 0 ? analyticsRevenue / analyticsFilteredOrders.length : 0;
    const analyticsPreviousAverageOrderValue = analyticsComparisonOrders.length > 0
        ? analyticsPreviousRevenue / analyticsComparisonOrders.length
        : 0;
    const analyticsActiveOrderCount = analyticsFilteredOrders.filter((order) => analyticsOpenStatuses.includes(order.status)).length;
    const analyticsPreviousActiveOrderCount = analyticsComparisonOrders.filter((order) => analyticsOpenStatuses.includes(order.status)).length;
    const analyticsBusy = loading || analyticsRefreshing;
    const ordersByStatus = analyticsFilteredOrders.reduce((acc, o) => {
        const s = o.status || "PENDING";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const statusPieData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));
    const bookingRecords = [...(orders || [])]
        .filter((order) => order.reservationDate || order.reservationTimeSlot)
        .sort((a, b) => {
            const reservationA = `${a.reservationDate || ""}T${a.reservationTimeSlot || "00:00"}`;
            const reservationB = `${b.reservationDate || ""}T${b.reservationTimeSlot || "00:00"}`;
            return new Date(reservationA).getTime() - new Date(reservationB).getTime();
        });
    const normalizedBookingSearch = bookingSearch.trim().toLowerCase();
    const bookingTableOptions = Array.from(
        new Set(
            bookingRecords
                .map((booking) => booking.cafeTable?.tableNumber)
                .filter(Boolean)
        )
    ).sort((a, b) => String(a).localeCompare(String(b)));
    const filteredBookingRecords = [...bookingRecords]
        .filter((booking) => {
            const matchesSearch = !normalizedBookingSearch
                || String(booking.orderNumber || "").toLowerCase().includes(normalizedBookingSearch)
                || String(booking.customer?.username || "").toLowerCase().includes(normalizedBookingSearch);
            const matchesDate = !bookingDateFilter || booking.reservationDate === bookingDateFilter;
            const matchesStatus = bookingStatusFilter === "ALL"
                || getBookingStatusDisplay(booking.status) === bookingStatusFilter;
            const matchesTable = bookingTableFilter === "ALL"
                || String(booking.cafeTable?.tableNumber || "") === bookingTableFilter;
            return matchesSearch && matchesDate && matchesStatus && matchesTable;
        })
        .sort((a, b) => {
            const dateA = `${a.reservationDate || ""}T${a.reservationTimeSlot || "00:00"}`;
            const dateB = `${b.reservationDate || ""}T${b.reservationTimeSlot || "00:00"}`;
            if (bookingSort === "date-desc") {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            if (bookingSort === "time-asc") {
                return String(a.reservationTimeSlot || "").localeCompare(String(b.reservationTimeSlot || ""));
            }
            if (bookingSort === "time-desc") {
                return String(b.reservationTimeSlot || "").localeCompare(String(a.reservationTimeSlot || ""));
            }
            if (bookingSort === "guests-asc") {
                return Number(a.guestCount || 0) - Number(b.guestCount || 0);
            }
            if (bookingSort === "guests-desc") {
                return Number(b.guestCount || 0) - Number(a.guestCount || 0);
            }
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    const todayKey = new Date().toISOString().slice(0, 10);
    const totalBookingsToday = bookingRecords.filter((booking) => booking.reservationDate === todayKey).length;
    const upcomingBookings = bookingRecords.filter(
        (booking) =>
            booking.status !== "CANCELLED"
            && booking.reservationDate
            && booking.reservationDate > todayKey
    ).length;
    const activeBookings = bookingRecords.filter((booking) =>
        ["CONFIRMED", "PAID", "PREPARING", "READY"].includes(booking.status)
    ).length;
    const cancelledBookings = bookingRecords.filter((booking) => booking.status === "CANCELLED").length;
    const analyticsKpis = [
        {
            key: "orders",
            label: "Total Orders",
            value: formatCompactNumber(analyticsFilteredOrders.length),
            change: calculatePercentChange(analyticsFilteredOrders.length, analyticsComparisonOrders.length),
            accent: "sky",
        },
        {
            key: "revenue",
            label: "Revenue",
            value: formatCompactCurrency(analyticsRevenue),
            change: calculatePercentChange(analyticsRevenue, analyticsPreviousRevenue),
            accent: "violet",
        },
        {
            key: "average",
            label: "Avg Order Value",
            value: formatCompactCurrency(analyticsAverageOrderValue),
            change: calculatePercentChange(analyticsAverageOrderValue, analyticsPreviousAverageOrderValue),
            accent: "amber",
        },
        {
            key: "active",
            label: "Active Orders",
            value: formatCompactNumber(analyticsActiveOrderCount),
            change: calculatePercentChange(analyticsActiveOrderCount, analyticsPreviousActiveOrderCount),
            accent: "emerald",
        },
    ];
    const analyticsTrendData = (() => {
        const labels = [];
        const map = new Map();
        const cursor = new Date(analyticsRangeStart);
        const end = new Date(analyticsRangeEnd);
        if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) {
            return [];
        }
        while (cursor <= end) {
            const key = cursor.toISOString().slice(0, 10);
            labels.push(key);
            map.set(key, { dateKey: key, orders: 0, revenue: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
        analyticsFilteredOrders.forEach((order) => {
            if (!order.createdAt) return;
            const key = new Date(order.createdAt).toISOString().slice(0, 10);
            if (map.has(key)) {
                const current = map.get(key);
                map.set(key, {
                    ...current,
                    orders: current.orders + 1,
                    revenue: current.revenue + (Number(order.totalAmount) || 0),
                });
            }
        });
        return labels.map((key) => ({
            ...map.get(key),
            label: formatAnalyticsTick(key),
        }));
    })();
    const activeStatusSliceData = activeAnalyticsSlice != null ? statusPieData[activeAnalyticsSlice] : null;
    const peakDayInsight = analyticsTrendData.reduce(
        (best, current) => (current.orders > best.orders ? current : best),
        analyticsTrendData[0] || { dateKey: "", label: "—", orders: 0, revenue: 0 }
    );
    const highestRevenueInsight = analyticsTrendData.reduce(
        (best, current) => (current.revenue > best.revenue ? current : best),
        analyticsTrendData[0] || { dateKey: "", label: "—", orders: 0, revenue: 0 }
    );
    const topStatusInsight = Object.entries(ordersByStatus).reduce(
        (best, current) => (current[1] > best[1] ? current : best),
        ["—", 0]
    );
    const analyticsInsights = [
        {
            key: "peak",
            label: "Peak Day",
            value: peakDayInsight.dateKey
                ? new Date(`${peakDayInsight.dateKey}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" })
                : "—",
            meta: `${peakDayInsight.orders || 0} orders`,
            accent: "sky",
        },
        {
            key: "status",
            label: "Most common status",
            value: topStatusInsight[0],
            meta: `${topStatusInsight[1] || 0} orders`,
            accent: "amber",
        },
        {
            key: "revenue",
            label: "Highest revenue day",
            value: highestRevenueInsight.dateKey ? formatCompactCurrency(highestRevenueInsight.revenue) : "—",
            meta: highestRevenueInsight.label || "No data",
            accent: "violet",
        },
    ];
    const ownerSettingsContent = {
        profile: {
            title: "Profile Settings",
            description: "Review owner account identity and the primary account details connected to this dashboard.",
            cards: [
                {
                    title: "Account Profile",
                    rows: [
                        ["Owner Name", ownerProfile?.username || user.username || "Owner"],
                        ["Email", ownerProfile?.email || user.email || "—"],
                        ["Role", "Owner"],
                    ],
                },
                {
                    title: "Contact Snapshot",
                    rows: [
                        ["Phone", ownerProfile?.phone || cafe?.phone || "Not added"],
                        ["Cafe Linked", cafe?.name || "No cafe assigned"],
                        ["Status", cafeId ? "Active" : "Pending setup"],
                    ],
                },
            ],
        },
        cafe: {
            title: "Cafe Settings",
            description: "Keep the main cafe identity, contact details, and operational summary visible in one place.",
            cards: [
                {
                    title: "Cafe Information",
                    rows: [
                        ["Cafe Name", cafe?.name || "—"],
                        ["Address", cafe?.address || "—"],
                        ["Phone", cafe?.phone || "—"],
                    ],
                },
                {
                    title: "Operational Summary",
                    rows: [
                        ["Description", cafe?.description || "No description added"],
                        ["Total Tables", String(tables.length)],
                        ["Total Menu Items", String(menu.length)],
                    ],
                },
            ],
        },
        };

    const ownerExecuteSection = cafeId ? (
        <div className="sidebar-execute">
            <div className="execute-actions">
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "cafe" ? "active" : ""}`}
                    onClick={() => setActivePanel("cafe")}
                >
                    Cafe dashboard
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "menu" ? "active" : ""}`}
                    onClick={() => setActivePanel("menu")}
                >
                    Menu management
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "orders" ? "active" : ""}`}
                    onClick={() => setActivePanel("orders")}
                >
                    Orders management
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "bookings" ? "active" : ""}`}
                    onClick={() => setActivePanel("bookings")}
                >
                    Bookings management
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "staff" ? "active" : ""}`}
                    onClick={() => setActivePanel("staff")}
                >
                    Staff management
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "tables" ? "active" : ""}`}
                    onClick={() => setActivePanel("tables")}
                >
                    Tables management
                </button>
                <button
                    type="button"
                    className={`execute-btn ${activePanel === "analytics" ? "active" : ""}`}
                    onClick={() => setActivePanel("analytics")}
                >
                    Analytics
                </button>
            </div>
        </div>
    ) : null;

    const ownerNavItems = [
        { path: "/", label: "Home", roles: ["OWNER"] },
        {
            path: "/owner",
            label: "Dashboard",
            roles: ["OWNER"],
            active: activePanel !== "settings",
            onClick: () => setActivePanel("cafe"),
        },
        { path: "/owner/select-cafe", label: "Cafes", roles: ["OWNER"] },
        { path: "/owner/accept", label: "Accept", roles: ["OWNER"] },
        {
            key: "owner-settings",
            label: "Settings",
            roles: ["OWNER"],
            active: activePanel === "settings",
            onClick: () => setActivePanel("settings"),
        },
    ];

    return (
        <DashboardLayout
            title={user.username}
            role="OWNER"
            userEmail={user.email}
            navItemsOverride={ownerNavItems}
            sidebarExtra={ownerExecuteSection}
        >
            <div className="dashboard owner-dashboard">
                <h1 className="dashboard-title">Owner Dashboard</h1>

                {toast && (
                    <div key={toast.id} className={`owner-toast owner-toast-${toast.type}`}>
                        {toast.text}
                    </div>
                )}

                {!cafeId && (
                    <div className="chart-container owner-assigned-cafes-panel">
                        <div className="owner-assigned-cafes-head">
                            <div>
                                <h3>Assigned Cafes</h3>
                                <p>Select a cafe to load its full owner workspace.</p>
                            </div>
                            <span className="owner-assigned-cafes-count">{ownerAssignedCafes.length} cafes</span>
                        </div>
                        {loading && ownerAssignedCafes.length === 0 ? (
                            <p className="empty-msg" style={{ marginTop: 12 }}>Loading assigned cafes...</p>
                        ) : ownerAssignedCafes.length === 0 ? (
                            <p className="empty-msg" style={{ marginTop: 12 }}>No cafes assigned to this owner yet.</p>
                        ) : (
                            <div className="customer-cafe-grid owner-assigned-cafe-grid">
                                {ownerAssignedCafes.map((assignedCafe) => {
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
                                                    onClick={() => handleSelectOwnerCafe(assignedCafe.id)}
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
                )}

                {!cafeId && !loading && ownerAssignedCafes.length === 0 && (
                    <div className="summary-box">
                        <h3>No cafe assigned</h3>
                        <p>This owner account needs a cafe assignment before multi-cafe management can work.</p>
                    </div>
                )}
                {!cafeId && !loading && ownerAssignedCafes.length > 0 && (
                    <div className="summary-box">
                        <h3>Select a cafe</h3>
                        <p>Choose one of your assigned cafes above to open its cafe dashboard.</p>
                    </div>
                )}

                {cafeId && (
                    <>
                {/* Cafe dashboard / manager */}
                {cafeId && activePanel === "cafe" && (
                <div className="owner-management-shell owner-cafe-overview-shell">
                    <div className="owner-management-header">
                        <div>
                            <span className="owner-management-kicker">Cafe Overview</span>
                            <h3>Cafe Overview</h3>
                        </div>
                        <p>Review the core cafe snapshot here, then switch into tables and menu management for detailed updates.</p>
                    </div>
                    <div className="card-grid owner-cards owner-overview-grid">
                        <div className="card admin-card owner-overview-card owner-overview-card-cafe">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="cafe" />
                                </span>
                                <h3>Cafe Name</h3>
                            </div>
                            <p>{cafe?.name || "-"}</p>
                            <span className="owner-overview-card-meta">Primary cafe profile</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-tables">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="tables" />
                                </span>
                                <h3>Total Tables</h3>
                            </div>
                            <p>{tables.length}</p>
                            <span className="owner-overview-card-meta">Available seating assets</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-menu">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="menu" />
                                </span>
                                <h3>Total Menu Items</h3>
                            </div>
                            <p>{menu.length}</p>
                            <span className="owner-overview-card-meta">Published catalog items</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-location">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="location" />
                                </span>
                                <h3>Location</h3>
                            </div>
                            <p className="small-text">{cafe?.address || "-"}</p>
                            <span className="owner-overview-card-meta">Registered cafe address</span>
                        </div>
                    </div>
                </div>
                )}

                {/* Menu + tables overview together for convenience */}
                {cafeId && activePanel === "cafe" && (
                <div className="owner-cafe-overview-stack">
                    <div className="chart-container owner-cafe-tables-panel">
                        <h3>Tables</h3>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="owner-cafe-tables-strip">
                                {tables.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`owner-table-card owner-cafe-table-card status-${(t.status || "").toLowerCase()}`}
                                    >
                                        <span className={`owner-table-status-strip status-${(t.status || "").toLowerCase()}`} />
                                        <div className="owner-table-card-head">
                                            <div className="owner-table-card-copy">
                                                <span className="owner-table-card-label">Table</span>
                                                <strong className="table-number">{t.tableNumber}</strong>
                                                <div className="owner-table-meta-list">
                                                    <span className="owner-table-meta-chip">
                                                        <TableMetaIcon type="seats" />
                                                        {t.capacity ?? "-"} seats
                                                    </span>
                                                    <span className="owner-table-meta-chip">
                                                        <TableMetaIcon type="location" />
                                                        {getTableLocationLabel(t.location)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`table-status table-status-pill status-${(t.status || "").toLowerCase()}`}>
                                                {TABLE_STATUS_LABELS[t.status] || t.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {tables.length === 0 && <p className="empty-msg">No tables yet.</p>}
                            </div>
                        )}
                    </div>
                    <div className="chart-container owner-cafe-menu-panel owner-menu-card owner-menu-table-card">
                        <h3>Current Menu</h3>
                        <p className="panel-meta">Review pricing and update availability without leaving this page.</p>
                        <div className="data-table-wrap">
                            <table className="data-table owner-modern-menu-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Available</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menu.map((m, index) => (
                                        <tr key={m.id} className={index % 2 === 0 ? "is-even" : "is-odd"}>
                                            <td>
                                                <div className="owner-menu-item-cell">
                                                    {getPrimaryImage(m.imageUrls) ? (
                                                        <img
                                                            className="owner-menu-item-thumb"
                                                            src={getPrimaryImage(m.imageUrls)}
                                                            alt={m.name}
                                                        />
                                                    ) : (
                                                        <div className="owner-menu-item-thumb owner-menu-item-thumb-placeholder">
                                                            {String(m.name || "M").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="owner-menu-item-copy">
                                                        <strong>{m.name}</strong>
                                                        {m.description && <span>{m.description}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`owner-menu-category-badge owner-menu-category-${String(m.category || "").toLowerCase()}`}>
                                                    {getCategoryLabel(m.category)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="owner-menu-price-wrap">
                                                    <span className="owner-menu-price-label">Price</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="owner-menu-price-input"
                                                        defaultValue={m.price != null ? Number(m.price).toFixed(2) : ""}
                                                        onBlur={(e) => handleMenuPriceBlur(m, e)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`owner-menu-status-badge ${m.available ? "available" : "unavailable"}`}>
                                                    {m.available ? "Available" : "Unavailable"}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="btn-sm ripple-btn" onClick={() => handleToggleMenuAvailable(m)}>
                                                    {m.available ? "Set unavailable" : "Set available"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {menu.length === 0 && !loading && (
                            <div className="owner-menu-empty-state">
                                <div className="owner-menu-empty-illustration" aria-hidden="true">
                                    <span className="owner-menu-empty-plate" />
                                    <span className="owner-menu-empty-cup" />
                                    <span className="owner-menu-empty-steam owner-menu-empty-steam-one" />
                                    <span className="owner-menu-empty-steam owner-menu-empty-steam-two" />
                                </div>
                                <h4>No menu items yet</h4>
                                <p>Add your first dish or drink to start building this cafe menu.</p>
                                <button
                                    type="button"
                                    className="owner-menu-empty-cta ripple-btn"
                                    onClick={focusMenuForm}
                                >
                                    Add first menu item
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* Staff management */}
                {cafeId && activePanel === "staff" && (
                    <div id="owner-staff-register" className="admin-panel owner-panel owner-staff-register">
                        <div className="owner-staff-header">
                            <div className="owner-staff-header-copy">
                                <p className="owner-staff-kicker">👥 Team Setup</p>
                                <h3>Staff Management</h3>
                                <p className="panel-meta">Manage your chef and waiter accounts, and onboard new staff from one place.</p>
                            </div>
                            <button
                                type="button"
                                className="owner-staff-add-btn ripple-btn"
                                onClick={() => setStaffModalOpen(true)}
                            >
                                <span className="owner-table-add-btn-icon">+</span>
                                <span>Add Staff</span>
                            </button>
                        </div>
                        <div className="owner-staff-list-card owner-staff-list-tabs-card">
                            <div className="owner-staff-toolbar">
                                <label className="owner-staff-search">
                                    <span className="owner-table-toolbar-label">Search staff</span>
                                    <input
                                        type="text"
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                        placeholder="Search name or username"
                                    />
                                </label>
                                <label className="owner-staff-filter">
                                    <span className="owner-table-toolbar-label">Role</span>
                                    <select value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value)}>
                                        <option value="ALL">All</option>
                                        <option value="CHEF">Chef</option>
                                        <option value="WAITER">Waiter</option>
                                    </select>
                                </label>
                                <label className="owner-staff-filter">
                                    <span className="owner-table-toolbar-label">Status</span>
                                    <select value={staffStatusFilter} onChange={(e) => setStaffStatusFilter(e.target.value)}>
                                        <option value="ALL">All</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </label>
                            </div>
                            <div className="owner-staff-tabs" role="tablist" aria-label="Staff type">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={staffListTab === "CHEF"}
                                    className={`owner-staff-tab ${staffListTab === "CHEF" ? "active" : ""}`}
                                    onClick={() => setStaffListTab("CHEF")}
                                >
                                    <span>Chefs</span>
                                    <strong>{chefStaff.length}</strong>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={staffListTab === "WAITER"}
                                    className={`owner-staff-tab ${staffListTab === "WAITER" ? "active" : ""}`}
                                    onClick={() => setStaffListTab("WAITER")}
                                >
                                    <span>Waiters</span>
                                    <strong>{waiterStaff.length}</strong>
                                </button>
                            </div>
                            <div className="owner-staff-list-head">
                                <h3>{activeStaffTitle}</h3>
                                <span>{activeStaffMembers.length}</span>
                            </div>
                            <div className="data-table-wrap staff-data-table-wrap">
                                <table className="data-table staff-data-table">
                                    <thead>
                                        <tr>
                                            <th>Staff Member</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeStaffMembers.map((member) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <div className="staff-member-cell">
                                                        <div className="staff-member-avatar">
                                                            {String(member.fullName || member.username || activeStaffTitle.charAt(0)).trim().charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="staff-member-copy">
                                                            <strong>{member.fullName || "-"}</strong>
                                                            <span className="staff-member-username">@{member.username}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`staff-role-badge ${member.role === "CHEF" ? "staff-role-badge-chef" : "staff-role-badge-waiter"}`}>
                                                        {member.role === "CHEF" ? "Chef" : "Waiter"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="staff-contact-link">{member.email}</span>
                                                </td>
                                                <td>
                                                    <span className="staff-phone-cell">
                                                        <span aria-hidden="true">📞</span>
                                                        <span>{member.phone || "-"}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`staff-status-badge ${member.enabled ? "staff-status-badge-active" : "staff-status-badge-inactive"}`}>
                                                        {member.enabled ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="staff-actions-cell">
                                                        <button
                                                            type="button"
                                                            className="staff-actions-trigger"
                                                            aria-haspopup="menu"
                                                            aria-expanded={staffActionMenuId === member.id}
                                                            onClick={() => setStaffActionMenuId((current) => current === member.id ? null : member.id)}
                                                        >
                                                            ⋮
                                                        </button>
                                                        {staffActionMenuId === member.id && (
                                                            <div className="staff-actions-menu" role="menu">
                                                                <button type="button" role="menuitem" onClick={() => handleOpenStaffEdit(member)}>
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!loading && activeStaffMembers.length === 0 && <p className="empty-msg">{activeEmptyMessage}</p>}
                        </div>

                        {staffModalOpen && (
                            <div className="owner-staff-modal-overlay" onClick={() => setStaffModalOpen(false)}>
                                <div className="owner-staff-modal-card" onClick={(e) => e.stopPropagation()}>
                                    <div className="owner-staff-modal-head">
                                        <div>
                                            <p className="owner-staff-kicker">Staff Registration</p>
                                            <h3>Add Chef or Waiter</h3>
                                        </div>
                                        <button
                                            type="button"
                                            className="registration-back-btn"
                                            onClick={() => setStaffModalOpen(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <OwnerStaffRegistrationPanel onSubmit={handleAddStaff} loading={submitting} />
                                </div>
                            </div>
                        )}

                        {staffEditingMember && (
                            <div className="owner-confirm-overlay" onClick={() => setStaffEditingMember(null)}>
                                <div className="owner-confirm-card owner-staff-action-card" onClick={(e) => e.stopPropagation()}>
                                    <span className="owner-confirm-kicker">Edit staff</span>
                                    <h4>Update {staffEditingMember.fullName || staffEditingMember.username}</h4>
                                    <div className="owner-staff-action-form">
                                        <label>
                                            <span>Full name</span>
                                            <input
                                                type="text"
                                                value={staffEditDraft.fullName}
                                                onChange={(e) => setStaffEditDraft((current) => ({ ...current, fullName: e.target.value }))}
                                            />
                                        </label>
                                        <label>
                                            <span>Username</span>
                                            <input
                                                type="text"
                                                value={staffEditDraft.username}
                                                onChange={(e) => setStaffEditDraft((current) => ({ ...current, username: e.target.value }))}
                                            />
                                        </label>
                                        <label>
                                            <span>Email</span>
                                            <input
                                                type="email"
                                                value={staffEditDraft.email}
                                                onChange={(e) => setStaffEditDraft((current) => ({ ...current, email: e.target.value }))}
                                            />
                                        </label>
                                        <label>
                                            <span>Phone</span>
                                            <input
                                                type="text"
                                                value={staffEditDraft.phone}
                                                onChange={(e) => setStaffEditDraft((current) => ({ ...current, phone: e.target.value }))}
                                            />
                                        </label>
                                        <label className="owner-staff-action-toggle">
                                            <span>Status</span>
                                            <div className="owner-staff-status-toggle" role="radiogroup" aria-label="Staff status">
                                                <button
                                                    type="button"
                                                    className={`owner-staff-status-btn ${staffEditDraft.enabled ? "active" : ""}`}
                                                    aria-pressed={staffEditDraft.enabled}
                                                    onClick={() => setStaffEditDraft((current) => ({ ...current, enabled: true }))}
                                                >
                                                    Active
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`owner-staff-status-btn ${!staffEditDraft.enabled ? "active" : ""}`}
                                                    aria-pressed={!staffEditDraft.enabled}
                                                    onClick={() => setStaffEditDraft((current) => ({ ...current, enabled: false }))}
                                                >
                                                    Inactive
                                                </button>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="owner-confirm-actions">
                                        <button
                                            type="button"
                                            className="payment-secondary-btn"
                                            onClick={() => setStaffEditingMember(null)}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="owner-table-text-btn owner-table-btn-edit ripple-btn"
                                            onClick={handleSaveStaffEdit}
                                            disabled={submitting}
                                        >
                                            {submitting && <span className="owner-btn-spinner" />}
                                            <span>{submitting ? "Saving..." : "Save"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* Tables management */}
                {cafeId && activePanel === "tables" && (
                    <div className="admin-panel owner-panel owner-tables-panel owner-management-shell">
                        <div className="owner-panel-head">
                            <span className="owner-management-kicker">Tables Management</span>
                            <button
                                type="button"
                                className="owner-back-btn ripple-btn"
                                onClick={() => setActivePanel("cafe")}
                            >
                                <span aria-hidden="true">←</span>
                                <span>Back</span>
                            </button>
                            <p className="owner-breadcrumb">Dashboard / Tables</p>
                            <h3 className="owner-panel-title">Manage Tables</h3>
                            <p className="owner-panel-subtitle">Control seating capacity, location, and availability from one place.</p>
                        </div>

                        <div className="owner-table-stats">
                            <div className="owner-table-stat owner-table-stat-total">
                                <div className="owner-table-stat-head">
                                    <span className="owner-table-stat-icon" aria-hidden="true">🪑</span>
                                    <span>Total Tables</span>
                                </div>
                                <strong>{tables.length}</strong>
                            </div>
                            <div className="owner-table-stat owner-table-stat-available">
                                <div className="owner-table-stat-head">
                                    <span className="owner-table-stat-icon" aria-hidden="true">✅</span>
                                    <span>Available</span>
                                </div>
                                <strong>{(tables || []).filter((t) => t.status === "AVAILABLE").length}</strong>
                            </div>
                            <div className="owner-table-stat owner-table-stat-inuse">
                                <div className="owner-table-stat-head">
                                    <span className="owner-table-stat-icon" aria-hidden="true">🍽</span>
                                    <span>In Use</span>
                                </div>
                                <strong>{(tables || []).filter((t) => t.status !== "AVAILABLE").length}</strong>
                            </div>
                        </div>

                        <form className="admin-form owner-table-add-form" onSubmit={handleAddTable}>
                            <div className="owner-table-add-card">
                                <div className="owner-table-add-field">
                                    <span className="owner-table-add-label">Table Number</span>
                                    <div className="owner-table-input-wrap">
                                        <input
                                            name="tableNumber"
                                            value={tableForm.tableNumber || ""}
                                            onChange={(e) => handleTableNumberChange(e.target.value)}
                                            placeholder="CP-1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="owner-table-add-field">
                                    <span className="owner-table-add-label">Seats</span>
                                    <div className="owner-table-stepper">
                                        <button
                                            type="button"
                                            className="owner-stepper-btn ripple-btn"
                                            onClick={() => changeTableCapacity(-1)}
                                            disabled={submitting || Number(tableForm.capacity) <= 1}
                                        >
                                            -
                                        </button>
                                        <input
                                            name="capacity"
                                            type="number"
                                            min="1"
                                            value={tableForm.capacity}
                                            onChange={(e) =>
                                                setTableForm((current) => ({
                                                    ...current,
                                                    capacity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                                }))
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="owner-stepper-btn ripple-btn"
                                            onClick={() => changeTableCapacity(1)}
                                            disabled={submitting}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="owner-table-add-field">
                                    <span className="owner-table-add-label">Type</span>
                                    <select
                                        name="location"
                                        aria-label="Location"
                                        value={tableForm.location}
                                        onChange={(e) =>
                                            setTableForm((current) => ({
                                                ...current,
                                                location: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="INDOOR">🌿 Indoor</option>
                                        <option value="OUTDOOR">☀️ Outdoor</option>
                                        <option value="WINDOW">🪟 Window</option>
                                    </select>
                                </div>

                                <button type="submit" className="owner-table-add-btn ripple-btn" disabled={submitting}>
                                    <span className="owner-table-add-btn-icon">{submitting ? "" : "+"}</span>
                                    {submitting && <span className="owner-btn-spinner" />}
                                    <span>{submitting ? "Adding table..." : "Add Table"}</span>
                                </button>
                            </div>
                        </form>

                        <div className="owner-table-toolbar">
                            <label className="owner-table-search">
                                <span className="owner-table-toolbar-label">Search table</span>
                                <input
                                    type="text"
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                    placeholder="Search CP-1, T-01..."
                                />
                            </label>
                            <div className="owner-table-filters">
                                {TABLE_FILTER_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`owner-table-filter-btn ripple-btn ${tableStatusFilter === option.value ? "active" : ""}`}
                                        onClick={() => setTableStatusFilter(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <label className="owner-table-location-filter">
                                <span className="owner-table-toolbar-label">Location</span>
                                <select
                                    value={tableLocationFilter}
                                    onChange={(e) => setTableLocationFilter(e.target.value)}
                                >
                                    <option value="ALL">All locations</option>
                                    {TABLE_LOCATIONS.map((location) => (
                                        <option key={location} value={location}>
                                            {getTableLocationLabel(location)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {tables.length === 0 && !loading ? (
                            <div className="owner-table-empty-state">
                                <div className="owner-table-empty-illustration" aria-hidden="true">
                                    <span>🪑</span>
                                    <span>☕</span>
                                </div>
                                <h4>No tables yet</h4>
                                <p>Add your first table to start managing seating, availability, and table status.</p>
                            </div>
                        ) : (
                        <div className="tables-grid owner-tables-grid-modern">
                            {filteredTables.map((t) => {
                                const isEditing = editingTableId === t.id;
                                const isTableAvailable = (t.status || "AVAILABLE") === "AVAILABLE";
                                const quickActionLabel = isTableAvailable ? "Reserve Table" : "Free Table";
                                const quickActionStatus = isTableAvailable ? "RESERVED" : "AVAILABLE";
                                return (
                                    <div
                                        key={t.id}
                                        className={`table-card owner-table-card status-${(t.status || "").toLowerCase()} ${selectedTableId === t.id ? "is-selected" : ""}`}
                                        onClick={() => setSelectedTableId(t.id)}
                                    >
                                        <span className={`owner-table-status-strip status-${(t.status || "").toLowerCase()}`} />
                                        {isEditing ? (
                                            <div className="owner-table-edit-form">
                                                <input
                                                    className="table-input"
                                                    type="text"
                                                    value={editingTableDraft.tableNumber}
                                                    onChange={(e) =>
                                                        setEditingTableDraft((d) => ({
                                                            ...d,
                                                            tableNumber: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Table number"
                                                />
                                                <input
                                                    className="table-input"
                                                    type="number"
                                                    min="1"
                                                    value={editingTableDraft.capacity}
                                                    onChange={(e) =>
                                                        setEditingTableDraft((d) => ({
                                                            ...d,
                                                            capacity: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Seats"
                                                />
                                                <select
                                                    className="table-input"
                                                    value={editingTableDraft.location || "INDOOR"}
                                                    onChange={(e) =>
                                                        setEditingTableDraft((d) => ({
                                                            ...d,
                                                            location: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    {TABLE_LOCATIONS.map((location) => (
                                                        <option key={location} value={location}>
                                                            {getTableLocationLabel(location)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="owner-table-card-head">
                                                    <div className="owner-table-card-copy">
                                                        <span className="owner-table-card-label">Table</span>
                                                        <strong className="table-number">{t.tableNumber}</strong>
                                                        <div className="owner-table-meta-list">
                                                            <span className="owner-table-meta-chip">
                                                                <TableMetaIcon type="seats" />
                                                                {t.capacity ?? "-"} seats
                                                            </span>
                                                            <span className="owner-table-meta-chip">
                                                                <TableMetaIcon type="location" />
                                                                {getTableLocationLabel(t.location)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`table-status table-status-pill status-${(t.status || "").toLowerCase()}`}>
                                                        {TABLE_STATUS_LABELS[t.status] || t.status}
                                                    </span>
                                                </div>
                                                <div className="owner-table-status-segment" role="group" aria-label={`Status controls for ${t.tableNumber}`}>
                                                    {TABLE_CARD_STATUSES.map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            className={`owner-table-status-option ${t.status === status ? "active" : ""}`}
                                                            onClick={() => handleUpdateTableStatus(t, status)}
                                                            disabled={submitting}
                                                        >
                                                            {TABLE_STATUS_LABELS[status]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <div className="table-actions owner-table-actions-modern">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn-sm owner-table-btn-edit"
                                                        onClick={() => handleSaveEditTable(t)}
                                                        disabled={submitting}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-sm"
                                                        onClick={handleCancelEditTable}
                                                        disabled={submitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn-sm owner-table-text-btn owner-table-btn-edit ripple-btn"
                                                        onClick={() => handleStartEditTable(t)}
                                                        disabled={submitting}
                                                        aria-label={`Edit ${t.tableNumber}`}
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-sm owner-table-text-btn owner-table-btn-status ripple-btn"
                                                        onClick={() => handleUpdateTableStatus(t, quickActionStatus)}
                                                        disabled={submitting}
                                                        aria-label={`${quickActionLabel} for ${t.tableNumber}`}
                                                        title={quickActionLabel}
                                                    >
                                                        {quickActionLabel}
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                className="btn-sm owner-table-text-btn table-delete-btn ripple-btn"
                                                onClick={() => requestDeleteTable(t)}
                                                disabled={submitting}
                                                aria-label={`Delete ${t.tableNumber}`}
                                                title="Delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}
                        {!loading && filteredTables.length === 0 && (
                            <p className="empty-msg">No tables match the current search or filter.</p>
                        )}
                        {tablePendingDelete && (
                            <div className="owner-confirm-overlay" onClick={() => setTablePendingDelete(null)}>
                                <div className="owner-confirm-card" onClick={(e) => e.stopPropagation()}>
                                    <span className="owner-confirm-kicker">Delete table</span>
                                    <h4>Delete {tablePendingDelete.tableNumber}?</h4>
                                    <p>This action cannot be undone. The table will be removed from this cafe.</p>
                                    <div className="owner-confirm-actions">
                                        <button
                                            type="button"
                                            className="payment-secondary-btn"
                                            onClick={() => setTablePendingDelete(null)}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="owner-table-text-btn table-delete-btn ripple-btn"
                                            onClick={handleDeleteTable}
                                            disabled={submitting}
                                        >
                                            {submitting && <span className="owner-btn-spinner" />}
                                            <span>{submitting ? "Deleting..." : "Delete"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Menu management */}
                {cafeId && activePanel === "menu" && (
                    <div className="owner-menu-management owner-management-shell">
                        <div className="owner-management-header">
                            <div>
                                <span className="owner-management-kicker">Menu Management</span>
                                <h3>Menu Management</h3>
                            </div>
                            <p>Organize items, pricing, availability, and media from one place with clear section spacing.</p>
                        </div>
                        <div className="admin-panel owner-panel owner-menu-card owner-menu-form-card">
                            <h3>Add Menu Item</h3>
                            <p className="panel-meta">Create and publish new items for this cafe menu.</p>
                            <form className="admin-form" onSubmit={handleAddMenuItem}>
                                <div className="owner-menu-form-grid">
                                    <div className="owner-menu-form-column">
                                        <div className={`owner-floating-field ${menuFormErrors.name ? "has-error" : ""}`}>
                                            <span className="owner-field-icon">Nm</span>
                                            <input
                                                id="owner-menu-name"
                                                name="itemName"
                                                value={menuItemForm.name}
                                                onChange={(e) => handleMenuFormChange("name", e.target.value)}
                                                placeholder=" "
                                                required
                                            />
                                            <label htmlFor="owner-menu-name">Name</label>
                                        </div>
                                        {menuFormErrors.name && <p className="owner-field-error">{menuFormErrors.name}</p>}
                                        <div className="owner-floating-field owner-floating-select owner-floating-select-no-icon">
                                            <select
                                                id="owner-menu-category"
                                                name="itemCategory"
                                                value={menuItemForm.category}
                                                onChange={(e) => handleMenuFormChange("category", e.target.value)}
                                                aria-label="Category"
                                            >
                                                {CATEGORY_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <label htmlFor="owner-menu-category">Category</label>
                                        </div>
                                    </div>

                                    <div className="owner-menu-form-column">
                                        <div className={`owner-floating-field ${menuFormErrors.price ? "has-error" : ""}`}>
                                            <span className="owner-field-icon">Rs</span>
                                            <input
                                                id="owner-menu-price"
                                                name="itemPrice"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={menuItemForm.price}
                                                onChange={(e) => handleMenuFormChange("price", e.target.value)}
                                                placeholder=" "
                                                required
                                            />
                                            <label htmlFor="owner-menu-price">Price</label>
                                        </div>
                                        {menuFormErrors.price && <p className="owner-field-error">{menuFormErrors.price}</p>}
                                        <div className="owner-toggle-card">
                                            <div>
                                                <span className="owner-toggle-label">Availability</span>
                                                <p className="owner-toggle-meta">
                                                    {menuItemForm.available ? "Visible to customers right away." : "Saved as hidden for now."}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`owner-switch ${menuItemForm.available ? "active" : ""}`}
                                                onClick={() => handleMenuFormChange("available", !menuItemForm.available)}
                                                aria-pressed={menuItemForm.available}
                                            >
                                                <span className="owner-switch-track">
                                                    <span className="owner-switch-thumb" />
                                                </span>
                                                <span className="owner-switch-text">
                                                    {menuItemForm.available ? "Available" : "Hidden"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="owner-floating-field owner-floating-field-wide owner-floating-textarea">
                                    <span className="owner-field-icon">Txt</span>
                                    <textarea
                                        id="owner-menu-desc"
                                        name="itemDesc"
                                        value={menuItemForm.description}
                                        onChange={(e) => handleMenuFormChange("description", e.target.value)}
                                        placeholder=" "
                                        rows={3}
                                    />
                                    <label htmlFor="owner-menu-desc">Description</label>
                                </div>

                                <div
                                    className={`owner-upload-dropzone ${menuDropActive ? "drag-active" : ""}`}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setMenuDropActive(true);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setMenuDropActive(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setMenuDropActive(false);
                                    }}
                                    onDrop={handleMenuDrop}
                                >
                                    <div className="owner-upload-copy">
                                        <span className="owner-upload-icon">Img</span>
                                        <div>
                                            <strong>Drop menu images here</strong>
                                            <p>Upload thumbnails for the item. JPG, PNG, or WebP. Up to 6 images.</p>
                                        </div>
                                    </div>
                                    <label className="owner-upload-browse">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                handleUploadMenuImages(e.target.files);
                                                e.target.value = "";
                                            }}
                                        />
                                        <span>{uploadingImages ? "Uploading..." : "Browse files"}</span>
                                    </label>
                                </div>

                                {!!menuImagePreviews.length && (
                                    <div className="owner-upload-preview-grid">
                                        {menuImagePreviews.map((image) => (
                                            <div key={image.id} className="owner-upload-preview-card">
                                                <img src={image.url} alt={image.name} />
                                                <div className="owner-upload-preview-meta">
                                                    <span>{image.name}</span>
                                                    <button
                                                        type="button"
                                                        className="owner-upload-remove"
                                                        onClick={() => handleRemoveMenuImage(image.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="owner-menu-submit-row">
                                    <button
                                        type="submit"
                                        className={`owner-menu-submit-btn ripple-btn ${submitting ? "loading" : ""}`}
                                        disabled={submitting || uploadingImages}
                                    >
                                        <span className="owner-menu-submit-icon">{submitting ? "" : "+"}</span>
                                        {submitting && <span className="owner-btn-spinner" />}
                                        <span>{submitting ? "Adding item..." : "Add menu item"}</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="chart-container owner-cafe-menu-panel owner-menu-card owner-menu-table-card">
                            <h3>Current Menu</h3>
                            <p className="panel-meta">Review pricing and update availability without leaving this page.</p>
                            <div className="owner-menu-toolbar">
                                <div className="owner-menu-search">
                                    <span className="owner-menu-toolbar-icon">Sr</span>
                                    <input
                                        type="search"
                                        placeholder="Search by item name"
                                        value={menuSearch}
                                        onChange={(e) => setMenuSearch(e.target.value)}
                                    />
                                </div>
                                <div className="owner-menu-filter-group">
                                    <div className="owner-menu-category-tabs" role="tablist" aria-label="Filter menu by category">
                                        <button
                                            type="button"
                                                className={`owner-menu-category-tab ripple-btn ${menuCategoryFilter === "ALL" ? "active" : ""}`}
                                            onClick={() => setMenuCategoryFilter("ALL")}
                                        >
                                            All
                                        </button>
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                    className={`owner-menu-category-tab ripple-btn ${menuCategoryFilter === option.value ? "active" : ""}`}
                                                onClick={() => setMenuCategoryFilter(option.value)}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <label className="owner-menu-sort">
                                        <span>Sort</span>
                                        <select
                                            value={menuPriceSort}
                                            onChange={(e) => setMenuPriceSort(e.target.value)}
                                        >
                                            <option value="default">Name A-Z</option>
                                            <option value="price-asc">Price low to high</option>
                                            <option value="price-desc">Price high to low</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div className="data-table-wrap">
                                <table className="data-table owner-modern-menu-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Available</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMenu.map((m, index) => (
                                            <tr key={m.id} className={index % 2 === 0 ? "is-even" : "is-odd"}>
                                                <td>
                                                    <div className="owner-menu-item-cell">
                                                        {getPrimaryImage(m.imageUrls) ? (
                                                            <img
                                                                className="owner-menu-item-thumb"
                                                                src={getPrimaryImage(m.imageUrls)}
                                                                alt={m.name}
                                                            />
                                                        ) : (
                                                            <div className="owner-menu-item-thumb owner-menu-item-thumb-placeholder">
                                                                {String(m.name || "M").charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="owner-menu-item-copy">
                                                            <strong>{m.name}</strong>
                                                            {m.description && <span>{m.description}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`owner-menu-category-badge owner-menu-category-${String(m.category || "").toLowerCase()}`}>
                                                        {getCategoryLabel(m.category)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="owner-menu-price-wrap">
                                                        <span className="owner-menu-price-label">Price</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="owner-menu-price-input"
                                                            defaultValue={m.price != null ? Number(m.price).toFixed(2) : ""}
                                                            onBlur={(e) => handleMenuPriceBlur(m, e)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`owner-menu-status-badge ${m.available ? "available" : "unavailable"}`}>
                                                        {m.available ? "Available" : "Unavailable"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" className="btn-sm ripple-btn" onClick={() => handleToggleMenuAvailable(m)}>
                                                        {m.available ? "Set unavailable" : "Set available"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {menu.length === 0 && !loading && (
                                <div className="owner-menu-empty-state">
                                    <div className="owner-menu-empty-illustration" aria-hidden="true">
                                        <span className="owner-menu-empty-plate" />
                                        <span className="owner-menu-empty-cup" />
                                        <span className="owner-menu-empty-steam owner-menu-empty-steam-one" />
                                        <span className="owner-menu-empty-steam owner-menu-empty-steam-two" />
                                    </div>
                                    <h4>No menu items yet</h4>
                                    <p>Add your first dish or drink to start building this cafe menu.</p>
                                    <button
                                        type="button"
                                        className="owner-menu-empty-cta ripple-btn"
                                        onClick={focusMenuForm}
                                    >
                                        Add first menu item
                                    </button>
                                </div>
                            )}
                            {menu.length > 0 && filteredMenu.length === 0 && (
                                <p className="empty-msg">No menu items match the current search or filter.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Cafe dashboard / manager */}
                {false && activePanel === "cafe" && (
                <div className="owner-management-shell owner-cafe-overview-shell">
                    <div className="owner-management-header">
                        <div>
                            <span className="owner-management-kicker">Cafe Overview</span>
                            <h3>Cafe Overview</h3>
                        </div>
                        <p>Review the core cafe snapshot here, then switch into tables and menu management for detailed updates.</p>
                    </div>
                    <div className="card-grid owner-cards owner-overview-grid">
                        <div className="card admin-card owner-overview-card owner-overview-card-cafe">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="cafe" />
                                </span>
                                <h3>Cafe Name</h3>
                            </div>
                            <p>{cafe?.name || "—"}</p>
                            <span className="owner-overview-card-meta">Primary cafe profile</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-tables">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="tables" />
                                </span>
                                <h3>Total Tables</h3>
                            </div>
                            <p>{tables.length}</p>
                            <span className="owner-overview-card-meta">Available seating assets</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-menu">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="menu" />
                                </span>
                                <h3>Total Menu Items</h3>
                            </div>
                            <p>{menu.length}</p>
                            <span className="owner-overview-card-meta">Published catalog items</span>
                        </div>
                        <div className="card admin-card owner-overview-card owner-overview-card-location">
                            <div className="owner-overview-card-top">
                                <span className="owner-overview-card-icon">
                                    <CafeOverviewIcon type="location" />
                                </span>
                                <h3>Location</h3>
                            </div>
                            <p className="small-text">{cafe?.address || "—"}</p>
                            <span className="owner-overview-card-meta">Registered cafe address</span>
                        </div>
                    </div>
                </div>
                )}

                {/* Analytics */}
                {cafeId && activePanel === "analytics" && (
                <div className="owner-analytics">
                    <div className="owner-analytics-header">
                        <div>
                            <p className="owner-analytics-eyebrow">Performance overview</p>
                            <h3>Analytics</h3>
                        </div>
                        <div className="owner-analytics-header-actions">
                            <p className="owner-analytics-subcopy">
                                Review operational performance through KPI summaries, order trends, and status distribution insights.
                            </p>
                            <button
                                type="button"
                                className="owner-analytics-export-btn"
                                onClick={exportAnalyticsSalesData}
                                disabled={analyticsExporting || !orders.length}
                            >
                                {analyticsExporting ? "Exporting..." : "Export"}
                            </button>
                        </div>
                    </div>
                    <div className="owner-analytics-toolbar">
                        <div className="owner-analytics-toolbar-filters">
                            <label className="owner-analytics-filter">
                                <span>Status</span>
                                <select
                                    value={analyticsStatusFilter}
                                    onChange={(e) => setAnalyticsStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All statuses</option>
                                    {analyticsStatusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="owner-analytics-filter owner-analytics-filter-range">
                                <span>Date range</span>
                                <div className="owner-analytics-range-controls">
                                    <button
                                        type="button"
                                        className={`owner-analytics-range-btn ${analyticsRange === "7d" ? "active" : ""}`}
                                        onClick={() => setAnalyticsRange("7d")}
                                    >
                                        Last 7 days
                                    </button>
                                    <button
                                        type="button"
                                        className={`owner-analytics-range-btn ${analyticsRange === "30d" ? "active" : ""}`}
                                        onClick={() => setAnalyticsRange("30d")}
                                    >
                                        Last 30 days
                                    </button>
                                    <button
                                        type="button"
                                        className={`owner-analytics-range-btn ${analyticsRange === "custom" ? "active" : ""}`}
                                        onClick={() => setAnalyticsRange("custom")}
                                    >
                                        Custom
                                    </button>
                                </div>
                            </div>
                            {analyticsRange === "custom" && (
                                <div className="owner-analytics-custom-range">
                                    <label className="owner-analytics-date-field">
                                        <span>Start</span>
                                        <input
                                            type="date"
                                            value={analyticsCustomStart}
                                            onChange={(e) => setAnalyticsCustomStart(e.target.value)}
                                        />
                                    </label>
                                    <label className="owner-analytics-date-field">
                                        <span>End</span>
                                        <input
                                            type="date"
                                            value={analyticsCustomEnd}
                                            onChange={(e) => setAnalyticsCustomEnd(e.target.value)}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="owner-analytics-refresh-btn"
                            onClick={refreshAnalyticsOrders}
                            disabled={analyticsRefreshing || !cafeId}
                        >
                            {analyticsRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <section className="owner-analytics-section">
                        <div className="owner-analytics-section-head">
                            <h4>KPI Overview</h4>
                        </div>
                        <div className="owner-analytics-grid owner-analytics-grid-kpi">
                            {analyticsKpis.map((kpi) => (
                                <div
                                    key={kpi.key}
                                    className={`owner-analytics-card owner-analytics-kpi-card owner-analytics-kpi-card-${kpi.accent}`}
                                >
                                    <div className="owner-analytics-kpi-top">
                                        <span className="owner-analytics-kpi-icon">
                                            <AnalyticsKpiIcon type={kpi.key} />
                                        </span>
                                        <span className={`owner-analytics-kpi-change ${kpi.change >= 0 ? "is-positive" : "is-negative"}`}>
                                            {formatPercentChange(kpi.change)}
                                        </span>
                                    </div>
                                    <strong>{kpi.value}</strong>
                                    <span className="owner-analytics-kpi-label">{kpi.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="owner-analytics-section">
                        <div className="owner-analytics-section-head">
                            <h4>Trends &amp; Performance</h4>
                            <p className="owner-analytics-filter-summary">
                                Filtered by {analyticsStatusFilter === "ALL" ? "all statuses" : analyticsStatusFilter}
                            </p>
                        </div>
                        <div className="owner-analytics-grid owner-analytics-grid-trends">
                            <div className="owner-analytics-card owner-analytics-chart-card">
                                <h5>Orders Trend</h5>
                                {analyticsBusy ? (
                                    <div className="owner-chart-skeleton" aria-hidden="true">
                                        <span className="owner-chart-skeleton-grid" />
                                        <span className="owner-chart-skeleton-line owner-chart-skeleton-line-primary" />
                                        <span className="owner-chart-skeleton-axis owner-chart-skeleton-axis-x" />
                                        <span className="owner-chart-skeleton-axis owner-chart-skeleton-axis-y" />
                                    </div>
                                ) : (
                                    <div className="owner-chart-wrap owner-chart-wrap-animated">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={analyticsTrendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickFormatter={(value) => formatCompactNumber(value)} />
                                                <Tooltip
                                                    formatter={(value) => [`${value} orders`, "Orders"]}
                                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.dateKey || label}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="orders"
                                                    stroke="#2563eb"
                                                    strokeWidth={3}
                                                    dot={{ r: 3, fill: "#2563eb" }}
                                                    activeDot={{ r: 5 }}
                                                    isAnimationActive
                                                    animationDuration={850}
                                                    animationEasing="ease-out"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                            <div className="owner-analytics-card owner-analytics-chart-card">
                                <h5>Revenue Trend</h5>
                                {analyticsBusy ? (
                                    <div className="owner-chart-skeleton" aria-hidden="true">
                                        <span className="owner-chart-skeleton-grid" />
                                        <span className="owner-chart-skeleton-line owner-chart-skeleton-line-secondary" />
                                        <span className="owner-chart-skeleton-axis owner-chart-skeleton-axis-x" />
                                        <span className="owner-chart-skeleton-axis owner-chart-skeleton-axis-y" />
                                    </div>
                                ) : (
                                    <div className="owner-chart-wrap owner-chart-wrap-animated">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={analyticsTrendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="ownerRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28} />
                                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(value)} />
                                                <Tooltip
                                                    formatter={(value) => [formatOwnerCurrency(value), "Revenue"]}
                                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.dateKey || label}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#7c3aed"
                                                    strokeWidth={3}
                                                    fill="url(#ownerRevenueFill)"
                                                    isAnimationActive
                                                    animationDuration={950}
                                                    animationEasing="ease-out"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
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
                                {analyticsBusy ? (
                                    <div className="owner-chart-skeleton owner-chart-skeleton-donut" aria-hidden="true">
                                        <span className="owner-chart-skeleton-donut-ring" />
                                        <span className="owner-chart-skeleton-donut-core" />
                                    </div>
                                ) : (
                                <div className="owner-chart-wrap owner-chart-wrap-animated">
                                    {statusPieData.length === 0 ? (
                                        <p className="empty-msg">No order data yet.</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={88}
                                                    innerRadius={42}
                                                    paddingAngle={3}
                                                    onMouseEnter={(_, index) => setActiveAnalyticsSlice(index)}
                                                    onMouseLeave={() => setActiveAnalyticsSlice(null)}
                                                    isAnimationActive
                                                    animationDuration={900}
                                                    animationEasing="ease-out"
                                                >
                                                    {statusPieData.map((entry, idx) => (
                                                        <Cell key={entry.name} fill={OWNER_CHART_COLORS[idx % OWNER_CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        const total = statusPieData.reduce((sum, item) => sum + item.value, 0);
                                                        const percent = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                                                        return [`${value} orders (${percent}%)`, name];
                                                    }}
                                                />
                                                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="owner-analytics-donut-total">
                                                    {activeStatusSliceData ? formatCompactNumber(activeStatusSliceData.value) : formatCompactNumber(analyticsFilteredOrders.length)}
                                                </text>
                                                <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="owner-analytics-donut-label">
                                                    {activeStatusSliceData ? activeStatusSliceData.name : "Total Orders"}
                                                </text>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                )}
                            </div>
                            <div className="owner-analytics-card owner-analytics-insight-card">
                                <h5>Insights</h5>
                                <div className="owner-analytics-insights-list">
                                    {analyticsInsights.map((insight) => (
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

                {/* Orders management */}
                {cafeId && activePanel === "orders" && (
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
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder="Order number or ID"
                                />
                            </label>
                            <label className="owner-orders-control">
                                <span>Status</span>
                                <select
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                >
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
                                <input
                                    type="date"
                                    value={orderDateFilter}
                                    onChange={(e) => setOrderDateFilter(e.target.value)}
                                />
                            </label>
                        </div>
                        {loading ? (
                            <div className="owner-orders-skeleton" aria-hidden="true">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="owner-orders-skeleton-row">
                                        <span className="owner-orders-skeleton-cell owner-orders-skeleton-cell-wide" />
                                        <span className="owner-orders-skeleton-cell owner-orders-skeleton-cell-icon" />
                                        <span className="owner-orders-skeleton-cell" />
                                        <span className="owner-orders-skeleton-cell" />
                                        <span className="owner-orders-skeleton-cell" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            <div className="data-table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Actions</th>
                                            <th>Status</th>
                                            <th>
                                                <button
                                                    type="button"
                                                    className="owner-orders-sort-btn"
                                                    onClick={() => toggleOrderSort("totalAmount")}
                                                >
                                                    Amount
                                                    <span>{getOrderSortIndicator("totalAmount")}</span>
                                                </button>
                                            </th>
                                            <th>
                                                <button
                                                    type="button"
                                                    className="owner-orders-sort-btn"
                                                    onClick={() => toggleOrderSort("createdAt")}
                                                >
                                                    Date
                                                    <span>{getOrderSortIndicator("createdAt")}</span>
                                                </button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedOrders.map((o) => (
                                            <tr
                                                key={o.id}
                                                className={`owner-orders-table-row ${highlightedOrderIds.includes(o.id) ? "owner-orders-table-row-new" : ""}`.trim()}
                                            >
                                                <td>{o.orderNumber}</td>
                                                <td>
                                                    <div className="owner-order-actions">
                                                        <button
                                                            type="button"
                                                            className="owner-order-action-btn"
                                                            title="View Details"
                                                            aria-label={`View details for order ${o.orderNumber}`}
                                                            onClick={() => handleViewOrderDetails(o.id)}
                                                            disabled={orderDetailsLoading && selectedOrder?.id !== o.id}
                                                        >
                                                            <OrderActionIcon type="view" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`owner-order-status-badge owner-order-status-${String(
                                                            o.status || "unknown"
                                                        ).toLowerCase()}`}
                                                    >
                                                        {o.status || "UNKNOWN"}
                                                    </span>
                                                </td>
                                                <td>{formatOwnerCurrency(o.totalAmount)}</td>
                                                <td>{formatOwnerDateTime(o.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                        {!loading && filteredOrders.length > 0 && (
                            <div className="owner-orders-pagination">
                                <p className="owner-orders-pagination-summary">
                                    Page {safeOrderPage} of {totalOrderPages}
                                </p>
                                <div className="owner-orders-pagination-actions">
                                    <button
                                        type="button"
                                        onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                                        disabled={safeOrderPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderPage((current) => Math.min(totalOrderPages, current + 1))}
                                        disabled={safeOrderPage === totalOrderPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                        {orders.length === 0 && !loading && (
                            <div className="owner-orders-empty-state">
                                <div className="owner-orders-empty-illustration" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                                <h4>No orders yet</h4>
                                <p>No orders yet. New cafe orders will appear here automatically.</p>
                            </div>
                        )}
                        {orders.length > 0 && filteredOrders.length === 0 && !loading && (
                            <p className="empty-msg">No orders match the current search or filters.</p>
                        )}
                        {selectedOrder && (
                            <div className="owner-order-modal-overlay" onClick={() => setSelectedOrder(null)}>
                                <div className="owner-order-modal-card" onClick={(event) => event.stopPropagation()}>
                                    <div className="owner-order-modal-head">
                                        <div>
                                            <p className="owner-order-modal-kicker">Order details</p>
                                            <h3>{selectedOrder.orderNumber}</h3>
                                        </div>
                                        <button
                                            type="button"
                                            className="owner-order-modal-close"
                                            aria-label="Close order details"
                                            onClick={() => setSelectedOrder(null)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="owner-order-modal-grid">
                                        <div>
                                            <span>Status</span>
                                            <strong>{selectedOrder.status || "UNKNOWN"}</strong>
                                        </div>
                                        <div>
                                            <span>Total</span>
                                            <strong>
                                                {formatOwnerCurrency(selectedOrder.totalAmount)}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Customer</span>
                                            <strong>{selectedOrder.customer?.username || "Walk-in"}</strong>
                                            <p>{selectedOrder.customer?.email || "No customer account linked"}</p>
                                        </div>
                                        <div>
                                            <span>Prepared By</span>
                                            <strong>{selectedOrder.preparedBy?.username || "Not recorded yet"}</strong>
                                            <p>{selectedOrder.preparedBy?.email || "Chef attribution will appear after kitchen processing."}</p>
                                        </div>
                                        <div>
                                            <span>Served By</span>
                                            <strong>{selectedOrder.servedBy?.username || "Not served yet"}</strong>
                                            <p>{selectedOrder.servedBy?.email || "Serving record appears after completion."}</p>
                                        </div>
                                        <div>
                                            <span>Table</span>
                                            <strong>{selectedOrder.cafeTable?.tableNumber || "Not assigned"}</strong>
                                            <p>
                                                {selectedOrder.cafeTable
                                                    ? `${selectedOrder.cafeTable.location || "INDOOR"} • ${selectedOrder.cafeTable.capacity || "—"} seats`
                                                    : "No table allocation"}
                                            </p>
                                        </div>
                                        <div>
                                            <span>Reservation Slot</span>
                                            <strong>{selectedOrder.reservationTimeSlot || "Not specified"}</strong>
                                            <p>{selectedOrder.reservationDate || "No reservation date"}</p>
                                        </div>
                                        <div>
                                            <span>Guest / Seating</span>
                                            <strong>{selectedOrder.guestCount || 0} guests</strong>
                                            <p>
                                                {[selectedOrder.seatingPreference, selectedOrder.seatingNotes]
                                                    .filter(Boolean)
                                                    .join(" • ") || "No seating instructions"}
                                            </p>
                                        </div>
                                        <div>
                                            <span>Created</span>
                                            <strong>{formatOwnerDateTime(selectedOrder.createdAt)}</strong>
                                        </div>
                                        <div>
                                            <span>Updated</span>
                                            <strong>{formatOwnerDateTime(selectedOrder.updatedAt)}</strong>
                                        </div>
                                        <div>
                                            <span>Payment Provider</span>
                                            <strong>{selectedOrder.paymentProvider || "Not captured"}</strong>
                                            <p>
                                                {selectedOrder.paymentCapturedAt
                                                    ? `Captured ${formatOwnerDateTime(selectedOrder.paymentCapturedAt)}`
                                                    : "Payment capture pending"}
                                            </p>
                                        </div>
                                        <div>
                                            <span>Payment Reference</span>
                                            <strong>{selectedOrder.razorpayPaymentId || selectedOrder.razorpayOrderId || "No payment reference"}</strong>
                                            <p>{selectedOrder.razorpayOrderId ? `Order ref: ${selectedOrder.razorpayOrderId}` : "No gateway order reference"}</p>
                                        </div>
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
                                                <div
                                                    key={item.id || `${item.menuItem?.id}-${item.menuItem?.name}`}
                                                    className="owner-order-modal-item"
                                                >
                                                    <div>
                                                        <strong>{item.menuItem?.name || "Menu item"}</strong>
                                                        <p>
                                                            {[item.menuItem?.category, item.specialInstructions]
                                                                .filter(Boolean)
                                                                .join(" • ") || "No special instructions"}
                                                        </p>
                                                    </div>
                                                    <div className="owner-order-modal-item-meta">
                                                        <span>Qty {item.quantity || 0}</span>
                                                        <strong>
                                                            {formatOwnerCurrency(item.unitPrice)}
                                                        </strong>
                                                        <p>
                                                            {selectedOrder.reservationTimeSlot
                                                                ? `Served in slot ${selectedOrder.reservationTimeSlot}`
                                                                : "No slot recorded"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Menu + tables overview together for convenience */}
                {false && activePanel === "cafe" && (
                <div className="owner-cafe-overview-stack">
                    <div className="chart-container owner-cafe-tables-panel">
                        <h3>Tables</h3>
                        {loading ? (
                            <p>Loading…</p>
                        ) : (
                            <div className="owner-cafe-tables-strip">
                                {tables.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`owner-table-card owner-cafe-table-card status-${(t.status || "").toLowerCase()}`}
                                    >
                                        <span className={`owner-table-status-strip status-${(t.status || "").toLowerCase()}`} />
                                        <div className="owner-table-card-head">
                                            <div className="owner-table-card-copy">
                                                <span className="owner-table-card-label">Table</span>
                                                <strong className="table-number">{t.tableNumber}</strong>
                                                <div className="owner-table-meta-list">
                                                    <span className="owner-table-meta-chip">
                                                        <TableMetaIcon type="seats" />
                                                        {t.capacity ?? "—"} seats
                                                    </span>
                                                    <span className="owner-table-meta-chip">
                                                        <TableMetaIcon type="location" />
                                                        {getTableLocationLabel(t.location)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`table-status table-status-pill status-${(t.status || "").toLowerCase()}`}>
                                                {TABLE_STATUS_LABELS[t.status] || t.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {tables.length === 0 && <p className="empty-msg">No tables yet.</p>}
                            </div>
                        )}
                    </div>
                    <div className="chart-container owner-cafe-menu-panel owner-menu-card owner-menu-table-card">
                        <h3>Current Menu</h3>
                        <p className="panel-meta">Review pricing and update availability without leaving this page.</p>
                        <div className="data-table-wrap">
                            <table className="data-table owner-modern-menu-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Available</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menu.map((m, index) => (
                                        <tr key={m.id} className={index % 2 === 0 ? "is-even" : "is-odd"}>
                                            <td>
                                                <div className="owner-menu-item-cell">
                                                    {getPrimaryImage(m.imageUrls) ? (
                                                        <img
                                                            className="owner-menu-item-thumb"
                                                            src={getPrimaryImage(m.imageUrls)}
                                                            alt={m.name}
                                                        />
                                                    ) : (
                                                        <div className="owner-menu-item-thumb owner-menu-item-thumb-placeholder">
                                                            {String(m.name || "M").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="owner-menu-item-copy">
                                                        <strong>{m.name}</strong>
                                                        {m.description && <span>{m.description}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`owner-menu-category-badge owner-menu-category-${String(m.category || "").toLowerCase()}`}>
                                                    {getCategoryLabel(m.category)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="owner-menu-price-wrap">
                                                    <span className="owner-menu-price-label">Price</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="owner-menu-price-input"
                                                        defaultValue={m.price != null ? Number(m.price).toFixed(2) : ""}
                                                        onBlur={(e) => handleMenuPriceBlur(m, e)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`owner-menu-status-badge ${m.available ? "available" : "unavailable"}`}>
                                                    {m.available ? "Available" : "Unavailable"}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="btn-sm ripple-btn" onClick={() => handleToggleMenuAvailable(m)}>
                                                    {m.available ? "Set unavailable" : "Set available"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {menu.length === 0 && !loading && (
                            <div className="owner-menu-empty-state">
                                <div className="owner-menu-empty-illustration" aria-hidden="true">
                                    <span className="owner-menu-empty-plate" />
                                    <span className="owner-menu-empty-cup" />
                                    <span className="owner-menu-empty-steam owner-menu-empty-steam-one" />
                                    <span className="owner-menu-empty-steam owner-menu-empty-steam-two" />
                                </div>
                                <h4>No menu items yet</h4>
                                <p>Add your first dish or drink to start building this cafe menu.</p>
                                <button
                                    type="button"
                                    className="owner-menu-empty-cta ripple-btn"
                                    onClick={focusMenuForm}
                                >
                                    Add first menu item
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* Bookings management */}
                {cafeId && activePanel === "bookings" && (
                    <div className="owner-bookings-panel">
                        <div className="owner-bookings-header">
                            <div>
                                <p className="owner-bookings-eyebrow">Bookings overview</p>
                                <h3>Bookings management</h3>
                            </div>
                            <p className="owner-bookings-subcopy">
                                Reservation activity is grouped from the current order stream so you can track today’s and upcoming bookings in one place.
                            </p>
                        </div>
                        {loading ? (
                            <>
                                <div className="owner-bookings-kpi-grid">
                                    {[...Array(4)].map((_, index) => (
                                        <div key={index} className="owner-bookings-kpi-card owner-bookings-kpi-skeleton">
                                            <span className="owner-bookings-skeleton-line owner-bookings-skeleton-line-short" />
                                            <span className="owner-bookings-skeleton-line owner-bookings-skeleton-line-large" />
                                        </div>
                                    ))}
                                </div>
                                <div className="owner-bookings-list-card owner-bookings-list-skeleton">
                                    <div className="owner-bookings-list-head">
                                        <h4>Booking records</h4>
                                        <span>Loading...</span>
                                    </div>
                                    <div className="owner-bookings-table-skeleton" aria-hidden="true">
                                        {[...Array(6)].map((_, index) => (
                                            <div key={index} className="owner-bookings-table-skeleton-row">
                                                {[...Array(7)].map((__, cellIndex) => (
                                                    <span
                                                        key={cellIndex}
                                                        className={`owner-bookings-skeleton-line ${cellIndex === 0 ? "owner-bookings-skeleton-line-wide" : ""}`.trim()}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="owner-bookings-kpi-grid">
                                    <div className="owner-bookings-kpi-card">
                                        <span>Total Bookings Today</span>
                                        <strong>{totalBookingsToday}</strong>
                                    </div>
                                    <div className="owner-bookings-kpi-card">
                                        <span>Upcoming Bookings</span>
                                        <strong>{upcomingBookings}</strong>
                                    </div>
                                    <div className="owner-bookings-kpi-card">
                                        <span>Active Bookings</span>
                                        <strong>{activeBookings}</strong>
                                    </div>
                                    <div className="owner-bookings-kpi-card">
                                        <span>Cancelled Bookings</span>
                                        <strong>{cancelledBookings}</strong>
                                    </div>
                                </div>
                                <div className="owner-bookings-toolbar">
                                    <label className="owner-bookings-control owner-bookings-search">
                                        <span>Search</span>
                                        <input
                                            type="search"
                                            value={bookingSearch}
                                            onChange={(e) => setBookingSearch(e.target.value)}
                                            placeholder="Customer name or booking ID"
                                        />
                                    </label>
                                    <label className="owner-bookings-control">
                                        <span>Date</span>
                                        <input
                                            type="date"
                                            value={bookingDateFilter}
                                            onChange={(e) => setBookingDateFilter(e.target.value)}
                                        />
                                    </label>
                                    <label className="owner-bookings-control">
                                        <span>Status</span>
                                        <select
                                            value={bookingStatusFilter}
                                            onChange={(e) => setBookingStatusFilter(e.target.value)}
                                        >
                                            <option value="ALL">All statuses</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="CONFIRMED">Confirmed</option>
                                            <option value="CHECKED-IN">Checked-in</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </label>
                                    <label className="owner-bookings-control">
                                        <span>Table</span>
                                        <select
                                            value={bookingTableFilter}
                                            onChange={(e) => setBookingTableFilter(e.target.value)}
                                        >
                                            <option value="ALL">All tables</option>
                                            {bookingTableOptions.map((tableNumber) => (
                                                <option key={tableNumber} value={tableNumber}>
                                                    Table {tableNumber}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="owner-bookings-control">
                                        <span>Sort</span>
                                        <select
                                            value={bookingSort}
                                            onChange={(e) => setBookingSort(e.target.value)}
                                        >
                                            <option value="date-asc">Date: Earliest</option>
                                            <option value="date-desc">Date: Latest</option>
                                            <option value="time-asc">Time: Earliest</option>
                                            <option value="time-desc">Time: Latest</option>
                                            <option value="guests-asc">Guests: Low to high</option>
                                            <option value="guests-desc">Guests: High to low</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="owner-bookings-list-card">
                            <div className="owner-bookings-list-head">
                                <h4>Booking records</h4>
                                <span>{filteredBookingRecords.length} bookings</span>
                            </div>
                            {filteredBookingRecords.length === 0 ? (
                                <div className="owner-bookings-empty-state">
                                    <div className="owner-bookings-empty-illustration" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <h5>No bookings yet</h5>
                                    <p>No bookings yet. Reservations will appear here once customers start booking tables.</p>
                                </div>
                            ) : (
                                <div className="data-table-wrap owner-bookings-table-wrap">
                                    <table className="data-table owner-bookings-table">
                                        <thead>
                                            <tr>
                                                <th>Booking ID</th>
                                                <th>Customer Name</th>
                                                <th>Date &amp; Time Slot</th>
                                                <th>Number of Guests</th>
                                                <th>Table Number</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBookingRecords.map((booking) => (
                                                <tr key={booking.id}>
                                                    <td>{booking.orderNumber}</td>
                                                    <td>{booking.customer?.username || "Walk-in"}</td>
                                                    <td>
                                                        <div className="owner-booking-date-slot">
                                                            <strong>{booking.reservationDate || "Not set"}</strong>
                                                            <span>{booking.reservationTimeSlot || "Not set"}</span>
                                                        </div>
                                                    </td>
                                                    <td>{booking.guestCount || 0}</td>
                                                    <td>{booking.cafeTable?.tableNumber || "Not assigned"}</td>
                                                    <td>
                                                        {(() => {
                                                            const bookingStatus = getBookingStatusDisplay(booking.status);
                                                            return (
                                                        <span
                                                            className={`owner-order-status-badge owner-booking-status-badge owner-booking-status-${getBookingStatusClass(
                                                                booking.status
                                                            )}`}
                                                        >
                                                            {bookingStatus}
                                                        </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="owner-booking-action-btn"
                                                            onClick={() => handleViewOrderDetails(booking.id)}
                                                        >
                                                            View details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                            </>
                        )}
                    </div>
                )}
                    </>
                )}

                {/* Settings */}
                {activePanel === "settings" && (
                    <div className="owner-settings-layout">
                        <aside className="owner-settings-sidebar">
                            <div className="owner-settings-sidebar-card">
                                <span className="owner-management-kicker">Settings</span>
                                <h3>Owner Settings</h3>
                                <p>Manage profile, cafe configuration, security, notifications, and workspace preferences.</p>
                                <div className="owner-settings-tabs" role="tablist" aria-label="Owner settings tabs">
                                    {OWNER_SETTINGS_TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={settingsTab === tab.id}
                                            className={`owner-settings-tab ${settingsTab === tab.id ? "active" : ""}`}
                                            onClick={() => setSettingsTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>
                        <div className="owner-settings-content">
                            <div className="owner-settings-content-card">
                                <div className="owner-settings-content-head">
                                    <div>
                                        <span className="owner-management-kicker">Settings Panel</span>
                                        <h3>{ownerSettingsContent[settingsTab].title}</h3>
                                    </div>
                                    <p>{ownerSettingsContent[settingsTab].description}</p>
                                    {settingsTab === "profile" ? (
                                        <button
                                            type="button"
                                            className="owner-settings-head-action"
                                            onClick={openOwnerProfileModal}
                                        >
                                            Edit
                                        </button>
                                    ) : settingsTab === "cafe" ? (
                                        <button
                                            type="button"
                                            className="owner-settings-head-action"
                                            onClick={openOwnerCafeModal}
                                        >
                                            Edit Cafe
                                        </button>
                                    ) : null}
                                </div>
                                {settingsTab === "profile" ? (
                                    <div className="owner-settings-section-grid">
                                        {ownerSettingsContent[settingsTab].cards.map((card) => (
                                            <section key={card.title} className="owner-settings-section-card">
                                                <h4>{card.title}</h4>
                                                <div className="owner-settings-info-list">
                                                    {card.rows.map(([label, value]) => (
                                                        <div key={label} className="owner-settings-info-row">
                                                            <span>{label}</span>
                                                            <strong>{value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="owner-settings-section-grid">
                                        {ownerSettingsContent[settingsTab].cards.map((card) => (
                                            <section key={card.title} className="owner-settings-section-card">
                                                <h4>{card.title}</h4>
                                                <div className="owner-settings-info-list">
                                                    {card.rows.map(([label, value]) => (
                                                        <div key={label} className="owner-settings-info-row">
                                                            <span>{label}</span>
                                                            <strong>{value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {ownerProfileModalOpen ? (
                    <div className="owner-settings-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit profile settings">
                        <div className="owner-settings-modal registration-layout owner-profile-edit-modal">
                            <aside className="registration-brand-panel owner-profile-edit-brand">
                                <div className="registration-brand-copy">
                                    <p className="registration-brand-kicker">Bean To Cup</p>
                                    <p className="registration-brand-role">Cafe Owner Profile</p>
                                    <h2 className="registration-brand-title">Edit Owner Profile</h2>
                                    <h1>Keep the owner account polished and current.</h1>
                                    <p>Use the same guided flow as owner onboarding to update identity, contact details, and the public-facing profile image.</p>
                                </div>
                                <div className="registration-brand-art" aria-hidden="true">
                                    <div className="coffee-card coffee-card-main">
                                        <span className="coffee-card-label">Profile Update</span>
                                        <strong>{ownerProfileForm.fullName || user.username || "Owner"}</strong>
                                        <small>Operations identity synced</small>
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
                                <div className="auth-box large registration-box owner-profile-edit-box">
                                    <div className="registration-header">
                                        <button type="button" className="registration-back-btn" onClick={closeOwnerProfileModal}>
                                            Close
                                        </button>
                                    </div>

                                    <div className="stepper">
                                        {[1, 2, 3, 4, 5].map((n, i) => (
                                            <div className="stepper-item" key={n}>
                                                <div className={`circle ${ownerProfileEditStep >= n ? "active" : ""}`}>{n}</div>
                                                {i !== 4 ? <div className={`line ${ownerProfileEditStep > n ? "active" : ""}`}></div> : null}
                                            </div>
                                        ))}
                                    </div>

                                    <form className="owner-profile-edit-form" onSubmit={handleOwnerProfileSave}>
                                        {ownerProfileEditStep === 1 ? (
                                            <>
                                                <h3>Personal Details</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="First Name"
                                                        value={ownerProfileForm.firstName}
                                                        onChange={(e) => handleOwnerProfileFieldChange("firstName", e.target.value)}
                                                        onBlur={() => {}}
                                                        icon={<RegistrationUserIcon />}
                                                        error={ownerProfileErrors.firstName}
                                                        success={ownerProfileForm.firstName.trim() && !ownerProfileErrors.firstName ? "First name looks good." : ""}
                                                        autoComplete="given-name"
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Last Name"
                                                        value={ownerProfileForm.lastName}
                                                        onChange={(e) => handleOwnerProfileFieldChange("lastName", e.target.value)}
                                                        onBlur={() => {}}
                                                        icon={<RegistrationUserIcon />}
                                                        error={ownerProfileErrors.lastName}
                                                        success={ownerProfileForm.lastName.trim() && !ownerProfileErrors.lastName ? "Last name looks good." : ""}
                                                        autoComplete="family-name"
                                                    />
                                                </div>

                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Phone Number"
                                                        type="tel"
                                                        value={ownerProfileForm.phone}
                                                        onChange={(e) => handleOwnerProfileFieldChange("phone", e.target.value)}
                                                        onBlur={() => {}}
                                                        icon={<RegistrationPhoneIcon />}
                                                        error={ownerProfileErrors.phone}
                                                        success={ownerProfileForm.phone.trim() && !ownerProfileErrors.phone ? "Phone number added." : ""}
                                                        autoComplete="tel"
                                                    />
                                                    <OwnerProfileFloatingSelect
                                                        label="Gender"
                                                        value={ownerProfileForm.gender}
                                                        onChange={(value) => handleOwnerProfileFieldChange("gender", value)}
                                                        icon={<RegistrationUserIcon />}
                                                        options={OWNER_PROFILE_GENDER_OPTIONS}
                                                    />
                                                </div>

                                                <div className="row">
                                                    <OwnerProfileFloatingSelect
                                                        label="Marital Status"
                                                        value={ownerProfileForm.maritalStatus}
                                                        onChange={(value) => handleOwnerProfileFieldChange("maritalStatus", value)}
                                                        icon={<RegistrationUserIcon />}
                                                        options={OWNER_PROFILE_MARITAL_OPTIONS}
                                                    />
                                                </div>
                                            </>
                                        ) : ownerProfileEditStep === 2 ? (
                                            <>
                                                <h3>Academic Details</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Institute Name"
                                                        value={ownerProfileForm.instituteName}
                                                        onChange={(e) => handleOwnerProfileFieldChange("instituteName", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Degree"
                                                        value={ownerProfileForm.degree}
                                                        onChange={(e) => handleOwnerProfileFieldChange("degree", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Passing Year"
                                                        value={ownerProfileForm.passingYear}
                                                        onChange={(e) => handleOwnerProfileFieldChange("passingYear", e.target.value)}
                                                        icon={<RegistrationCalendarIcon />}
                                                        error={ownerProfileErrors.passingYear}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Grade"
                                                        value={ownerProfileForm.grade}
                                                        onChange={(e) => handleOwnerProfileFieldChange("grade", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Percentage"
                                                            value={ownerProfileForm.percentage}
                                                            onChange={(e) => handleOwnerProfileFieldChange("percentage", e.target.value)}
                                                            icon={<RegistrationAcademicIcon />}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : ownerProfileEditStep === 3 ? (
                                            <>
                                                <h3>Address Information</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Street Address"
                                                        value={ownerProfileForm.streetAddress}
                                                        onChange={(e) => handleOwnerProfileFieldChange("streetAddress", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Plot No"
                                                        value={ownerProfileForm.plotNo}
                                                        onChange={(e) => handleOwnerProfileFieldChange("plotNo", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="City"
                                                        value={ownerProfileForm.city}
                                                        onChange={(e) => handleOwnerProfileFieldChange("city", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="State"
                                                        value={ownerProfileForm.state}
                                                        onChange={(e) => handleOwnerProfileFieldChange("state", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Pincode"
                                                            value={ownerProfileForm.pincode}
                                                            onChange={(e) => handleOwnerProfileFieldChange("pincode", e.target.value)}
                                                            icon={<RegistrationLocationIcon />}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : ownerProfileEditStep === 4 ? (
                                            <>
                                                <h3>Work Experience</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Company Name"
                                                        value={ownerProfileForm.companyName}
                                                        onChange={(e) => handleOwnerProfileFieldChange("companyName", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Address / Location"
                                                        value={ownerProfileForm.workLocation}
                                                        onChange={(e) => handleOwnerProfileFieldChange("workLocation", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Start Date"
                                                        type="date"
                                                        value={ownerProfileForm.startDate}
                                                        onChange={(e) => handleOwnerProfileFieldChange("startDate", e.target.value)}
                                                        icon={<RegistrationCalendarIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="End Date"
                                                        type="date"
                                                        value={ownerProfileForm.endDate}
                                                        onChange={(e) => handleOwnerProfileFieldChange("endDate", e.target.value)}
                                                        icon={<RegistrationCalendarIcon />}
                                                        error={ownerProfileErrors.endDate}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Package"
                                                            value={ownerProfileForm.compensationPackage}
                                                            onChange={(e) => handleOwnerProfileFieldChange("compensationPackage", e.target.value)}
                                                            icon={<RegistrationMoneyIcon />}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h3>Account Identity</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Email Address"
                                                        type="email"
                                                        value={ownerProfileForm.email}
                                                        onChange={(e) => handleOwnerProfileFieldChange("email", e.target.value)}
                                                        onBlur={() => {}}
                                                        icon={<RegistrationMailIcon />}
                                                        error={ownerProfileErrors.email}
                                                        success={ownerProfileForm.email.trim() && !ownerProfileErrors.email ? "Email format looks valid." : ""}
                                                        autoComplete="email"
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Username"
                                                        value={ownerProfile?.username || user.username || "Owner"}
                                                        onChange={() => {}}
                                                        icon={<RegistrationUserIcon />}
                                                        success="Username is managed from the owner account."
                                                        readOnly
                                                        autoComplete="username"
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Identification"
                                                            value={ownerProfileForm.identificationFileName}
                                                            onChange={(e) => handleOwnerProfileFieldChange("identificationFileName", e.target.value)}
                                                            icon={<RegistrationAcademicIcon />}
                                                            success={ownerProfileForm.identificationFileName.trim() ? "Identification reference recorded." : ""}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="owner-profile-edit-note">
                                                    <strong>Profile update</strong>
                                                    <p>Saving changes updates the owner registration details used across profile, cafe assignment, and dashboard records.</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="auth-actions owner-profile-edit-actions">
                                            {ownerProfileEditStep > 1 ? (
                                                <button
                                                    type="button"
                                                    className="auth-btn secondary"
                                                    onClick={() => setOwnerProfileEditStep((current) => Math.max(1, current - 1))}
                                                >
                                                    Previous
                                                </button>
                                            ) : null}
                                            {ownerProfileEditStep < 5 ? (
                                                <button
                                                    type="button"
                                                    className="auth-btn primary"
                                                    onClick={() => {
                                                        const nextErrors = validateOwnerProfileForm(ownerProfileForm);
                                                        setOwnerProfileErrors(nextErrors);
                                                        if (getOwnerProfileStepErrors(ownerProfileEditStep, nextErrors).length > 0) {
                                                            return;
                                                        }
                                                        setOwnerProfileEditStep((current) => Math.min(5, current + 1));
                                                    }}
                                                >
                                                    Next
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="auth-btn primary"
                                                    disabled={ownerProfileSubmitting}
                                                >
                                                    {ownerProfileSubmitting ? "Saving..." : "Save Changes"}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {ownerCafeModalOpen ? (
                    <div className="owner-settings-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit cafe settings">
                        <div className="owner-settings-modal registration-layout owner-profile-edit-modal">
                            <aside className="registration-brand-panel owner-profile-edit-brand">
                                <div className="registration-brand-copy">
                                    <p className="registration-brand-kicker">Bean To Cup</p>
                                    <p className="registration-brand-role">Cafe Settings</p>
                                    <h2 className="registration-brand-title">Edit Cafe Profile</h2>
                                    <h1>Keep cafe identity and operations details current.</h1>
                                    <p>Use the same structured flow as cafe registration to update branding, address, business details, and banking information.</p>
                                </div>
                                <div className="registration-brand-art" aria-hidden="true">
                                    <div className="coffee-card coffee-card-main">
                                        <span className="coffee-card-label">Cafe Update</span>
                                        <strong>{ownerCafeForm.cafeName || cafe?.name || "Cafe"}</strong>
                                        <small>Registration details aligned</small>
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
                                <div className="auth-box large registration-box owner-profile-edit-box">
                                    <div className="registration-header">
                                        <button type="button" className="registration-back-btn" onClick={closeOwnerCafeModal}>
                                            Close
                                        </button>
                                    </div>
                                    <div className="stepper">
                                        {[1, 2, 3, 4].map((n, i) => (
                                            <div className="stepper-item" key={n}>
                                                <div className={`circle ${ownerCafeEditStep >= n ? "active" : ""}`}>{n}</div>
                                                {i !== 3 ? <div className={`line ${ownerCafeEditStep > n ? "active" : ""}`}></div> : null}
                                            </div>
                                        ))}
                                    </div>
                                    <form className="owner-profile-edit-form" onSubmit={handleOwnerCafeSave}>
                                        {ownerCafeEditStep === 1 ? (
                                            <>
                                                <h3>Basic Information</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Cafe Name"
                                                        value={ownerCafeForm.cafeName}
                                                        onChange={(e) => handleOwnerCafeFieldChange("cafeName", e.target.value)}
                                                        icon={<RegistrationUserIcon />}
                                                        error={ownerCafeErrors.cafeName}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Tagline"
                                                        value={ownerCafeForm.tagline}
                                                        onChange={(e) => handleOwnerCafeFieldChange("tagline", e.target.value)}
                                                        icon={<RegistrationUserIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Logo URL"
                                                        value={ownerCafeForm.logoUrl}
                                                        onChange={(e) => handleOwnerCafeFieldChange("logoUrl", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Contact Number"
                                                        type="tel"
                                                        value={ownerCafeForm.contactNumber}
                                                        onChange={(e) => handleOwnerCafeFieldChange("contactNumber", e.target.value)}
                                                        icon={<RegistrationPhoneIcon />}
                                                        error={ownerCafeErrors.contactNumber}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Cafe Images URLs"
                                                            value={ownerCafeForm.cafeImages}
                                                            onChange={(e) => handleOwnerCafeFieldChange("cafeImages", e.target.value)}
                                                            icon={<RegistrationLocationIcon />}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Description"
                                                            value={ownerCafeForm.description}
                                                            onChange={(e) => handleOwnerCafeFieldChange("description", e.target.value)}
                                                            icon={<RegistrationAcademicIcon />}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : ownerCafeEditStep === 2 ? (
                                            <>
                                                <h3>Address Details</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Street"
                                                        value={ownerCafeForm.street}
                                                        onChange={(e) => handleOwnerCafeFieldChange("street", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="City"
                                                        value={ownerCafeForm.city}
                                                        onChange={(e) => handleOwnerCafeFieldChange("city", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="State"
                                                        value={ownerCafeForm.stateRegion}
                                                        onChange={(e) => handleOwnerCafeFieldChange("stateRegion", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Pincode"
                                                        value={ownerCafeForm.pincode}
                                                        onChange={(e) => handleOwnerCafeFieldChange("pincode", e.target.value)}
                                                        icon={<RegistrationLocationIcon />}
                                                    />
                                                </div>
                                            </>
                                        ) : ownerCafeEditStep === 3 ? (
                                            <>
                                                <h3>Business Details</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Opening Time"
                                                        value={ownerCafeForm.openingTime}
                                                        onChange={(e) => handleOwnerCafeFieldChange("openingTime", e.target.value)}
                                                        icon={<RegistrationCalendarIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Closing Time"
                                                        value={ownerCafeForm.closingTime}
                                                        onChange={(e) => handleOwnerCafeFieldChange("closingTime", e.target.value)}
                                                        icon={<RegistrationCalendarIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="FSSAI Number"
                                                        value={ownerCafeForm.fssaiNumber}
                                                        onChange={(e) => handleOwnerCafeFieldChange("fssaiNumber", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="GST Number"
                                                        value={ownerCafeForm.gstNumber}
                                                        onChange={(e) => handleOwnerCafeFieldChange("gstNumber", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="field field-single">
                                                        <OwnerProfileFloatingInput
                                                            label="Trade License"
                                                            value={ownerCafeForm.tradeLicense}
                                                            onChange={(e) => handleOwnerCafeFieldChange("tradeLicense", e.target.value)}
                                                            icon={<RegistrationAcademicIcon />}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h3>Bank Details</h3>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Account Holder"
                                                        value={ownerCafeForm.accountHolder}
                                                        onChange={(e) => handleOwnerCafeFieldChange("accountHolder", e.target.value)}
                                                        icon={<RegistrationUserIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="Bank Name"
                                                        value={ownerCafeForm.bankName}
                                                        onChange={(e) => handleOwnerCafeFieldChange("bankName", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <OwnerProfileFloatingInput
                                                        label="Account Number"
                                                        value={ownerCafeForm.accountNumber}
                                                        onChange={(e) => handleOwnerCafeFieldChange("accountNumber", e.target.value)}
                                                        icon={<RegistrationMoneyIcon />}
                                                    />
                                                    <OwnerProfileFloatingInput
                                                        label="IFSC Code"
                                                        value={ownerCafeForm.ifscCode}
                                                        onChange={(e) => handleOwnerCafeFieldChange("ifscCode", e.target.value)}
                                                        icon={<RegistrationAcademicIcon />}
                                                    />
                                                </div>
                                                <div className="owner-profile-edit-note">
                                                    <strong>Cafe update</strong>
                                                    <p>Saving updates the assigned cafe profile used across overview, branding, and owner-managed operations.</p>
                                                </div>
                                            </>
                                        )}
                                        <div className="auth-actions owner-profile-edit-actions">
                                            {ownerCafeEditStep > 1 ? (
                                                <button
                                                    type="button"
                                                    className="auth-btn secondary"
                                                    onClick={() => setOwnerCafeEditStep((current) => Math.max(1, current - 1))}
                                                >
                                                    Previous
                                                </button>
                                            ) : null}
                                            {ownerCafeEditStep < 4 ? (
                                                <button
                                                    type="button"
                                                    className="auth-btn primary"
                                                    onClick={() => {
                                                        const nextErrors = validateOwnerCafeForm(ownerCafeForm);
                                                        setOwnerCafeErrors(nextErrors);
                                                        if (getOwnerCafeStepErrors(ownerCafeEditStep, nextErrors).length > 0) {
                                                            return;
                                                        }
                                                        setOwnerCafeEditStep((current) => Math.min(4, current + 1));
                                                    }}
                                                >
                                                    Next
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="auth-btn primary"
                                                    disabled={ownerCafeSubmitting}
                                                >
                                                    {ownerCafeSubmitting ? "Saving..." : "Save Changes"}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    );
}



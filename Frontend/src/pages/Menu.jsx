import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";

const CATEGORY_LABELS = {
    BEVERAGE: "Drinks",
    FOOD: "Food",
    DESSERT: "Desserts",
    SNACK: "Snacks",
};

const MENU_IMAGES_BY_NAME = {
    Espresso: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    Cappuccino: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    Latte: "https://images.unsplash.com/photo-1523942839745-7848d4a04d76",
    Mocha: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    Americano: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0",
    "Cold Coffee": "https://images.unsplash.com/photo-1541167760496-1628856ab772",
    "Caramel Latte": "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
    "Vanilla Latte": "https://images.unsplash.com/photo-1517705008128-361805f42e86",
    "Irish Coffee": "https://images.unsplash.com/photo-1481391319762-47dff72954d9",
    "Filter Coffee": "https://images.unsplash.com/photo-1509785307050-1628856ab772",
};

const CATEGORY_FALLBACK_IMAGES = {
    BEVERAGE: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    FOOD: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    DESSERT: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    SNACK: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
};

const DEFAULT_MENU_IMAGE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";
const ACTIVE_ORDER_STATUSES = new Set(["PENDING", "CONFIRMED", "PAID", "PREPARING", "READY"]);
const TIME_SLOTS = [
    "09:00 AM - 10:30 AM",
    "10:30 AM - 12:00 PM",
    "12:00 PM - 01:30 PM",
    "01:30 PM - 03:00 PM",
    "03:00 PM - 04:30 PM",
    "04:30 PM - 06:00 PM",
    "06:00 PM - 07:30 PM",
    "07:30 PM - 09:00 PM",
];

function formatRupees(amount) {
    return `Rs ${Number(amount || 0).toFixed(2)}`;
}

function normalizeImageUrl(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
}

function getMenuItemImage(item) {
    if (item.imageUrl) return normalizeImageUrl(item.imageUrl);
    if (item.image) return normalizeImageUrl(item.image);
    if (item.imageUrls) {
        const first = String(item.imageUrls)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)[0];
        if (first) return normalizeImageUrl(first);
    }
    if (item.name && MENU_IMAGES_BY_NAME[item.name]) return MENU_IMAGES_BY_NAME[item.name];
    if (item.name) {
        const seed = encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"));
        return `https://picsum.photos/seed/${seed}/80/80`;
    }
    const cat = item.category || "FOOD";
    return CATEGORY_FALLBACK_IMAGES[cat] || DEFAULT_MENU_IMAGE;
}

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

function isCustomer(user) {
    return user?.roles?.some((r) => (typeof r === "string" ? r : r?.name) === "CUSTOMER");
}

function getTodayIsoDate() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function getTableLocationLabel(location) {
    if (!location) return "Indoor";
    return String(location)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function CustomerTableMetaIcon({ type }) {
    if (type === "seats") {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 11V7.75A2.75 2.75 0 0 1 9.75 5h4.5A2.75 2.75 0 0 1 17 7.75V11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 11h14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 15.5V11Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M7 17v2M17 17v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

export default function Menu() {
    const location = useLocation();
    const navigate = useNavigate();
    const [cafes, setCafes] = useState([]);
    const [selectedCafeId, setSelectedCafeId] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cart, setCart] = useState([]);
    const [placing, setPlacing] = useState(false);
    const [seatingPreference, setSeatingPreference] = useState("INDOOR");
    const [seatingNotes, setSeatingNotes] = useState("");
    const [reservationDate, setReservationDate] = useState(getTodayIsoDate());
    const [reservationTimeSlot, setReservationTimeSlot] = useState("");
    const [guestCount, setGuestCount] = useState(2);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [activeCafeOrder, setActiveCafeOrder] = useState(null);

    const user = getStoredUser();
    const canOrder = api.getToken() && isCustomer(user);

    const selectedCafe = useMemo(
        () => cafes.find((c) => c.id === selectedCafeId) || null,
        [cafes, selectedCafeId]
    );

    useEffect(() => {
        const requestedCafeId = location.state?.selectedCafeId
            ? Number(location.state.selectedCafeId)
            : Number(localStorage.getItem("selectedCafeId"));

        api.getCustomerCafes()
            .then((list) => {
                const all = Array.isArray(list) ? list : [];
                setCafes(all);
                if (all.length === 0) {
                    setSelectedCafeId(null);
                    return;
                }
                const fallback = all[0].id;
                const resolved = all.some((c) => c.id === requestedCafeId)
                    ? requestedCafeId
                    : fallback;
                setSelectedCafeId(resolved);
                localStorage.setItem("selectedCafeId", String(resolved));
            })
            .catch((e) => setError(e.message || "Failed to load cafes"));
    }, [location.state]);

    useEffect(() => {
        if (!selectedCafeId) {
            setMenuItems([]);
            setTables([]);
            setLoading(cafes.length === 0);
            return;
        }

        setLoading(true);
        Promise.all([
            api.getCustomerMenu(selectedCafeId),
            api.getCustomerTables(selectedCafeId).catch(() => []),
        ])
            .then(([menuList, tableList]) => {
                setMenuItems(Array.isArray(menuList) ? menuList : []);
                setTables(Array.isArray(tableList) ? tableList : []);
            })
            .catch((e) => setError(e.message || "Failed to load menu"))
            .finally(() => setLoading(false));
    }, [selectedCafeId, cafes.length]);

    useEffect(() => {
        setCart([]);
        setSelectedTableId(null);
        setActiveCafeOrder(null);
    }, [selectedCafeId]);

    useEffect(() => {
        if (!selectedCafeId || !canOrder) {
            setActiveCafeOrder(null);
            return;
        }

        let mounted = true;
        api.getCustomerMyOrders()
            .then((data) => {
                if (!mounted) return;
                const orders = Array.isArray(data) ? data : [];
                const current = orders
                    .filter((order) =>
                        order?.cafe?.id === selectedCafeId
                        && order?.cafeTable?.id
                        && ACTIVE_ORDER_STATUSES.has(order.status)
                    )
                    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null;
                setActiveCafeOrder(current);
            })
            .catch(() => {
                if (mounted) setActiveCafeOrder(null);
            });
        return () => {
            mounted = false;
        };
    }, [canOrder, selectedCafeId]);

    useEffect(() => {
        if (!activeCafeOrder) return;
        setReservationDate(activeCafeOrder.reservationDate || getTodayIsoDate());
        setReservationTimeSlot(activeCafeOrder.reservationTimeSlot || "");
        setGuestCount(activeCafeOrder.guestCount || 2);
        setSeatingPreference(activeCafeOrder.seatingPreference || "INDOOR");
        setSelectedTableId(activeCafeOrder.cafeTable?.id || null);
    }, [activeCafeOrder]);

    const filteredTables = useMemo(() => {
        return (tables || []).filter((table) => {
            const matchesActiveTable = activeCafeOrder?.cafeTable?.id === table.id;
            if (table.status !== "AVAILABLE" && !matchesActiveTable) return false;
            if (seatingPreference && (table.location || "INDOOR") !== seatingPreference) return false;
            if (guestCount && table.capacity && table.capacity < guestCount) return false;
            return true;
        });
    }, [activeCafeOrder, guestCount, seatingPreference, tables]);

    useEffect(() => {
        if (!selectedTableId) return;
        if (!filteredTables.some((table) => table.id === selectedTableId)) {
            setSelectedTableId(null);
        }
    }, [filteredTables, selectedTableId]);

    const selectedTable = useMemo(
        () => filteredTables.find((table) => table.id === selectedTableId) || null,
        [filteredTables, selectedTableId]
    );
    const effectiveSelectedTable = selectedTable || activeCafeOrder?.cafeTable || null;
    const shouldShowTableAvailability = Boolean(activeCafeOrder || reservationTimeSlot);

    const reservationReady = Boolean(
        selectedCafeId && reservationDate && reservationTimeSlot && guestCount > 0
    );
    const canBrowseMenu = reservationReady && Boolean(effectiveSelectedTable);

    const addToCart = (item) => {
        if (!canBrowseMenu) return;
        setCart((prev) => {
            const existing = prev.find((c) => c.menuId === item.id);
            if (existing) {
                return prev.map((c) =>
                    c.menuId === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { menuId: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const updateCartQty = (menuId, delta) => {
        setCart((prev) => {
            const next = prev.map((c) =>
                c.menuId === menuId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
            );
            return next.filter((c) => c.quantity > 0);
        });
    };

    const removeFromCart = (menuId) => {
        setCart((prev) => prev.filter((c) => c.menuId !== menuId));
    };

    const total = cart.reduce((sum, c) => sum + Number(c.price || 0) * (c.quantity || 0), 0);

    const handlePlaceOrder = async () => {
        if (!canOrder || !selectedCafeId || cart.length === 0 || !selectedTableId || !reservationReady) return;

        setPlacing(true);
        setError("");
        try {
            const order = await api.placeOrder(selectedCafeId, cart, {
                tableId: effectiveSelectedTable?.id || selectedTableId,
                reservationDate,
                reservationTimeSlot,
                guestCount,
                seatingPreference,
                seatingNotes: seatingNotes.trim() || null,
            });
            setCart([]);
            setSeatingNotes("");
            setConfirmedOrder(order);
        } catch (e) {
            setError(e.message || "Failed to place order");
        } finally {
            setPlacing(false);
        }
    };

    const menuByCategory = menuItems.reduce((acc, item) => {
        const cat = item.category || "FOOD";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const categoryOrder = ["BEVERAGE", "FOOD", "DESSERT", "SNACK"];

    return (
        <section id="menu" className="menu-page">
            <div className="menu-page-inner">
                {confirmedOrder && (
                    <div className="menu-confirm-overlay" role="dialog" aria-modal="true">
                        <div className="menu-confirm-card">
                            <span className="menu-confirm-badge">Order confirmed</span>
                            <h2>Order {confirmedOrder.orderNumber} has been placed.</h2>
                            <p>
                                Your table reservation and menu order are now confirmed. The order is visible in your order history and on the cafe dashboards.
                            </p>
                            <div className="menu-confirm-grid">
                                <div>
                                    <span>Total</span>
                                    <strong>{formatRupees(confirmedOrder.totalAmount || total || 0)}</strong>
                                </div>
                                <div>
                                    <span>Status</span>
                                    <strong>{confirmedOrder.status || "CONFIRMED"}</strong>
                                </div>
                                <div>
                                    <span>Table</span>
                                    <strong>{confirmedOrder.cafeTable?.tableNumber || selectedTable?.tableNumber || "-"}</strong>
                                </div>
                                <div>
                                    <span>Guests</span>
                                    <strong>{confirmedOrder.guestCount || guestCount}</strong>
                                </div>
                            </div>
                            <div className="menu-confirm-actions">
                                <button
                                    type="button"
                                    className="payment-secondary-btn"
                                    onClick={() => setConfirmedOrder(null)}
                                >
                                    Continue browsing
                                </button>
                                <button
                                    type="button"
                                    className="menu-btn-place"
                                    onClick={() =>
                                        navigate("/user", {
                                            state: {
                                                message: `Order ${confirmedOrder.orderNumber || ""} placed successfully.`,
                                            },
                                        })
                                    }
                                >
                                    Go to dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="menu-header">
                    <h1 className="menu-title">Plan your visit and order</h1>
                    <p className="menu-subtitle menu-selected-cafe">
                        <strong>{selectedCafe?.name || "No cafe selected"}</strong>
                    </p>
                </div>

                {error && (
                    <div className="menu-message menu-message-error" role="alert">
                        {error}
                    </div>
                )}

                {activeCafeOrder && (
                    <div className="menu-message menu-message-success">
                        Continuing your current table session at table <strong>{activeCafeOrder.cafeTable?.tableNumber}</strong>.
                        You can order more items without choosing slot and table again.
                    </div>
                )}

                {loading ? (
                    <p className="menu-loading">Loading menu...</p>
                ) : (
                    <>
                        <div className="menu-reservation-flow">
                            <div className="menu-reservation-card">
                                {activeCafeOrder && (
                                    <div className="menu-reservation-card-toolbar">
                                        <span className="menu-session-tag">Current session</span>
                                    </div>
                                )}
                                <div className="menu-step-badge">1</div>
                                <div className="menu-reservation-head">
                                    <h3>Select slot details</h3>
                                    <p>
                                        {activeCafeOrder
                                            ? "Your active order details are prefilled here. You can change them directly if needed."
                                            : "Choose your visit date, preferred time slot, and total guests."}
                                    </p>
                                </div>
                                <div className="menu-reservation-grid">
                                    <label>
                                        <span>Date</span>
                                        <input
                                            type="date"
                                            min={getTodayIsoDate()}
                                            value={reservationDate}
                                            onChange={(e) => setReservationDate(e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        <span>Guests</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={guestCount}
                                            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value || 1)))}
                                        />
                                    </label>
                                </div>
                                <div className="menu-slot-grid">
                                    {TIME_SLOTS.map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            className={`menu-slot-chip ${reservationTimeSlot === slot ? "active" : ""}`}
                                            onClick={() => setReservationTimeSlot(slot)}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="menu-reservation-card">
                                <div className="menu-step-badge">2</div>
                                <div className="menu-reservation-head">
                                    <h3>Choose seating and table</h3>
                                    <p>
                                        {activeCafeOrder
                                            ? "Your current session table is prefilled below. You can choose a different one directly."
                                            : "Filter by location preference and select one available table that fits your group."}
                                    </p>
                                </div>

                                <div className="menu-pref-options">
                                    {["WINDOW", "OUTDOOR", "INDOOR"].map((pref) => (
                                        <label key={pref}>
                                            <input
                                                type="radio"
                                                name="seatingPreference"
                                                value={pref}
                                                checked={seatingPreference === pref}
                                                onChange={(e) => setSeatingPreference(e.target.value)}
                                            />
                                            <span>{pref}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="menu-table-summary">
                                    <span>
                                        {shouldShowTableAvailability
                                            ? `${filteredTables.length} table(s) available for ${guestCount} guest(s)`
                                            : "Select a time slot to view matching tables"}
                                    </span>
                                    {reservationTimeSlot ? <strong>{reservationTimeSlot}</strong> : <strong>Select a time slot first</strong>}
                                </div>

                                <div className="menu-table-grid">
                                    {!shouldShowTableAvailability ? (
                                        <p className="menu-empty">Choose a time slot first, then the available tables will appear here.</p>
                                    ) : filteredTables.length === 0 ? (
                                        <p className="menu-empty">No available tables match the selected preference and guest count.</p>
                                     ) : (
                                         filteredTables.map((table) => (
                                             <button
                                                 key={table.id}
                                                 type="button"
                                                 className={`menu-table-card owner-table-card status-${String(table.status || "AVAILABLE").toLowerCase()} ${selectedTableId === table.id ? "active is-selected" : ""}`}
                                                 onClick={() => setSelectedTableId(table.id)}
                                                 disabled={!reservationReady}
                                             >
                                                 <span className={`owner-table-status-strip status-${String(table.status || "AVAILABLE").toLowerCase()}`} />
                                                 <div className="owner-table-card-head">
                                                     <div className="owner-table-card-copy">
                                                         <span className="owner-table-card-label">Table</span>
                                                         <strong className="table-number">{table.tableNumber}</strong>
                                                         <div className="owner-table-meta-list">
                                                             <span className="owner-table-meta-chip">
                                                                 <CustomerTableMetaIcon type="seats" />
                                                                 {table.capacity || "-"} seats
                                                             </span>
                                                             <span className="owner-table-meta-chip">
                                                                 <CustomerTableMetaIcon type="location" />
                                                                 {getTableLocationLabel(table.location || "INDOOR")}
                                                             </span>
                                                         </div>
                                                     </div>
                                                     <span className={`table-status table-status-pill status-${String(table.status || "AVAILABLE").toLowerCase()}`}>
                                                         {table.status || "AVAILABLE"}
                                                     </span>
                                                 </div>
                                                 <span className="menu-table-card-note">
                                                     {selectedTableId === table.id ? "Selected for this booking" : "Tap to choose this table"}
                                                 </span>
                                             </button>
                                         ))
                                     )}
                                </div>

                                <textarea
                                    value={seatingNotes}
                                    onChange={(e) => setSeatingNotes(e.target.value)}
                                    placeholder="Any note for this booking? e.g., birthday setup, near socket, quiet corner"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {!canBrowseMenu && (
                            <div className="menu-message menu-message-success">
                                Complete slot details and select a table to unlock menu ordering.
                            </div>
                        )}

                        {menuItems.length === 0 && !error ? (
                            <p className="menu-empty">No menu available. Check back later.</p>
                        ) : (
                            <div className={`menu-layout ${canBrowseMenu ? "" : "menu-layout-locked"}`}>
                                <div className="menu-grid-wrap">
                                    {categoryOrder.map((cat) => {
                                        const items = menuByCategory[cat];
                                        if (!items || items.length === 0) return null;
                                        return (
                                            <div key={cat} className="menu-category">
                                                <h2 className="menu-category-title">{CATEGORY_LABELS[cat] || cat}</h2>
                                                <div className="menu-items">
                                                    {items.map((item) => (
                                                        <div key={item.id} className="menu-item-card">
                                                            <div className="menu-item-media">
                                                                <img
                                                                    src={getMenuItemImage(item)}
                                                                    alt={item.name}
                                                                    className="menu-item-image"
                                                                    onError={(e) => {
                                                                        const fallback =
                                                                            CATEGORY_FALLBACK_IMAGES[item.category || "FOOD"] ||
                                                                            DEFAULT_MENU_IMAGE;
                                                                        if (e.currentTarget.src !== fallback) {
                                                                            e.currentTarget.src = fallback;
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="menu-item-info">
                                                                <h3 className="menu-item-name">{item.name}</h3>
                                                                {item.description && (
                                                                    <p className="menu-item-desc">{item.description}</p>
                                                                )}
                                                                <p className="menu-item-price">{formatRupees(item.price)}</p>
                                                            </div>
                                                            <div className="menu-item-actions">
                                                                <button
                                                                    type="button"
                                                                    className="menu-btn-add"
                                                                    onClick={() => addToCart(item)}
                                                                    disabled={!item.available || !canBrowseMenu}
                                                                >
                                                                    Add to cart
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <aside className="menu-cart">
                                    <h3 className="menu-cart-title">Your order</h3>
                                    <div className="menu-cart-reservation">
                                        <span>Date: <strong>{reservationDate || "-"}</strong></span>
                                        <span>Time: <strong>{reservationTimeSlot || "-"}</strong></span>
                                        <span>Guests: <strong>{guestCount}</strong></span>
                                        <span>Table: <strong>{effectiveSelectedTable?.tableNumber || "-"}</strong></span>
                                    </div>
                                    {cart.length === 0 ? (
                                        <p className="menu-cart-empty">Cart is empty. Add items from the menu after selecting a table.</p>
                                    ) : (
                                        <>
                                            <ul className="menu-cart-list">
                                                {cart.map((c) => (
                                                    <li key={c.menuId} className="menu-cart-item">
                                                        <span className="menu-cart-name">{c.name}</span>
                                                        <div className="menu-cart-qty">
                                                            <button
                                                                type="button"
                                                                aria-label="Decrease"
                                                                onClick={() => updateCartQty(c.menuId, -1)}
                                                            >
                                                                -
                                                            </button>
                                                            <span>{c.quantity}</span>
                                                            <button
                                                                type="button"
                                                                aria-label="Increase"
                                                                onClick={() => updateCartQty(c.menuId, 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="menu-cart-line">{formatRupees(Number(c.price) * c.quantity)}</span>
                                                        <button
                                                            type="button"
                                                            className="menu-cart-remove"
                                                            aria-label="Remove"
                                                            onClick={() => removeFromCart(c.menuId)}
                                                        >
                                                            x
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="menu-cart-total">Total: <strong>{formatRupees(total)}</strong></p>

                                            {canOrder ? (
                                                <button
                                                    type="button"
                                                    className="menu-btn-place"
                                                    onClick={handlePlaceOrder}
                                                    disabled={placing || cart.length === 0 || !canBrowseMenu}
                                                >
                                                    {placing ? "Placing order..." : "Place order"}
                                                </button>
                                            ) : (
                                                <p className="menu-cart-login">
                                                    <Link to="/login">Log in</Link> or <Link to="/register">register</Link> as a customer to place an order.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </aside>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

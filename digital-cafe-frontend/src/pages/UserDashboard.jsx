import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
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

export default function UserDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const role = (() => {
        const r = user.roles?.[0];
        return typeof r === "string" ? r : (r?.name || "CUSTOMER");
    })();
    const [cafes, setCafes] = useState([]);
    const [loadingCafes, setLoadingCafes] = useState(true);
    const [cafeError, setCafeError] = useState("");
    const [carouselByCafe, setCarouselByCafe] = useState({});
    const [orderCount, setOrderCount] = useState(0);
    const [message, setMessage] = useState("");

    const cafeImages = useMemo(
        () =>
            cafes.reduce((acc, cafe) => {
                const base = encodeURIComponent((cafe.name || "cafe").toLowerCase());
                acc[cafe.id] = [
                    `https://picsum.photos/seed/${base}-ambience/900/520`,
                    `https://picsum.photos/seed/${base}-coffee/900/520`,
                    `https://picsum.photos/seed/${base}-seating/900/520`,
                    `https://picsum.photos/seed/${base}-food/900/520`,
                ];
                return acc;
            }, {}),
        [cafes]
    );

    useEffect(() => {
        let mounted = true;
        setLoadingCafes(true);
        api.getCustomerMyOrders()
            .then((data) => {
                if (!mounted) return;
                const orders = Array.isArray(data) ? data : [];
                setOrderCount(orders.length);
            })
            .catch(() => {
                if (!mounted) return;
                setOrderCount(0);
            });
        api.getCustomerCafes()
            .then((data) => {
                if (!mounted) return;
                const list = Array.isArray(data) ? data : [];
                setCafes(list);
                const initial = {};
                list.forEach((cafe) => {
                    initial[cafe.id] = 0;
                });
                setCarouselByCafe(initial);
            })
            .catch((err) => {
                if (!mounted) return;
                setCafeError(err.message || "Failed to load cafes");
            })
            .finally(() => {
                if (mounted) setLoadingCafes(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (cafes.length === 0) return undefined;
        const id = setInterval(() => {
            setCarouselByCafe((prev) => {
                const next = { ...prev };
                cafes.forEach((cafe) => {
                    const images = cafeImages[cafe.id] || [];
                    if (images.length === 0) return;
                    const current = prev[cafe.id] || 0;
                    next[cafe.id] = (current + 1) % images.length;
                });
                return next;
            });
        }, 3500);
        return () => clearInterval(id);
    }, [cafes, cafeImages]);

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            navigate(location.pathname, { replace: true });
        }
    }, [location.pathname, location.state, navigate]);

    const moveSlide = (cafeId, delta) => {
        const total = (cafeImages[cafeId] || []).length;
        if (total === 0) return;
        setCarouselByCafe((prev) => {
            const current = prev[cafeId] || 0;
            const next = (current + delta + total) % total;
            return { ...prev, [cafeId]: next };
        });
    };

    const handleSelectCafe = (cafe) => {
        localStorage.setItem("selectedCafeId", String(cafe.id));
        navigate("/menu", {
            state: { selectedCafeId: cafe.id, selectedCafeName: cafe.name },
        });
    };

    return (
        <DashboardLayout
            title={user.username}
            role={role}
            userEmail={user.email}
            sidebarExtra={<CustomerSidebarActions />}
        >
            <div className="dashboard dashboard-user">
                <h1 className="dashboard-title">Customer dashboard</h1>

                <div className="card-grid">
                    <div className="card">
                        <h3>My orders</h3>
                        <p>{orderCount}</p>
                    </div>
                    <div className="card">
                        <h3>Available cafes</h3>
                        <p>{cafes.length}</p>
                    </div>
                    <div className="card">
                        <h3>Last login</h3>
                        <p>{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Choose your cafe</h3>
                    <p>
                        Select a cafe from the image gallery below. After selecting, you will move to menu and cart,
                        then confirm seating requirements before placing your order.
                    </p>

                    {loadingCafes ? (
                        <p className="empty-msg" style={{ marginTop: 12 }}>Loading cafes...</p>
                    ) : cafeError ? (
                        <p className="panel-message" style={{ marginTop: 12, color: "#b91c1c" }}>{cafeError}</p>
                    ) : cafes.length === 0 ? (
                        <p className="empty-msg" style={{ marginTop: 12 }}>No cafes available right now.</p>
                    ) : (
                        <div className="customer-cafe-grid">
                            {cafes.map((cafe) => {
                                const images = cafeImages[cafe.id] || [];
                                const active = carouselByCafe[cafe.id] || 0;
                                return (
                                    <article key={cafe.id} className="customer-cafe-card">
                                        <div className="customer-cafe-media">
                                            {images.length > 0 && (
                                                <img
                                                    src={images[active]}
                                                    alt={`${cafe.name} view ${active + 1}`}
                                                    className="customer-cafe-main-image"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                className="customer-cafe-arrow left"
                                                onClick={() => moveSlide(cafe.id, -1)}
                                                aria-label={`Previous image for ${cafe.name}`}
                                            >
                                                &#8249;
                                            </button>
                                            <button
                                                type="button"
                                                className="customer-cafe-arrow right"
                                                onClick={() => moveSlide(cafe.id, 1)}
                                                aria-label={`Next image for ${cafe.name}`}
                                            >
                                                &#8250;
                                            </button>
                                        </div>
                                        <div className="customer-cafe-thumbs">
                                            {images.map((url, idx) => (
                                                <button
                                                    key={`${cafe.id}-${idx}`}
                                                    type="button"
                                                    className={`customer-cafe-thumb ${idx === active ? "active" : ""}`}
                                                    onClick={() => setCarouselByCafe((prev) => ({ ...prev, [cafe.id]: idx }))}
                                                    aria-label={`Show image ${idx + 1} for ${cafe.name}`}
                                                >
                                                    <img src={url} alt={`${cafe.name} thumbnail ${idx + 1}`} />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="customer-cafe-content">
                                            <h4>{cafe.name}</h4>
                                            <p>{cafe.description || "Fresh coffee, food, and a comfortable seating experience."}</p>
                                            <div className="customer-cafe-meta">
                                                <span>{cafe.address || "Address not added"}</span>
                                                <span>{cafe.phone || "Phone not added"}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="execute-btn"
                                                onClick={() => handleSelectCafe(cafe)}
                                            >
                                                Select cafe and continue
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {message && <p className="panel-message" style={{ marginTop: 16 }}>{message}</p>}
            </div>
        </DashboardLayout>
    );
}

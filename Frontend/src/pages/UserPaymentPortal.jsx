import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { launchRazorpayCheckout } from "../utils/razorpayCheckout";

const PAYMENT_METHODS = [
    {
        id: "razorpay",
        title: "Razorpay",
        subtitle: "Standard test checkout",
        detail: "This opens Razorpay Checkout in test mode using the backend-created order.",
        icon: "RZ",
    },
    {
        id: "notes",
        title: "Setup",
        subtitle: "Configuration required",
        detail: "Keep your test key id and secret on the backend. Never expose the secret in the frontend.",
        icon: "IN",
    },
];

export default function UserPaymentPortal() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams();
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!location.state?.order);
    const [launching, setLaunching] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);

    useEffect(() => {
        if (order) {
            setLoading(false);
            return;
        }
        setLoading(true);
        api.getCustomerMyOrders()
            .then((data) => {
                const nextOrder = (Array.isArray(data) ? data : []).find((entry) => String(entry.id) === String(orderId));
                if (!nextOrder) {
                    throw new Error("Order not found for payment.");
                }
                setOrder(nextOrder);
            })
            .catch((err) => setMessage(err.message || "Failed to load order for payment."))
            .finally(() => setLoading(false));
    }, [order, orderId]);

    const selectedOption = useMemo(
        () => PAYMENT_METHODS.find((entry) => entry.id === selectedMethod) || PAYMENT_METHODS[0],
        [selectedMethod]
    );

    const handleOpenRazorpay = async () => {
        if (!order) return;
        setMessage("");
        try {
            await launchRazorpayCheckout({
                order,
                navigate,
                onBeforeOpen: () => setLaunching(true),
                onSettled: () => setLaunching(false),
            });
        } catch (err) {
            setMessage(err.message || "Failed to launch Razorpay checkout.");
            setLaunching(false);
        }
    };

    if (loading) {
        return (
            <div className="payment-portal">
                <div className="payment-backdrop">
                    <div className="payment-modal payment-modal-empty">
                        <h1 className="payment-title">Loading payment portal...</h1>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="payment-portal">
                <div className="payment-backdrop">
                    <div className="payment-modal payment-modal-empty">
                        <h1 className="payment-title">Payment portal unavailable</h1>
                        <p className="payment-subtitle">{message || "We could not load this order for payment."}</p>
                        <div className="payment-actions">
                            <button type="button" className="payment-secondary-btn" onClick={() => navigate("/user/orders")}>
                                Back to orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-portal">
            <div className="payment-backdrop">
                <div className="payment-modal">
                    <aside className="payment-left-panel">
                        <div className="payment-brand-row">
                            <div className="payment-brand-badge">RZ</div>
                            <div>
                                <h2>Razorpay Test</h2>
                                <p>Real test checkout</p>
                            </div>
                        </div>

                        <div className="payment-price-card">
                            <span>Amount to pay</span>
                            <strong>{order.totalAmount != null ? `Rs ${Number(order.totalAmount).toFixed(2)}` : "Rs 0.00"}</strong>
                            <small>Checkout uses your backend Razorpay test configuration</small>
                        </div>

                        <div className="payment-identity-card">
                            <span>Order number</span>
                            <strong>{order.orderNumber}</strong>
                            <span>Current status</span>
                            <strong>{order.status}</strong>
                        </div>

                        <div className="payment-illustration">
                            <div className="payment-box payment-box-tall"></div>
                            <div className="payment-box payment-box-wide"></div>
                            <div className="payment-bag"></div>
                            <div className="payment-offer-badge">T</div>
                        </div>

                        <p className="payment-secured">Test mode only. Use Razorpay test key id and test secret.</p>
                    </aside>

                    <section className="payment-right-panel">
                        <div className="payment-topbar">
                            <div>
                                <p className="payment-kicker">Payment portal</p>
                                <h3>Complete your order payment</h3>
                            </div>
                            <button type="button" className="payment-close-btn" onClick={() => navigate("/user/orders")}>
                                &times;
                            </button>
                        </div>

                        <div className="payment-checkout-summary">
                            <div className="payment-summary-chip">
                                <span>Order</span>
                                <strong>{order.orderNumber}</strong>
                            </div>
                            <div className="payment-summary-chip">
                                <span>Total</span>
                                <strong>{order.totalAmount != null ? `Rs ${Number(order.totalAmount).toFixed(2)}` : "Rs 0.00"}</strong>
                            </div>
                            <div className="payment-summary-chip">
                                <span>Table</span>
                                <strong>{order?.cafeTable?.tableNumber || "Not assigned"}</strong>
                            </div>
                        </div>

                        {message && <p className="panel-message">{message}</p>}

                        <div className="payment-content-grid">
                            <div className="payment-option-list">
                                {PAYMENT_METHODS.map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        className={`payment-option-item ${selectedMethod === entry.id ? "active" : ""}`}
                                        onClick={() => setSelectedMethod(entry.id)}
                                    >
                                        <div>
                                            <strong>{entry.title}</strong>
                                            <span>{entry.subtitle}</span>
                                        </div>
                                        <span className="payment-option-dots">{entry.icon}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="payment-option-detail">
                                <div className="payment-method-hero">
                                    <div>
                                        <p className="payment-kicker">Razorpay Checkout</p>
                                        <strong>{selectedOption.title}</strong>
                                        <span>{selectedOption.detail}</span>
                                    </div>
                                    <div className="payment-method-icon">{selectedOption.icon}</div>
                                </div>

                                <div className="payment-qr-card">
                                    <div>
                                        <strong>Test mode checklist</strong>
                                        <span className="payment-qr-copy">
                                            Configure `RAZORPAY_ENABLED`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` on the backend.
                                            Then use Razorpay test payment details in the checkout popup.
                                        </span>
                                    </div>
                                </div>

                                <div className="payment-demo-card">
                                    <span className="payment-mini-label">Backend verification</span>
                                    <strong>Order created server-side</strong>
                                    <small>After checkout success, the backend verifies the Razorpay signature and marks the order as paid.</small>
                                </div>

                                <button
                                    type="button"
                                    className="payment-primary-btn"
                                    onClick={handleOpenRazorpay}
                                    disabled={launching}
                                >
                                    {launching ? "Opening Razorpay..." : "Pay with Razorpay test checkout"}
                                </button>

                                <p className="payment-note-inline">
                                    If checkout closes or fails, the order remains unpaid. Only a verified Razorpay success marks it as paid.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

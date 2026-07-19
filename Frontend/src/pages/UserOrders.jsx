import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CustomerSidebarActions from "../components/CustomerSidebarActions";
import CustomerOrdersPanel from "../components/CustomerOrdersPanel";
import { api } from "../api";
import { launchRazorpayCheckout } from "../utils/razorpayCheckout";

function getStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : { username: "Customer", roles: ["CUSTOMER"] };
    } catch {
        return { username: "Customer", roles: ["CUSTOMER"] };
    }
}

export default function UserOrders() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const role = (() => {
        const r = user.roles?.[0];
        return typeof r === "string" ? r : (r?.name || "CUSTOMER");
    })();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [workingOrderId, setWorkingOrderId] = useState(null);

    const loadOrders = () => {
        setLoading(true);
        api.getCustomerMyOrders()
            .then((data) => setOrders(Array.isArray(data) ? data : []))
            .catch((err) => {
                setOrders([]);
                setMessage(err.message || "Failed to load orders.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            navigate(location.pathname, { replace: true });
        }
    }, [location.pathname, location.state, navigate]);

    const handlePayOrder = async (order) => {
        setWorkingOrderId(order.id);
        setMessage("");
        try {
            await launchRazorpayCheckout({
                order,
                navigate,
                onBeforeOpen: () => setWorkingOrderId(order.id),
                onSettled: () => setWorkingOrderId(null),
                onSuccess: () => loadOrders(),
            });
        } catch (err) {
            const failureMessage = err.message || "Failed to launch Razorpay checkout.";
            setMessage(failureMessage);
            window.alert(failureMessage);
            setWorkingOrderId(null);
        }
    };

    const handleCancelOrder = async (orderId) => {
        setWorkingOrderId(orderId);
        setMessage("");
        try {
            await api.cancelCustomerOrder(orderId);
            loadOrders();
            setMessage("Order cancelled.");
        } catch (err) {
            setMessage(err.message || "Failed to cancel order.");
        } finally {
            setWorkingOrderId(null);
        }
    };

    return (
        <DashboardLayout
            title={user.username}
            role={role}
            userEmail={user.email}
            sidebarExtra={<CustomerSidebarActions />}
        >
            <div className="dashboard dashboard-user">
                <h1 className="dashboard-title">My orders</h1>
                {message && <p className="panel-message" style={{ marginTop: 16 }}>{message}</p>}
                <CustomerOrdersPanel
                    orders={orders}
                    loading={loading}
                    workingOrderId={workingOrderId}
                    onPay={handlePayOrder}
                    onCancel={handleCancelOrder}
                />
            </div>
        </DashboardLayout>
    );
}

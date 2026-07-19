import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterCafeOwner from "./pages/RegisterCafeOwner";
import RegisterCustomer from "./pages/RegisterCustomer";
import SelectRegistrationType from "./pages/SelectRegistrationType";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Menu from "./pages/Menu";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import UserOrders from "./pages/UserOrders";
import UserPaymentPortal from "./pages/UserPaymentPortal";
import UserProfile from "./pages/UserProfile";
import ChefDashboard from "./pages/ChefDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerCafeSelect from "./pages/OwnerCafeSelect";
import OwnerAccept from "./pages/OwnerAccept";
import Database from "./pages/Database";

const DASHBOARD_PATHS = ["/admin", "/user", "/user/orders", "/user/profile", "/chef", "/waiter", "/owner", "/owner/select-cafe", "/owner/accept"];
const AUTH_PATHS_NO_FOOTER = [
    "/login",
    "/register",
    "/register/customer",
    "/register/cafe-owner",
    "/select-registration-type",
    "/forgot-password",
    "/reset-password",
];

export default function App() {
    const location = useLocation();
    const hideLayout = DASHBOARD_PATHS.some((p) => location.pathname === p) || /^\/user\/orders\/[^/]+\/pay$/.test(location.pathname);
    const showFooter = !hideLayout && !AUTH_PATHS_NO_FOOTER.includes(location.pathname);

    return (
        <>
            {!hideLayout && <Navbar />}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/select-registration-type" replace />} />
                <Route path="/select-registration-type" element={<SelectRegistrationType />} />
                <Route path="/register/customer" element={<RegisterCustomer />} />
                <Route path="/register/cafe-owner" element={<RegisterCafeOwner />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/database" element={<Database />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/user" element={<UserDashboard />} />
                <Route path="/user/orders" element={<UserOrders />} />
                <Route path="/user/orders/:orderId/pay" element={<UserPaymentPortal />} />
                <Route path="/user/profile" element={<UserProfile />} />
                <Route path="/chef" element={<ChefDashboard />} />
                <Route path="/waiter" element={<WaiterDashboard />} />
                <Route path="/owner/select-cafe" element={<OwnerCafeSelect />} />
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route path="/owner/accept" element={<OwnerAccept />} />
            </Routes>

            {showFooter && <Footer />}
        </>
    );
}

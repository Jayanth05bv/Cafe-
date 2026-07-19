import { useNavigate } from "react-router-dom";

export default function CustomerSidebarActions() {
    const navigate = useNavigate();

    return (
        <div className="sidebar-execute">
            <p className="sidebar-nav-label">Customer tools</p>
            <div className="execute-actions">
                <button type="button" className="execute-btn" onClick={() => navigate("/user/orders")}>
                    View my order
                </button>
                <button type="button" className="execute-btn" onClick={() => navigate("/user/profile")}>
                    Update profile
                </button>
            </div>
        </div>
    );
}

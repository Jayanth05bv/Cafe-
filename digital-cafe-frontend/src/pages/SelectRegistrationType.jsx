import { useState } from "react";
import { useNavigate } from "react-router-dom";

const REGISTRATION_OPTIONS = [
    {
        id: "cafe-owner",
        title: "Cafe Owner Registration",
        description: "Set up an owner account for cafe operations, staffing, menu control, and analytics.",
        icon: "/owner-registration-logo.svg",
        accentClass: "owner",
        path: "/register/cafe-owner",
    },
    {
        id: "customer",
        title: "Customer Registration",
        description: "Create a customer account to discover cafes, place orders, and pay through Razorpay.",
        icon: "/customer-registration-logo.svg",
        accentClass: "customer",
        path: "/register/customer",
    },
];

export default function SelectRegistrationType() {
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    const handleSelect = (option) => {
        setSelected(option.id);
        window.setTimeout(() => navigate(option.path), 180);
    };

    return (
        <div className="registration-type-page">
            <div className="registration-type-shell">
                <button
                    type="button"
                    className="registration-back-btn"
                    onClick={() => navigate("/")}
                >
                    Back
                </button>

                <div className="registration-type-header">
                    <p className="registration-type-kicker">Registration</p>
                    <h1>Select your account type</h1>
                    <p className="registration-type-copy">
                        Choose the experience that fits your workflow. You can continue with customer ordering
                        or start as a cafe owner for operations access.
                    </p>
                </div>

                <div className="registration-type-grid">
                    {REGISTRATION_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={[
                                "registration-type-card",
                                `registration-type-card-${option.accentClass}`,
                                selected === option.id ? "is-selected" : "",
                            ].join(" ")}
                            onClick={() => handleSelect(option)}
                        >
                            <div className="registration-type-icon">
                                <img src={option.icon} alt="" className="registration-type-icon-img" />
                            </div>
                            <div className="registration-type-content">
                                <strong>{option.title}</strong>
                                <span>{option.description}</span>
                            </div>
                            <span className="registration-type-arrow">Continue</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

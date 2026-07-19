import { api } from "../api";

function loadRazorpayScript() {
    if (window.Razorpay) {
        return Promise.resolve(true);
    }
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function launchRazorpayCheckout({
    order,
    navigate,
    onBeforeOpen,
    onSettled,
    onSuccess,
}) {
    try {
        onBeforeOpen?.();

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error("Failed to load Razorpay Checkout script.");
        }

        const checkout = await api.createRazorpayOrder(order.id);
        const options = {
            key: checkout.keyId,
            amount: checkout.amount,
            currency: checkout.currency,
            name: checkout.name,
            description: checkout.description,
            order_id: checkout.razorpayOrderId,
            prefill: {
                name: checkout.customerName || "",
                email: checkout.customerEmail || "",
                contact: checkout.customerContact || "",
            },
            notes: {
                order_id: String(order.id),
                order_number: order.orderNumber,
            },
            theme: {
                color: "#0f9d44",
            },
            handler: async function (response) {
                try {
                    await api.verifyRazorpayPayment(order.id, {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                    onSuccess?.();
                    navigate?.("/user/orders", {
                        state: { message: `Payment completed for ${order.orderNumber}. Order marked as paid.` },
                    });
                } catch (err) {
                    onSettled?.();
                    throw err;
                }
            },
            modal: {
                ondismiss: () => {
                    onSettled?.();
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response) {
            onSettled?.();
            window.alert(response?.error?.description || "Payment failed. Please try again.");
        });
        razorpay.open();
    } catch (err) {
        onSettled?.();
        throw err;
    }
}

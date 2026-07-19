import { useState } from "react";

function formatRupees(amount) {
    return `Rs ${Number(amount || 0).toFixed(2)}`;
}

function formatOrderDateTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(value));
}

function getPaymentStatus(order) {
    if (!order) return "Unpaid";
    if (order.status === "PAID" || order.razorpayPaymentId || order.paymentCapturedAt) return "Paid";
    if (order.status === "CANCELLED") return "Not paid";
    return "Unpaid";
}

function getLineTotal(item) {
    return Number(item?.unitPrice || 0) * Number(item?.quantity || 0);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildReceiptHtml(order) {
    const items = Array.isArray(order?.items) ? order.items : [];
    const rows = items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <strong>${escapeHtml(item?.menuItem?.name || "Item")}</strong>
                ${item?.specialInstructions ? `<div class="receipt-note">${escapeHtml(item.specialInstructions)}</div>` : ""}
            </td>
            <td>${Number(item?.quantity || 0)}</td>
            <td>${escapeHtml(formatRupees(item?.unitPrice || 0))}</td>
            <td>${escapeHtml(formatRupees(getLineTotal(item)))}</td>
        </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Receipt ${escapeHtml(order?.orderNumber || "")}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 32px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f5f1ea;
            color: #2b1d0e;
        }
        .receipt-sheet {
            max-width: 820px;
            margin: 0 auto;
            background: #fffdf9;
            border: 1px solid #d8c6ae;
            border-radius: 18px;
            box-shadow: 0 20px 50px rgba(43, 29, 14, 0.12);
            overflow: hidden;
        }
        .receipt-header {
            padding: 28px 32px 20px;
            background: linear-gradient(135deg, #2b1d0e, #6b4a28);
            color: #fff;
        }
        .receipt-header h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .receipt-header p {
            margin: 8px 0 0;
            color: rgba(255, 255, 255, 0.85);
        }
        .receipt-body {
            padding: 28px 32px 32px;
        }
        .receipt-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 24px;
        }
        .receipt-meta-card {
            padding: 14px 16px;
            border: 1px solid #eadcc9;
            border-radius: 12px;
            background: #fff;
        }
        .receipt-meta-card span {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #8a6d4d;
            margin-bottom: 6px;
        }
        .receipt-meta-card strong {
            font-size: 15px;
            color: #2b1d0e;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .receipt-table th,
        .receipt-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee3d5;
            text-align: left;
            vertical-align: top;
            font-size: 14px;
        }
        .receipt-table th {
            background: #f8f2ea;
            color: #6b4a28;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .receipt-note {
            margin-top: 4px;
            font-size: 12px;
            color: #7a6856;
        }
        .receipt-summary {
            margin-top: 24px;
            margin-left: auto;
            width: min(320px, 100%);
            border: 1px solid #eadcc9;
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
        }
        .receipt-summary-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 16px;
            border-bottom: 1px solid #eee3d5;
        }
        .receipt-summary-row:last-child {
            border-bottom: none;
            background: #2b1d0e;
            color: #fff;
            font-weight: 700;
        }
        .receipt-footer {
            margin-top: 24px;
            padding-top: 18px;
            border-top: 1px dashed #d8c6ae;
            color: #7a6856;
            font-size: 13px;
            line-height: 1.6;
        }
        .receipt-actions {
            max-width: 820px;
            margin: 18px auto 0;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .receipt-actions button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            font-weight: 700;
            cursor: pointer;
        }
        .receipt-actions .primary {
            background: #2b1d0e;
            color: #fff;
        }
        .receipt-actions .secondary {
            background: #e8dccd;
            color: #4c3620;
        }
        @media print {
            body {
                padding: 0;
                background: #fff;
            }
            .receipt-sheet {
                max-width: none;
                border: none;
                border-radius: 0;
                box-shadow: none;
            }
            .receipt-actions {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-sheet">
        <div class="receipt-header">
            <h1>${escapeHtml(order?.cafe?.name || "Digital Cafe")}</h1>
            <p>Customer Order Receipt</p>
        </div>
        <div class="receipt-body">
            <div class="receipt-meta">
                <div class="receipt-meta-card"><span>Order Number</span><strong>${escapeHtml(order?.orderNumber || "-")}</strong></div>
                <div class="receipt-meta-card"><span>Order Date</span><strong>${escapeHtml(order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-")}</strong></div>
                <div class="receipt-meta-card"><span>Customer</span><strong>${escapeHtml(order?.customer?.username || "Customer")}</strong></div>
                <div class="receipt-meta-card"><span>Payment Status</span><strong>${escapeHtml(getPaymentStatus(order))}</strong></div>
                <div class="receipt-meta-card"><span>Order Status</span><strong>${escapeHtml(order?.status || "-")}</strong></div>
                <div class="receipt-meta-card"><span>Table</span><strong>${escapeHtml(order?.cafeTable?.tableNumber || "Not assigned")}</strong></div>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || `<tr><td colspan="5">No items found for this order.</td></tr>`}
                </tbody>
            </table>

            <div class="receipt-summary">
                <div class="receipt-summary-row">
                    <span>Items</span>
                    <strong>${items.length}</strong>
                </div>
                <div class="receipt-summary-row">
                    <span>Payment Method</span>
                    <strong>${escapeHtml(order?.paymentProvider || "Counter / Pending")}</strong>
                </div>
                <div class="receipt-summary-row">
                    <span>Total</span>
                    <strong>${escapeHtml(formatRupees(order?.totalAmount || 0))}</strong>
                </div>
            </div>

            <div class="receipt-footer">
                <div>Thank you for your order.</div>
                ${order?.seatingPreference ? `<div>Seating preference: ${escapeHtml(order.seatingPreference)}</div>` : ""}
                ${order?.seatingNotes ? `<div>Notes: ${escapeHtml(order.seatingNotes)}</div>` : ""}
            </div>
        </div>
    </div>

    <div class="receipt-actions">
        <button class="secondary" onclick="window.close()">Close</button>
        <button class="primary" onclick="window.print()">Print / Save PDF</button>
    </div>
</body>
</html>`;
}

function openReceiptBill(order) {
    const receiptWindow = window.open("", "_blank", "width=900,height=900");
    if (!receiptWindow) {
        window.alert("Unable to open the receipt window. Please allow pop-ups and try again.");
        return;
    }
    receiptWindow.document.open();
    receiptWindow.document.write(buildReceiptHtml(order));
    receiptWindow.document.close();
    receiptWindow.focus();
}

export default function CustomerOrdersPanel({
    orders,
    loading,
    workingOrderId,
    onPay,
    onCancel,
}) {
    const [selectedOrder, setSelectedOrder] = useState(null);

    const canPay = (order) => ["PENDING", "CONFIRMED"].includes(order?.status);
    const canCancel = (order) => ["PENDING", "CONFIRMED"].includes(order?.status);
    const canViewReceipt = (order) => ["PAID", "CANCELLED", "PREPARING", "READY", "SERVED"].includes(order?.status);

    return (
        <>
            {selectedOrder && (
                <div className="user-receipt-overlay" role="dialog" aria-modal="true">
                    <div className="user-receipt-card user-order-detail-card">
                        <div className="user-receipt-head">
                            <div>
                                <span className="user-receipt-kicker">Order details</span>
                                <h3>Order {selectedOrder.orderNumber}</h3>
                            </div>
                            <button type="button" className="payment-close-btn" onClick={() => setSelectedOrder(null)}>
                                &times;
                            </button>
                        </div>
                        <div className="user-receipt-grid">
                            <div><span>Order ID</span><strong>{selectedOrder.orderNumber}</strong></div>
                            <div><span>Payment status</span><strong>{getPaymentStatus(selectedOrder)}</strong></div>
                            <div><span>Cafe</span><strong>{selectedOrder?.cafe?.name || "Not available"}</strong></div>
                            <div><span>Table</span><strong>{selectedOrder?.cafeTable?.tableNumber || "Not assigned"}</strong></div>
                            <div><span>Order status</span><strong>{selectedOrder.status}</strong></div>
                            <div><span>Bill total</span><strong>{formatRupees(selectedOrder.totalAmount || 0)}</strong></div>
                        </div>
                        <div className="user-receipt-items">
                            <div className="user-order-detail-header">
                                <strong>Bill details</strong>
                            </div>
                            {(selectedOrder.items || []).map((item) => (
                                <div key={item.id || `${item.menuItem?.id}-${item.quantity}`} className="user-receipt-line">
                                    <span>{item.quantity}x {item.menuItem?.name || "Item"}</span>
                                    <strong>{formatRupees(getLineTotal(item))}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="user-receipt-actions">
                            <button
                                type="button"
                                className="payment-secondary-btn"
                                onClick={() => openReceiptBill(selectedOrder)}
                            >
                                Print bill / Save PDF
                            </button>
                            <button type="button" className="menu-btn-place" onClick={() => setSelectedOrder(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="chart-container owner-orders-table customer-orders-table">
                <div className="owner-orders-table-header">
                    <div>
                        <p className="owner-orders-table-eyebrow">Order overview</p>
                        <h3>My orders</h3>
                    </div>
                    <span className="owner-orders-table-count">
                        {loading ? "Loading..." : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
                    </span>
                </div>
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr><th>Order #</th><th>Status</th><th>Total</th><th>Created</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5}>Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={5}>No orders yet.</td></tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="user-order-row" onClick={() => setSelectedOrder(order)}>
                                        <td>{order.orderNumber}</td>
                                        <td>
                                            <span className={`owner-order-status-badge owner-order-status-${String(order.status || "unknown").toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{order.totalAmount != null ? formatRupees(order.totalAmount) : "-"}</td>
                                        <td>{formatOrderDateTime(order.createdAt)}</td>
                                        <td>
                                            <div className="user-order-actions" onClick={(event) => event.stopPropagation()}>
                                                {canPay(order) && (
                                                    <button
                                                        type="button"
                                                        className="user-order-pay"
                                                        onClick={() => onPay(order)}
                                                        disabled={workingOrderId === order.id}
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                                {canCancel(order) && (
                                                    <button
                                                        type="button"
                                                        className="user-order-cancel"
                                                        onClick={() => onCancel(order.id)}
                                                        disabled={workingOrderId === order.id}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {canViewReceipt(order) && (
                                                    <button
                                                        type="button"
                                                        className="user-order-receipt"
                                                        onClick={() => openReceiptBill(order)}
                                                    >
                                                        Receipt
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

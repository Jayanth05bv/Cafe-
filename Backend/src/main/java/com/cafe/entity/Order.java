package com.cafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    @JsonIgnoreProperties({"tables", "menuItems", "staff", "bankAccount", "bankAccountHolder", "bankName", "bankAccountNumber", "bankIfscCode", "revenue"})
    private Cafe cafe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    @JsonIgnoreProperties({"cafe"})
    private CafeTable cafeTable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"password", "profile", "cafe", "roles", "ownerAssignmentAccepted", "enabled"})
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waiter_id")
    @JsonIgnoreProperties({"password", "profile", "cafe", "roles", "ownerAssignmentAccepted", "enabled"})
    private User waiter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prepared_by_id")
    @JsonIgnoreProperties({"password", "profile", "cafe", "roles", "ownerAssignmentAccepted", "enabled"})
    private User preparedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "served_by_id")
    @JsonIgnoreProperties({"password", "profile", "cafe", "roles", "ownerAssignmentAccepted", "enabled"})
    private User servedBy;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    private LocalDate reservationDate;
    private String reservationTimeSlot;
    private Integer guestCount;
    private String seatingPreference;
    private String seatingNotes;
    private String paymentProvider;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    @Column(length = 512)
    private String razorpaySignature;

    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paymentCapturedAt;

    public Order() {}

    public enum OrderStatus {
        PENDING, CONFIRMED, PAID, PREPARING, READY, SERVED, CANCELLED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Cafe getCafe() { return cafe; }
    public void setCafe(Cafe cafe) { this.cafe = cafe; }
    public CafeTable getCafeTable() { return cafeTable; }
    public void setCafeTable(CafeTable cafeTable) { this.cafeTable = cafeTable; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public User getWaiter() { return waiter; }
    public void setWaiter(User waiter) { this.waiter = waiter; }
    public User getPreparedBy() { return preparedBy; }
    public void setPreparedBy(User preparedBy) { this.preparedBy = preparedBy; }
    public User getServedBy() { return servedBy; }
    public void setServedBy(User servedBy) { this.servedBy = servedBy; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public LocalDate getReservationDate() { return reservationDate; }
    public void setReservationDate(LocalDate reservationDate) { this.reservationDate = reservationDate; }
    public String getReservationTimeSlot() { return reservationTimeSlot; }
    public void setReservationTimeSlot(String reservationTimeSlot) { this.reservationTimeSlot = reservationTimeSlot; }
    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
    public String getSeatingPreference() { return seatingPreference; }
    public void setSeatingPreference(String seatingPreference) { this.seatingPreference = seatingPreference; }
    public String getSeatingNotes() { return seatingNotes; }
    public void setSeatingNotes(String seatingNotes) { this.seatingNotes = seatingNotes; }
    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getPaymentCapturedAt() { return paymentCapturedAt; }
    public void setPaymentCapturedAt(LocalDateTime paymentCapturedAt) { this.paymentCapturedAt = paymentCapturedAt; }
}

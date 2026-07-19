package com.cafe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public class OrderRequest {

    @NotNull(message = "Cafe ID is required")
    private Long cafeId;

    private Long tableId;
    private Long customerId;
    private Long waiterId;
    private LocalDate reservationDate;
    private String reservationTimeSlot;
    @Positive(message = "Guest count must be greater than 0")
    private Integer guestCount;
    private String seatingPreference;
    private String seatingNotes;

    @Valid
    @NotNull(message = "Order items are required")
    private List<OrderItemRequest> items;

    public OrderRequest() {}

    public Long getCafeId() { return cafeId; }
    public void setCafeId(Long cafeId) { this.cafeId = cafeId; }
    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getWaiterId() { return waiterId; }
    public void setWaiterId(Long waiterId) { this.waiterId = waiterId; }
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
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    public static class OrderItemRequest {
        @NotNull
        private Long menuId;
        @Positive
        private Integer quantity = 1;
        private String specialInstructions;

        public OrderItemRequest() {}

        public Long getMenuId() { return menuId; }
        public void setMenuId(Long menuId) { this.menuId = menuId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    }
}

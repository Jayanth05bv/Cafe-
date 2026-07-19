package com.cafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cafes")
public class Cafe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;
    private String phone;
    private String description;
    private String logoUrl;
    /** Comma-separated image URLs for quick gallery rendering. */
    @Column(length = 4000)
    private String imageUrls;

    /** Bank account identifier or details for this cafe */
    private String bankAccount;
    private String bankAccountHolder;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;

    /** Revenue amount (e.g. total or period revenue) */
    private java.math.BigDecimal revenue;

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<CafeTable> tables = new ArrayList<>();

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Menu> menuItems = new ArrayList<>();

    @OneToMany(mappedBy = "cafe")
    @JsonIgnore
    private List<User> staff = new ArrayList<>();

    public Cafe() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getImageUrls() { return imageUrls; }
    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
    public String getBankAccount() { return bankAccount; }
    public void setBankAccount(String bankAccount) { this.bankAccount = bankAccount; }
    public String getBankAccountHolder() { return bankAccountHolder; }
    public void setBankAccountHolder(String bankAccountHolder) { this.bankAccountHolder = bankAccountHolder; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public String getBankIfscCode() { return bankIfscCode; }
    public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }
    public java.math.BigDecimal getRevenue() { return revenue; }
    public void setRevenue(java.math.BigDecimal revenue) { this.revenue = revenue; }
    public List<CafeTable> getTables() { return tables; }
    public void setTables(List<CafeTable> tables) { this.tables = tables; }
    public List<Menu> getMenuItems() { return menuItems; }
    public void setMenuItems(List<Menu> menuItems) { this.menuItems = menuItems; }
    public List<User> getStaff() { return staff; }
    public void setStaff(List<User> staff) { this.staff = staff; }
}

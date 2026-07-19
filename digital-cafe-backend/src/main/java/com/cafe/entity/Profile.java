package com.cafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String gender;
    private String maritalStatus;
    private String instituteName;
    private String degree;
    private String passingYear;
    private String grade;
    private String percentage;
    private String streetAddress;
    private String plotNo;
    private String city;
    private String state;
    private String pincode;
    private String address;
    private String companyName;
    private String workLocation;
    private LocalDate startDate;
    private LocalDate endDate;
    private String compensationPackage;
    private String workExperience;
    private String identificationFileName;
    private String profileImageUrl;
    @Column(length = 4000)
    private String additionalDetails;

    @OneToOne(mappedBy = "profile")
    @JsonIgnore
    private User user;

    public Profile() {}

    public Profile(Long id, String firstName, String lastName, String fullName, String phone, String gender,
                   String maritalStatus, String instituteName, String degree, String passingYear, String grade,
                   String percentage, String streetAddress, String plotNo, String city, String state, String pincode,
                   String address, String companyName, String workLocation, LocalDate startDate, LocalDate endDate,
                   String compensationPackage, String workExperience, String identificationFileName,
                   String additionalDetails, User user) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = fullName;
        this.phone = phone;
        this.gender = gender;
        this.maritalStatus = maritalStatus;
        this.instituteName = instituteName;
        this.degree = degree;
        this.passingYear = passingYear;
        this.grade = grade;
        this.percentage = percentage;
        this.streetAddress = streetAddress;
        this.plotNo = plotNo;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
        this.address = address;
        this.companyName = companyName;
        this.workLocation = workLocation;
        this.startDate = startDate;
        this.endDate = endDate;
        this.compensationPackage = compensationPackage;
        this.workExperience = workExperience;
        this.identificationFileName = identificationFileName;
        this.additionalDetails = additionalDetails;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }
    public String getInstituteName() { return instituteName; }
    public void setInstituteName(String instituteName) { this.instituteName = instituteName; }
    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }
    public String getPassingYear() { return passingYear; }
    public void setPassingYear(String passingYear) { this.passingYear = passingYear; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getPercentage() { return percentage; }
    public void setPercentage(String percentage) { this.percentage = percentage; }
    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }
    public String getPlotNo() { return plotNo; }
    public void setPlotNo(String plotNo) { this.plotNo = plotNo; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getCompensationPackage() { return compensationPackage; }
    public void setCompensationPackage(String compensationPackage) { this.compensationPackage = compensationPackage; }
    public String getWorkExperience() { return workExperience; }
    public void setWorkExperience(String workExperience) { this.workExperience = workExperience; }
    public String getIdentificationFileName() { return identificationFileName; }
    public void setIdentificationFileName(String identificationFileName) { this.identificationFileName = identificationFileName; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public String getAdditionalDetails() { return additionalDetails; }
    public void setAdditionalDetails(String additionalDetails) { this.additionalDetails = additionalDetails; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}

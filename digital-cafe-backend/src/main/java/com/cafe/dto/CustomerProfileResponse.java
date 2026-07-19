package com.cafe.dto;

import com.cafe.entity.Profile;
import com.cafe.entity.User;

import java.time.LocalDate;

public class CustomerProfileResponse {

    private Long id;
    private String username;
    private String email;
    private Long cafeId;
    private String cafeName;
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
    private String additionalDetails;

    public static CustomerProfileResponse from(User user) {
        CustomerProfileResponse response = new CustomerProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        if (user.getCafe() != null) {
            response.setCafeId(user.getCafe().getId());
            response.setCafeName(user.getCafe().getName());
        }
        Profile profile = user.getProfile();
        if (profile != null) {
            response.setFirstName(profile.getFirstName());
            response.setLastName(profile.getLastName());
            response.setFullName(profile.getFullName());
            response.setPhone(profile.getPhone());
            response.setGender(profile.getGender());
            response.setMaritalStatus(profile.getMaritalStatus());
            response.setInstituteName(profile.getInstituteName());
            response.setDegree(profile.getDegree());
            response.setPassingYear(profile.getPassingYear());
            response.setGrade(profile.getGrade());
            response.setPercentage(profile.getPercentage());
            response.setStreetAddress(profile.getStreetAddress());
            response.setPlotNo(profile.getPlotNo());
            response.setCity(profile.getCity());
            response.setState(profile.getState());
            response.setPincode(profile.getPincode());
            response.setAddress(profile.getAddress());
            response.setCompanyName(profile.getCompanyName());
            response.setWorkLocation(profile.getWorkLocation());
            response.setStartDate(profile.getStartDate());
            response.setEndDate(profile.getEndDate());
            response.setCompensationPackage(profile.getCompensationPackage());
            response.setWorkExperience(profile.getWorkExperience());
            response.setIdentificationFileName(profile.getIdentificationFileName());
            response.setAdditionalDetails(profile.getAdditionalDetails());
        }
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getCafeId() { return cafeId; }
    public void setCafeId(Long cafeId) { this.cafeId = cafeId; }
    public String getCafeName() { return cafeName; }
    public void setCafeName(String cafeName) { this.cafeName = cafeName; }
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
    public String getAdditionalDetails() { return additionalDetails; }
    public void setAdditionalDetails(String additionalDetails) { this.additionalDetails = additionalDetails; }
}

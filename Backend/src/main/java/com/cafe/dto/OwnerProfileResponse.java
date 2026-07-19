package com.cafe.dto;

import com.cafe.entity.Profile;
import com.cafe.entity.User;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OwnerProfileResponse {

    private Long id;
    private String username;
    private String email;
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
    private String companyName;
    private String workLocation;
    private String startDate;
    private String endDate;
    private String compensationPackage;
    private String identificationFileName;
    private String profileImageUrl;
    private boolean ownerAssignmentAccepted;
    private CafeSummary cafe;
    private List<CafeSummary> cafes;

    public static OwnerProfileResponse from(User user) {
        OwnerProfileResponse response = new OwnerProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        if (user.getProfile() != null) {
            Profile profile = user.getProfile();
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
            response.setCompanyName(profile.getCompanyName());
            response.setWorkLocation(profile.getWorkLocation());
            response.setStartDate(profile.getStartDate() != null ? profile.getStartDate().toString() : null);
            response.setEndDate(profile.getEndDate() != null ? profile.getEndDate().toString() : null);
            response.setCompensationPackage(profile.getCompensationPackage());
            response.setIdentificationFileName(profile.getIdentificationFileName());
            response.setProfileImageUrl(profile.getProfileImageUrl());
        }
        response.setOwnerAssignmentAccepted(user.isOwnerAssignmentAccepted());
        if (user.getCafe() != null) {
            response.setCafe(new CafeSummary(
                    user.getCafe().getId(),
                    user.getCafe().getName(),
                    user.getCafe().getAddress(),
                    user.getCafe().getPhone(),
                    user.getCafe().getLogoUrl(),
                    user.getCafe().getImageUrls()
            ));
        }
        List<com.cafe.entity.Cafe> accessibleCafes = new ArrayList<>(user.getOwnerCafes());
        if (accessibleCafes.isEmpty() && user.getCafe() != null) {
            accessibleCafes.add(user.getCafe());
        }
        response.setCafes(accessibleCafes.stream()
                .sorted(Comparator.comparing(cafe -> String.valueOf(cafe.getName()), String.CASE_INSENSITIVE_ORDER))
                .map(CafeSummary::new)
                .toList());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
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
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getCompensationPackage() { return compensationPackage; }
    public void setCompensationPackage(String compensationPackage) { this.compensationPackage = compensationPackage; }
    public String getIdentificationFileName() { return identificationFileName; }
    public void setIdentificationFileName(String identificationFileName) { this.identificationFileName = identificationFileName; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public boolean isOwnerAssignmentAccepted() { return ownerAssignmentAccepted; }
    public void setOwnerAssignmentAccepted(boolean ownerAssignmentAccepted) { this.ownerAssignmentAccepted = ownerAssignmentAccepted; }
    public CafeSummary getCafe() { return cafe; }
    public void setCafe(CafeSummary cafe) { this.cafe = cafe; }
    public List<CafeSummary> getCafes() { return cafes; }
    public void setCafes(List<CafeSummary> cafes) { this.cafes = cafes; }

    public record CafeSummary(Long id, String name, String address, String phone, String logoUrl, String imageUrls) {
        public CafeSummary(com.cafe.entity.Cafe cafe) {
            this(cafe.getId(), cafe.getName(), cafe.getAddress(), cafe.getPhone(), cafe.getLogoUrl(), cafe.getImageUrls());
        }
    }
}

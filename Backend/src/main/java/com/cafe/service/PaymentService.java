package com.cafe.service;

import com.cafe.dto.RazorpayOrderResponse;
import com.cafe.dto.RazorpayVerificationRequest;
import com.cafe.entity.Order;
import com.cafe.entity.Profile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PaymentService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.razorpay.enabled:false}")
    private boolean enabled;

    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    @Value("${app.razorpay.currency:INR}")
    private String currency;

    @Value("${app.razorpay.checkout-name:Digital Cafe}")
    private String checkoutName;

    public PaymentService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public RazorpayOrderResponse createRazorpayOrder(Order order) {
        ensureConfigured();
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Order total amount must be greater than zero");
        }

        try {
            long amountInSmallestUnit = order.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, java.math.RoundingMode.HALF_UP)
                    .longValueExact();
            String body = objectMapper.writeValueAsString(new RazorpayOrderPayload(
                    amountInSmallestUnit,
                    currency,
                    order.getOrderNumber(),
                    new RazorpayNotes(String.valueOf(order.getId()), order.getOrderNumber())
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8)))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException(extractErrorMessage(response.body(), "Failed to create Razorpay order"));
            }

            JsonNode node = objectMapper.readTree(response.body());
            RazorpayOrderResponse result = new RazorpayOrderResponse();
            result.setKeyId(keyId);
            result.setRazorpayOrderId(node.path("id").asText());
            result.setAmount(node.path("amount").asLong());
            result.setCurrency(node.path("currency").asText(currency));
            result.setName(checkoutName);
            result.setDescription("Payment for order " + order.getOrderNumber());
            result.setCustomerName(resolveCustomerName(order));
            result.setCustomerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null);
            result.setCustomerContact(resolveCustomerPhone(order));
            return result;
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to create Razorpay order", ex);
        }
    }

    public void verifyPaymentSignature(Order order, RazorpayVerificationRequest request) {
        ensureConfigured();
        if (!request.getRazorpayOrderId().equals(order.getRazorpayOrderId())) {
            throw new IllegalArgumentException("Razorpay order id does not match this order");
        }
        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        String expectedSignature = hmacSha256(payload, keySecret);
        if (!expectedSignature.equals(request.getRazorpaySignature())) {
            throw new IllegalArgumentException("Invalid Razorpay payment signature");
        }
    }

    public boolean isConfigured() {
        return enabled && !isBlank(keyId) && !isBlank(keySecret);
    }

    public String getCheckoutName() {
        return checkoutName;
    }

    public String getCurrency() {
        return currency;
    }

    public void ensureConfigured() {
        if (!isConfigured()) {
            throw new IllegalArgumentException("Razorpay is not configured. Set RAZORPAY_ENABLED, RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
    }

    public void attachRazorpayOrder(Order order, RazorpayOrderResponse response) {
        order.setRazorpayOrderId(response.getRazorpayOrderId());
        order.setPaymentProvider("RAZORPAY");
    }

    public void attachSuccessfulPayment(Order order, RazorpayVerificationRequest request) {
        order.setRazorpayPaymentId(request.getRazorpayPaymentId());
        order.setRazorpaySignature(request.getRazorpaySignature());
        order.setPaymentCapturedAt(LocalDateTime.now());
        order.setPaymentProvider("RAZORPAY");
    }

    private String resolveCustomerName(Order order) {
        if (order.getCustomer() == null) return "Customer";
        Profile profile = order.getCustomer().getProfile();
        if (profile != null && !isBlank(profile.getFullName())) {
            return profile.getFullName();
        }
        if (!isBlank(order.getCustomer().getUsername())) {
            return order.getCustomer().getUsername();
        }
        return "Customer";
    }

    private String resolveCustomerPhone(Order order) {
        if (order.getCustomer() == null || order.getCustomer().getProfile() == null) return null;
        return order.getCustomer().getProfile().getPhone();
    }

    private String extractErrorMessage(String body, String fallback) {
        try {
            JsonNode node = objectMapper.readTree(body);
            JsonNode error = node.path("error");
            if (error.hasNonNull("description")) {
                return error.get("description").asText();
            }
        } catch (Exception ignored) {
            // Fall back to generic message.
        }
        return fallback;
    }

    private String hmacSha256(String payload, String secret) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to verify payment signature", ex);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record RazorpayOrderPayload(long amount, String currency, String receipt, RazorpayNotes notes) {}

    private record RazorpayNotes(String orderId, String orderNumber) {}
}

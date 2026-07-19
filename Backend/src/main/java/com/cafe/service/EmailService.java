package com.cafe.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@digitalcafe.local}")
    private String fromAddress;

    @Autowired(required = false)
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private boolean canSend() {
        return mailEnabled && mailSender != null;
    }

    public boolean sendRegistrationConfirmation(String toEmail, String username, String confirmationLink) {
        if (!canSend() || toEmail == null || toEmail.isBlank()) {
            log.debug("Mail disabled or not configured; skipping registration confirmation to {}", toEmail);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress != null ? fromAddress : "noreply@digitalcafe.local");
            helper.setTo(toEmail);
            helper.setSubject("Confirm your Digital Cafe registration");
            String linkHtml = confirmationLink != null && !confirmationLink.isBlank()
                    ? "<p><a href=\"" + escapeHtml(confirmationLink) + "\" style=\"display:inline-block;padding:12px 24px;background:#6f4e37;color:#fff;text-decoration:none;border-radius:8px;\">Confirm registration</a></p>"
                    : "";
            helper.setText(
                    "<h2>Confirm your registration</h2>" +
                    "<p>Hi <strong>" + escapeHtml(username) + "</strong>,</p>" +
                    "<p>Please confirm your registration by clicking the link below. You will then be able to log in.</p>" +
                    linkHtml +
                    "<p>If you didn't register, you can ignore this email.</p>" +
                    "<p>— Digital Cafe Team</p>",
                    true
            );
            mailSender.send(message);
            log.info("Registration confirmation email sent to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.warn("Failed to send registration confirmation to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Unexpected error sending registration confirmation to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendLoginConfirmation(String toEmail, String username, String confirmationLink) {
        if (!canSend() || toEmail == null || toEmail.isBlank()) {
            log.debug("Mail disabled or not configured; skipping login confirmation to {}", toEmail);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress != null ? fromAddress : "noreply@digitalcafe.local");
            helper.setTo(toEmail);
            helper.setSubject("Confirm your login – Digital Cafe");
            String linkHtml = confirmationLink != null && !confirmationLink.isBlank()
                    ? "<p><a href=\"" + escapeHtml(confirmationLink) + "\" style=\"display:inline-block;padding:12px 24px;background:#6f4e37;color:#fff;text-decoration:none;border-radius:8px;\">Confirm login</a></p>"
                    : "";
            helper.setText(
                    "<h2>Confirm your login</h2>" +
                    "<p>Hi <strong>" + escapeHtml(username) + "</strong>,</p>" +
                    "<p>You requested to log in. Please click the link below to complete sign-in. You will be redirected to the home page.</p>" +
                    linkHtml +
                    "<p>If this wasn't you, please secure your account and ignore this email.</p>" +
                    "<p>— Digital Cafe Team</p>",
                    true
            );
            mailSender.send(message);
            log.info("Login confirmation email sent to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.warn("Failed to send login confirmation to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Unexpected error sending login confirmation to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendPasswordReset(String toEmail, String username, String resetLink) {
        if (!canSend() || toEmail == null || toEmail.isBlank()) {
            log.debug("Mail disabled or not configured; skipping password reset to {}", toEmail);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress != null ? fromAddress : "noreply@digitalcafe.local");
            helper.setTo(toEmail);
            helper.setSubject("Reset your password – Digital Cafe");
            String linkHtml = resetLink != null && !resetLink.isBlank()
                    ? "<p><a href=\"" + escapeHtml(resetLink) + "\" style=\"display:inline-block;padding:12px 24px;background:#6f4e37;color:#fff;text-decoration:none;border-radius:8px;\">Reset password</a></p>"
                    : "";
            helper.setText(
                    "<h2>Reset your password</h2>" +
                    "<p>Hi <strong>" + escapeHtml(username) + "</strong>,</p>" +
                    "<p>You requested a password reset. Click the link below to set a new password. The link expires in 1 hour.</p>" +
                    linkHtml +
                    "<p>If you didn't request this, you can ignore this email. Your password will not change.</p>" +
                    "<p>— Digital Cafe Team</p>",
                    true
            );
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.warn("Failed to send password reset to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Unexpected error sending password reset to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    /** Sent when owner creates a chef or waiter account. */
    public boolean sendStaffWelcome(String toEmail, String username, String roleName, String loginUrl) {
        if (!canSend() || toEmail == null || toEmail.isBlank()) {
            log.info("Staff welcome (mail disabled or not configured): {} -> {} (role: {}). Login at {}", toEmail, username, roleName, loginUrl);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress != null ? fromAddress : "noreply@digitalcafe.local");
            helper.setTo(toEmail);
            helper.setSubject("Your Bean To Cup " + escapeHtml(roleName) + " account");
            String linkHtml = loginUrl != null && !loginUrl.isBlank()
                    ? "<p><a href=\"" + escapeHtml(loginUrl) + "\" style=\"display:inline-block;padding:12px 24px;background:#6f4e37;color:#fff;text-decoration:none;border-radius:8px;\">Log in</a></p>"
                    : "";
            helper.setText(
                    "<h2>Your account has been created</h2>" +
                    "<p>Hi <strong>" + escapeHtml(username) + "</strong>,</p>" +
                    "<p>You have been registered as a <strong>" + escapeHtml(roleName) + "</strong> on Bean To Cup. This email was sent to the address you were registered with.</p>" +
                    "<p>You can log in with the username and password that your manager set for you. Use the link below to open the login page.</p>" +
                    linkHtml +
                    "<p>If you did not expect this email, you can ignore it.</p>" +
                    "<p>— Bean To Cup Team</p>",
                    true
            );
            mailSender.send(message);
            log.info("Staff welcome email sent to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.warn("Failed to send staff welcome to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Unexpected error sending staff welcome to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}

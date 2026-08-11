package com.alzheimer.auth_service.Geofencing;

import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Geofencing.Entities.SafeZone;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Warns the patient's registered relative that they left their safe zone.
 *
 * <p>The message carries a position, a time and a distance — never a diagnosis
 * or a disease stage. A relative needs to know where to go; medical information
 * has no place in an email to a third party.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertMailer {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

    private final JavaMailSender mailSender;

    @Value("${geofencing.mail-from:}")
    private String from;

    public static String googleMapsLink(double latitude, double longitude) {
        return "https://www.google.com/maps/search/?api=1&query=" + latitude + "," + longitude;
    }

    /** Returns null on success, or the reason delivery did not happen. */
    public String sendZoneExit(User patient, SafeZone zone, double latitude, double longitude,
                               double distanceFromCentre, LocalDateTime at) {
        String recipient = patient.getContactUrgenceEmail();
        if (recipient == null || recipient.isBlank()) {
            return "No emergency contact email registered for this patient";
        }

        String patientName = ((patient.getPrenom() == null ? "" : patient.getPrenom()) + " "
                + (patient.getNom() == null ? "" : patient.getNom())).trim();
        int beyond = (int) Math.round(distanceFromCentre - zone.getRadius());

        String body = """
                Bonjour %s,

                %s est sorti(e) de sa zone de sécurité.

                Date et heure : %s
                Position GPS  : %.6f, %.6f
                Distance      : %d m du domicile, soit %d m au-delà de la zone de %d m

                Voir la position sur la carte :
                %s

                Ce message est automatique. Si vous ne parvenez pas à joindre la personne,
                contactez son médecin ou les secours.

                NeuroAssist
                """.formatted(
                patient.getContactUrgenceNom() == null ? "" : patient.getContactUrgenceNom(),
                patientName.isBlank() ? patient.getEmail() : patientName,
                at.format(WHEN),
                latitude, longitude,
                (int) Math.round(distanceFromCentre), beyond, zone.getRadius(),
                googleMapsLink(latitude, longitude));

        if (from == null || from.isBlank()) {
            // No SMTP configured: the alert is still recorded and fully traced, so
            // the feature can be exercised end to end without mail credentials.
            log.warn("Zone-exit alert for {} not emailed (geofencing.mail-from is empty). Body:\n{}",
                    recipient, body);
            return "SMTP not configured (geofencing.mail-from is empty)";
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(recipient);
            message.setSubject("NeuroAssist — " + patientName + " est sorti(e) de sa zone de sécurité");
            message.setText(body);
            mailSender.send(message);
            log.info("Zone-exit alert emailed to {}", recipient);
            return null;
        } catch (Exception e) {
            log.error("Could not email the zone-exit alert to {}: {}", recipient, e.getMessage());
            return e.getClass().getSimpleName() + ": " + e.getMessage();
        }
    }
}

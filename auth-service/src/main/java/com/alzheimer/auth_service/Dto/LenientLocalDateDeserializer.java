package com.alzheimer.auth_service.Dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * Reads a date of birth from either "yyyy-MM-dd" or a full timestamp such as
 * "1950-04-25T00:00:00".
 *
 * <p>Records created before dates of birth were stored as plain dates are still
 * served as timestamps by older clients and caches. Rejecting those made the
 * whole patient update fail with a 400, for a field the doctor had not even
 * touched. The time part carries no meaning here, so it is dropped.
 */
public class LenientLocalDateDeserializer extends JsonDeserializer<LocalDate> {

    @Override
    public LocalDate deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String raw = parser.getText();
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.trim();
        int timeSeparator = text.indexOf('T');
        if (timeSeparator > 0) {
            text = text.substring(0, timeSeparator);
        }
        try {
            return LocalDate.parse(text);
        } catch (DateTimeParseException e) {
            throw new IOException("Expected a date as yyyy-MM-dd, received: " + raw, e);
        }
    }
}

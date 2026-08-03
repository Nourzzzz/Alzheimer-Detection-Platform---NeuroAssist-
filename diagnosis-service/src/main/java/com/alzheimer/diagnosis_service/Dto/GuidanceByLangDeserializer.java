package com.alzheimer.diagnosis_service.Dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Reads patient guidance as either a language map or a single string.
 *
 * <p>The AI service used to return one text and now returns one per language.
 * Insisting on the new shape means that an AI service and a diagnosis service
 * on different versions fail to talk to each other, and because the pipeline
 * swallows that failure the doctor silently gets an assessment with no report
 * at all. Accepting both shapes keeps the two deployable independently.
 */
public class GuidanceByLangDeserializer extends JsonDeserializer<Map<String, String>> {

    private static final String FALLBACK_LANG = "fr";

    @Override
    public Map<String, String> deserialize(JsonParser parser, DeserializationContext context)
            throws IOException {
        Map<String, String> byLang = new HashMap<>();

        if (parser.currentToken() == JsonToken.VALUE_STRING) {
            String text = parser.getText();
            if (text != null && !text.isBlank()) {
                byLang.put(FALLBACK_LANG, text);
            }
            return byLang;
        }

        if (parser.currentToken() == JsonToken.START_OBJECT) {
            while (parser.nextToken() != JsonToken.END_OBJECT) {
                String lang = parser.currentName();
                parser.nextToken();
                String text = parser.getValueAsString();
                if (lang != null && text != null && !text.isBlank()) {
                    byLang.put(lang, text);
                }
            }
        }
        return byLang;
    }
}

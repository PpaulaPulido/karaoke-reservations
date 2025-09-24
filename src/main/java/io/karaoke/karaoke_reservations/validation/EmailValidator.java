package io.karaoke.karaoke_reservations.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class EmailValidator implements ConstraintValidator<ValidEmail, String> {
    
    private static final String EMAIL_PATTERN = 
        "^(?=.{3,}@)[a-zA-Z0-9](?!.*([a-zA-Z0-9])\\1{2,})[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    
    @Override
    public void initialize(ValidEmail constraintAnnotation) {
    }
    
    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        if (!Pattern.matches(EMAIL_PATTERN, email)) {
            return false;
        }
        
        if (hasRepeatedCharacters(email.split("@")[0])) {
            return false;
        }

        return isValidDomain(email.split("@")[1]);
    }
    
    private boolean hasRepeatedCharacters(String localPart) {
        return Pattern.compile("(.)\\1{2,}").matcher(localPart).find();
    }
    
    private boolean isValidDomain(String domain) {
        String[] validDomains = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", 
                                "protonmail.com", "aol.com", "live.com", "yandex.com", "mail.com"};
        
        for (String validDomain : validDomains) {
            if (domain.equals(validDomain)) {
                return true;
            }
        }
        
        return Pattern.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", domain);
    }
}
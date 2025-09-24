package io.karaoke.karaoke_reservations.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = EmailValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEmail {
    String message() default "Email no válido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
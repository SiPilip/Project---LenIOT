package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// FieldErrorDetail matches the standard error details envelope.
type FieldErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorResponse represents the top-level error response envelope.
type ErrorResponse struct {
	Error ErrorPayload `json:"error"`
}

// ErrorPayload holds code, message, and field-level details.
type ErrorPayload struct {
	Code    string             `json:"code"`
	Message string             `json:"message"`
	Details []FieldErrorDetail `json:"details,omitempty"`
}

// Validator wraps go-playground validator instance.
type Validator struct {
	validate *validator.Validate
}

// New creates and configures a new Validator.
func New() *Validator {
	v := validator.New()
	return &Validator{validate: v}
}

// ValidateStruct validates a struct and returns field error details if invalid.
func (v *Validator) ValidateStruct(s interface{}) []FieldErrorDetail {
	err := v.validate.Struct(s)
	if err == nil {
		return nil
	}

	var details []FieldErrorDetail
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			field := toSnakeCase(e.Field())
			msg := formatErrorMessage(field, e.Tag(), e.Param())
			details = append(details, FieldErrorDetail{
				Field:   field,
				Message: msg,
			})
		}
	} else {
		details = append(details, FieldErrorDetail{
			Field:   "general",
			Message: err.Error(),
		})
	}

	return details
}

func formatErrorMessage(field, tag, param string) string {
	switch field {
	case "latitude":
		return "must be between -90 and 90"
	case "longitude":
		return "must be between -180 and 180"
	case "name":
		if tag == "required" {
			return "is required and must be between 1 and 100 characters"
		}
		return "must be between 1 and 100 characters"
	case "type":
		return "must be one of: vehicle, iot_device, facility, other"
	case "status":
		return "must be one of: active, inactive, maintenance"
	case "description":
		return "must not exceed 500 characters"
	default:
		switch tag {
		case "required":
			return fmt.Sprintf("%s is required", field)
		case "min":
			return fmt.Sprintf("must be at least %s characters", param)
		case "max":
			return fmt.Sprintf("must not exceed %s characters", param)
		case "oneof":
			return fmt.Sprintf("must be one of [%s]", param)
		default:
			return fmt.Sprintf("failed validation on %s", tag)
		}
	}
}

func toSnakeCase(str string) string {
	var sb strings.Builder
	for i, r := range str {
		if i > 0 && r >= 'A' && r <= 'Z' {
			sb.WriteRune('_')
		}
		sb.WriteRune(r)
	}
	return strings.ToLower(sb.String())
}

# User Form Specification

## Purpose
Collect user registration data through a secure, swipe-based multi-step transition and display a custom QR code on successful registration.

## Requirements

### Requirement: Multi-Step Swipe Transitions
The user form MUST support page transitions representing step progression with a swipe animation.
- Step 1: Instagram and WhatsApp.
- Step 2: Email and Date of Birth.
- Step 3: Location and Referral Source.

#### Scenario: Step Progression
- GIVEN a user is on Step 1
- WHEN they enter valid Instagram and WhatsApp inputs and click "continuar"
- THEN the form transitions to Step 2 with a fluid horizontal swipe animation.

### Requirement: Database Integrity and Uniqueness
The system MUST reject registrations where `email`, `instagram`, or the generated `qrToken` already exists.

#### Scenario: Duplicate Email Rejection
- GIVEN a user submits the form with an email that is already registered
- WHEN the form is sent
- THEN the backend MUST reject it and the frontend MUST show a duplicate email validation warning.

### Requirement: QR Code Generation
The system MUST generate a secure UUID token on the backend and render it as a QR code on the frontend.

#### Scenario: Secure QR Code Render
- GIVEN a user successfully submits the form
- WHEN the backend returns a secure `qrToken`
- THEN the frontend MUST render the QR code using the token and display it on the success step.

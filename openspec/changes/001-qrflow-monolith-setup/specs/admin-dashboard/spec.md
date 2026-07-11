# Admin Dashboard Specification

## Purpose
View all form registrations, access generated contact links, and trigger custom QR emails.

## Requirements

### Requirement: User Record Table
The admin dashboard MUST display a list of all registered users with their details.

#### Scenario: Display Records
- GIVEN an admin is authenticated
- WHEN they access the dashboard `/admin`
- THEN the system MUST render a table containing Instagram, WhatsApp, Email, Date of Birth, Location, and Referral Source.

### Requirement: Dynamic Action Links
The system MUST generate direct clickable links for Instagram and WhatsApp.

#### Scenario: WhatsApp Link Generation
- GIVEN a user record with phone number `3074504264` and country code `+54`
- WHEN the admin views the table
- THEN the WhatsApp field MUST render a link pointing to `https://wa.me/543074504264`.

### Requirement: QR Email Dispatch
The system MUST support sending a dark-themed Spotify-styled HTML email containing the user's QR code.

#### Scenario: Dispatch Email
- GIVEN the admin clicks "Enviar Mail" for a user
- WHEN the server processes the dispatch
- THEN the system MUST send an HTML email styled with Spotify dark theme containing the embedded QR code.

# Automobile Digital Platform — Architecture

## High-Level

```text
Browser
  |
React 19 + TypeScript + Vite
  |
Nginx :3000
  |
API Gateway :8080
  |
  +-- Customer :8081
  +-- Order :8082
  +-- Dealer :8083
  +-- Vehicle :8084
  +-- Permission :8091
  +-- User/Role :8092
  +-- Appointment :8100
  +-- Eureka :8761
```

Each domain service uses PostgreSQL.

## Identity

Login:

```text
POST /api/auth/login
```

Authenticated requests:

```text
Authorization: Bearer <JWT>
```

Critical distinction:

```text
userId != dealerId
```

Dealer context must be resolved from the authenticated dealer rather than assuming IDs match.

## Domain Relationships

```text
User
 ├── Role
 ├── Customer
 │    ├── Orders
 │    └── Appointments
 └── Dealer
      ├── Vehicles
      ├── Orders
      └── Appointments

Vehicle -> Dealer
Order -> Customer + Dealer + Vehicle
Appointment -> Customer + Dealer
```

The exact entity fields and foreign keys must be taken from current source/schema.

## Security Boundaries

### Customer

Customer resources are restricted to the authenticated customer where applicable.

### Dealer

Dealer resources are restricted to the authenticated dealer.

Cross-dealer access has already been tested and blocked.

### Admin

Admin is the global management role. Admin authorization must be enforced by the backend.

## Gateway

The gateway is the public API entry point. Changes to routing/security require regression testing for all roles.

## Service-to-Service Calls

Authenticated security context may need to propagate through Feign/service calls. Existing Dealer order-status functionality depends on correct context propagation. Do not remove it during refactoring.

## Frontend

Role-specific flows conceptually:

```text
Authenticated User
   +-- CUSTOMER
   +-- DEALER
   +-- ADMIN
```

Admin should reuse existing authentication and shared UI infrastructure.

## Docker

Normal startup:

```bash
docker compose up -d --build
```

## Regression Principle

Any shared modification must verify:

- Customer login
- Customer catalog
- Customer purchase
- Customer orders
- Customer appointments
- Customer profile
- all five Dealer logins
- Dealer inventory
- Dealer orders
- Dealer customers
- Dealer appointments
- Dealer profile
- Dealer isolation

## Production Hardening Later

Current application-level verification is not the same as full internet-production hardening.

Later hardening includes secret management, JWT key management, service-to-service trust, HTTPS/TLS, production DB credentials, CORS, rate limiting, audit logging, observability, container security and secret rotation.

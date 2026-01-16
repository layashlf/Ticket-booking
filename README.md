# Concert Ticket Booking System

## Overview

This repository contains a full stack concert ticket booking system.

The application allows users to view ticket availability for multiple ticket tiers and place booking requests. The backend is designed to handle concurrent requests safely without overselling tickets, even when multiple users attempt to book the same tier at the same time.

**The system consists of three main parts:**

- A backend API built with Node.js, TypeScript, Express, Prisma, and PostgreSQL

- A frontend user interface built with React, TypeScript, and Tailwind CSS

- A Docker based setup for running the system locally in a reproducible way

## Repository Structure

```text
root/
├── backend/                # Node.js + TypeScript API
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── controllers/    # Request handling and input validation
│   │   ├── services/       # Core business logic and transaction management
│   │   ├── routes/
│   │   ├── types.ts        # API endpoint definitions
│   │   └── apps.ts         # Server entry point
│   └── Dockerfile/scripts  # Backend containerization and scripts
├── frontend/               # React + TypeScript UI
│   ├── app/
│   │   ├── api/            # UI elements (Booking form, Ticket list)
│   │   ├── routes/         # API fetching logic
│   │   ├── TicketBooking/  # Ticket booking component
│   │   ├── root.tsx        # Main application component
│   │   ├── routes.ts
│   │   └── types.ts
│   └── Dockerfile          # Frontend containerization
├── start.sh                # Automation script for local setup
└── README.md
```

This repository is structured as a monorepo. Both frontend and backend live in the same repository but are clearly separated by folders.

**Why a monorepo?**

For a project of this size, a monorepo keeps setup and review simple. Users can clone a single repository, read one README, and run the entire system locally. Separation of concerns is still preserved at the folder level, without introducing the overhead of managing multiple repositories.

## Backend Design Decisions

### Technology Choices

| Area                | Choice     | Explanation                                                         |
| ------------------- | ---------- | ------------------------------------------------------------------- |
| Runtime             | Node.js 20 | A stable long term supported version suitable for production use    |
| Language            | TypeScript | Helps catch errors early and makes data flow easier to reason about |
| Framework           | Express    | Minimal and explicit request handling                               |
| ORM                 | Prisma     | Type safety, migrations, and transaction support                    |
| Database            | PostgreSQL | Strong transactional guarantees and predictable locking behavior    |
| Runtime Environment | Docker     | Ensures consistent local execution                                  |

The backend is intentionally kept simple. Express is used instead of a heavier framework to make request handling and control flow easy to follow during review.

---

## Database and Concurrency Handling

### Problem Being Solved

The main technical challenge addressed in this assignment is preventing overselling tickets when multiple booking requests happen at the same time.

If two requests read availability at the same moment and both proceed to update it, the system could sell more tickets than exist. This is a classic race condition.

### Chosen Approach

Instead of trying to solve concurrency at the application level, the solution relies on database guarantees provided by PostgreSQL.

The core ideas are:

- All booking logic runs inside a single database transaction

- The inventory row for a ticket tier is explicitly locked during the booking process

- Inventory is reduced only after availability is validated inside the same transaction

### Booking Flow

For each booking request, the backend performs the following steps:

1. Start a database transaction with serializable isolation

2. Lock the inventory row for the requested ticket tier using SELECT ... FOR UPDATE

3. Check if enough tickets are available

4. Create the booking and booking item records

5. Decrease the inventory count

6. Commit the transaction

If any step fails, the entire transaction is rolled back and the database remains unchanged.

This ensures that only one transaction can modify a given ticket tier’s inventory at a time.

### Why SELECT FOR UPDATE is necessary

Prisma does not lock rows when using standard read queries like `findUnique`. Without an explicit lock, two transactions could read the same inventory value before either writes back an update.

Using `SELECT ... FOR UPDATE` forces PostgreSQL to block concurrent transactions until the current one finishes. This guarantees that inventory checks and updates are performed sequentially for the same ticket tier.

This is the main mechanism used to prevent race conditions and double booking.

## Prisma and Migrations

### Migration Strategy

The database schema is defined in schema.prisma, and migrations are generated and committed to the repository.

At runtime, migrations are applied using:

```sh
npx prisma migrate deploy
```

This approach was chosen because it mirrors how schema changes are applied in real production systems.

### Alternatives Considered

- `prisma db push` was not used because it does not keep a history of schema changes.

- `prisma migrate dev` was avoided in Docker because it is designed for interactive development, not automated environments.

The chosen approach makes schema changes explicit and reviewable.

---

## Docker and Runtime Setup

### Backend Container Responsibilities

The backend container is responsible for:

- Installing dependencies

- Generating the Prisma client

- Applying database migrations

- Starting the API server

Build time and runtime responsibilities are kept separate to avoid unnecessary rebuilds and to make container startup predictable.

### Development Focus

The Docker setup is optimized for local development and review:

- Hot reload is enabled for backend development

- The database is reset and seeded in development mode

- All configuration is driven by environment variables

Production concerns such as secrets management and persistent storage are intentionally kept out of scope for this assignment.

---

## Frontend Design Decisions

## Technology Choices

| Area      | Choice       |
| --------- | ------------ |
| Framework | React 18     |
| Language  | TypeScript   |
| Styling   | Tailwind CSS |
| Tooling   | Vite         |

The frontend is kept minimal and functional. It exists to demonstrate interaction with the backend rather than advanced UI behavior.

### Frontend Responsibilities

The frontend handles the following:

- Displaying ticket tiers and availability

- Allowing users to choose quantities

- Submitting booking requests

- Showing success and error feedback

### Request Strategy

Each ticket tier booking is sent as a separate request. This simplifies backend logic and makes concurrency behavior easier to observe and reason about during testing.

---

## API Design

### Available Endpoints

| Method | Endpoint     | Description                       |
| ------ | ------------ | --------------------------------- |
| GET    | /api/tickets | Fetch current ticket availability |
| POST   | /api/book    | Place a booking request           |
| GET    | /health      | Basic health check                |

The API is intentionally small and focused.

## Error Handling

Errors are handled at multiple levels:

- Controllers validate inputs and return appropriate HTTP responses

- Service logic enforces business rules

- Database transactions ensure that partial writes never occur

If a booking fails, inventory is never left in an inconsistent state.

## Non Functional Requirements

### Race Conditions

Race conditions are handled by database transactions and row level locks. Concurrent requests targeting the same ticket tier are serialized by PostgreSQL.

### Double Booking

Double booking is prevented because inventory updates and availability checks happen atomically inside a single transaction.

### Data Consistency

PostgreSQL transactions ensure that either all booking steps succeed or none of them do.

### Scalability

The backend is stateless. Multiple instances can be run in parallel as long as they share the same database. Concurrency control remains correct because it is enforced at the database level.

### High Availability & Global Distribution

To achieve 99.99% availability for a global user base:

- While the current implementation is a single-region Docker setup, the design intent for 99.99% involves deploying the API across multiple AWS Regions with a Global Load Balancer (like AWS Route53) routing users to the nearest healthy region.

- We would utilize a Multi-AZ (Availability Zone) RDS configuration for automatic failover. For global reads (catalog viewing), we would implement Read Replicas in different geographic regions to reduce latency for international users.

- Static assets for the React frontend would be served via a Global CDN (like CloudFront) to ensure fast load times regardless of the user's country.

## Scale Assumptions and Capacity Considerations

The system assumes around 1,000,000 daily active users.

- Peak traffic is expected to reach approximately 50,000 concurrent users, primarily during ticket release windows.

- The primary technical risk at this scale is concurrent access to shared ticket inventory, not request volume alone.

- Multiple users may attempt to book the same ticket tier at the same time, which can lead to overselling if not handled correctly.

### Application Layer

- The backend is stateless, allowing multiple instances of the API to run in parallel.

- Horizontal scaling is achieved by adding more backend instances behind a load balancer.

- No in-memory or application-level locks are used to coordinate bookings.

- All correctness guarantees are delegated to the database.

### Performance

Performance Optimization (p95 < 500ms) To meet the requirement of p95 < 500ms for booking requests:

- The database transaction is scoped strictly to the inventory check and the booking creation to minimize the time a row-level lock is held.

- We utilize PostgreSQL indexes on the TicketTier identifiers to ensure that `SELECT ... FOR UPDATE` queries execute in constant time.

- In a production environment, we would use a tool like PgBouncer to manage the 50,000 concurrent user connections, preventing the overhead of creating new database connections for every request.

### Database Layer

- PostgreSQL acts as the single source of truth for ticket inventory.

- Booking operations use serializable transactions with row-level locking on the inventory record.

- Only one transaction can modify a ticket tier inventory row at a time.

- Conflicting booking requests either wait or fail safely without corrupting data.

- Inventory updates are atomic, preventing negative quantities and double booking.

### Read vs Write Behavior

- Read operations such as fetching ticket availability do not require locks and scale efficiently.

- Write operations are intentionally serialized per ticket tier.

- This limits throughput during peak demand but guarantees correctness.

- Short periods of contention are acceptable and expected for ticketing systems.

### Database as the Bottleneck by Design

- The database is intentionally the single point of coordination for ticket inventory.

- It ensures strong correctness guarantees without relying on complex distributed systems.

- Backend scaling improves request handling for reads and non-conflicting writes.

- Contention on writes is expected and acceptable, because ticket inventory consistency is critical.

- This design mirrors real-world ticketing systems, where preventing overselling outweighs maximum throughput.

### Design Trade-off at Scale

- The system prioritizes correctness over maximum throughput.

- Complexity is kept low by avoiding distributed locks or custom coordination logic.

- This approach ensures safe and predictable behavior during high contention windows.

## Trade Offs and Limitations

This solution makes several deliberate trade offs:

- Serializable isolation can reduce throughput under very high load, but it simplifies correctness

- Seat level selection is not implemented to keep focus on inventory consistency

- Payments are simulated and not integrated with a real provider

- Authentication and user management are out of scope

These choices were made to keep the solution focused.

## How to Run the Project

Start everything from the root directory

1. Clone the Repository

   ```sh
   git clone https://github.com/layashlf/Ticket-booking.git
   cd Ticket-booking
   ```

2. Prerequisites

   Ensure the following are installed on your system:

   - Docker (with Docker Compose v2)

   - Node.js 18 or newer

   - Git

3. Environment Variable Setup

   This project requires environment variables for both the backend and frontend.

   ```sh
   cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env
   ```

   Update the environment variables if necessary.

4. Starting the project

   ```sh
   bash start.sh
   ```

   > > **Note for Windows Users**: It is recommended to run the startup script using Git Bash or WSL2. Ensure that the repository is cloned with LF (Linux) line endings to avoid shell script errors.

   Run backend only

   ```sh
   cd backend
   bash start.sh
   ```

   Run frontend only

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   > Backend runs at http://localhost:3001
   >
   > > API runs at http://localhost:3001/api

   > Frontend runs at http://localhost:5173

   > > Please note that if port 5173 is already in use by another process, Vite will automatically increment the port (e.g., 5174, 5175). Check the terminal output for the active URL.

5. Stopping the project

   Stop backend only

   ```sh
   cd backend
   bash start.sh stop
   ```

   Stop frontend only

   ```sh
   Ctrl + C (on Windows and macOS/Linux)
   ```

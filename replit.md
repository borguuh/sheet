# Issue Tracker Pro

## Overview

Issue Tracker Pro is a professional issue management system built as a full-stack web application. The system allows teams to track and manage project issues and feature requests with a clean, modern interface. It features a public-facing issue tracker that anyone can view, while administrative functions require authentication through Replit's authentication system.

The application is designed with a focus on simplicity and usability, providing essential issue tracking capabilities including creation, editing, filtering, and status management. Issues are automatically synchronized with Google Sheets for external reporting and backup purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** using **TypeScript** and **Vite** as the build tool. The UI framework is **shadcn/ui** components built on top of **Radix UI** primitives, styled with **TailwindCSS**. The application uses **Wouter** for client-side routing and **TanStack Query** for server state management.

The frontend follows a component-based architecture with:
- Reusable UI components in `/client/src/components/ui/`
- Feature-specific components like `IssueTable`, `IssueForm`, and `IssueFilters`
- Custom hooks for authentication and mobile detection
- Centralized query client configuration for API communication

### Backend Architecture
The server is built with **Express.js** and **TypeScript**, following a RESTful API design. Key architectural decisions include:

- **Express.js** as the web framework for its simplicity and extensive ecosystem
- **Drizzle ORM** with **Neon Database** (PostgreSQL) for type-safe database operations
- **Replit Authentication** integration using OpenID Connect for secure admin access
- Modular route organization with dedicated authentication middleware
- Storage abstraction layer for database operations

### Database Design
The PostgreSQL schema includes:
- `sessions` table for Replit authentication session storage
- `users` table for admin user management
- `issues` table for tracking issues and feature requests with fields for title, type, description, impact, status, and dates

The database uses **Drizzle ORM** for type-safe operations and **Zod** schemas for runtime validation, ensuring data integrity throughout the application.

### Authentication System
The application implements **Replit Authentication** using OpenID Connect:
- Session-based authentication with PostgreSQL session storage
- Admin-only access for creating, editing, and deleting issues
- Public read access for viewing issues
- Automatic session management and renewal

### State Management
Frontend state is managed through:
- **TanStack Query** for server state, caching, and synchronization
- **React Hook Form** with **Zod** validation for form state
- Local component state for UI interactions
- Custom hooks for authentication state

## External Dependencies

### Third-Party Services
- **Neon Database**: PostgreSQL hosting service for data persistence
- **Replit Authentication**: OpenID Connect provider for secure admin access
- **Google Sheets API**: Integration for automatic issue synchronization and external reporting

### Key Libraries
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: TailwindCSS for utility-first styling
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Validation**: Zod for schema validation and type safety
- **Forms**: React Hook Form with Hookform Resolvers for form management
- **Date Handling**: date-fns for date formatting and manipulation
- **Build Tools**: Vite for development and production builds
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage

### Development Tools
- **TypeScript**: For type safety across the entire stack
- **ESBuild**: For server-side bundling in production
- **Replit Development Tools**: Runtime error overlay and cartographer for development experience
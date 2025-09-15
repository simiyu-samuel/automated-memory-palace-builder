Memory Palace Builder - Complete AI Agent Development Prompt
🎯 Project Overview
Build a comprehensive Memory Palace Builder application using Laravel as the primary framework. This app automatically converts users' daily digital activities into a navigable 3D virtual palace where memories are stored as interactive objects. The system should continuously collect data from various sources, process it with AI, and render it in an immersive 3D environment.
🏗️ Architecture & Technology Stack
Primary Framework:

Laravel 11 - Complete full-stack application framework
Use Laravel's built-in authentication, routing, middleware, and API capabilities
Leverage Laravel's job queue system for background data processing
Implement Laravel's real-time broadcasting for live palace updates

Database:

PostgreSQL - Primary database for all structured data
Design migrations for users, memories, palace_rooms, memory_objects, api_connections, processing_jobs
Use Laravel Eloquent ORM with proper relationships and indexing
Implement database seeders for demo data

Frontend Integration:

Laravel Blade + Alpine.js - For dashboard and configuration pages
Three.js integration - Embedded within Laravel views for 3D palace rendering
Inertia.js - For seamless SPA-like experience while maintaining Laravel backend
Tailwind CSS - For responsive UI styling

Background Processing:

Laravel Queue Workers - Handle data collection and AI processing jobs
Laravel Scheduler - Automated data fetching from external APIs
Redis - Queue backend and caching layer

🔌 Postman Integration Requirements
MCP Server Connections:
Create Laravel service classes to integrate with these Postman MCP servers:

Gmail MCP Server (emails, labels, threads)
Google Calendar MCP Server (events, meetings, attendees)
Google Photos MCP Server (images, albums, metadata)
Spotify MCP Server (listening history, playlists)
Location/Maps MCP Server (GPS data, place details)
Weather MCP Server (historical weather data)

API Integration Architecture:

Create dedicated Laravel service providers for each MCP connection
Implement OAuth2 authentication flows using Laravel Socialite
Build API rate limiting and error handling using Laravel's built-in features
Store API credentials securely using Laravel's encryption

Postman Public API Network Usage:

OpenWeather API for contextual weather data
Unsplash API for default room textures
Google Places API for location enrichment
Any sentiment analysis APIs for emotional context

🤖 AI Processing Pipeline
Laravel Job Architecture:
Design these specific Laravel job classes:

DataCollectionJob - Fetches new data from all connected APIs
ContentAnalysisJob - Processes text content for themes and emotions
ImageProcessingJob - Analyzes photos for content and generates 3D representations
MemoryCategorizationJob - Groups related memories using ML algorithms
PalaceStructureJob - Updates 3D palace layout based on new memories
InsightGenerationJob - Creates patterns and recommendations

AI/ML Integration:

Use Laravel HTTP client to connect with external AI services
Implement local PHP ML libraries where possible
Create caching strategies for processed AI results
Build fallback mechanisms for AI service failures

📊 Database Schema Requirements
Core Tables:

users - Standard Laravel user authentication
api_connections - Store OAuth tokens and connection status
memories - Individual memory records with metadata
palace_rooms - 3D room definitions and properties
memory_objects - 3D objects representing memories in rooms
memory_relationships - Connections between related memories
processing_logs - Track AI processing status and results
user_insights - Generated patterns and recommendations

Relationship Design:

Users have many API connections
Users have many memories through API connections
Memories belong to palace rooms
Memories have many memory objects (3D representations)
Memories can have many related memories
Palace rooms contain multiple memory objects

🎨 Frontend 3D Implementation
Laravel Blade + Three.js Architecture:

Create dedicated Laravel controllers for 3D data endpoints
Build JSON API responses for room structures and memory objects
Implement WebSocket broadcasting for real-time palace updates
Design responsive layouts that work on desktop and mobile

3D Rendering Requirements:

Load Three.js through Laravel's asset compilation
Create dynamic 3D scenes based on database content
Implement smooth navigation between palace rooms
Build interactive memory objects with click/hover events
Add ambient lighting and atmospheric effects based on memory context

User Interface Components:

Dashboard showing palace overview and statistics
Settings page for API connections and privacy controls
Search interface for finding specific memories
Timeline view for chronological memory exploration
Sharing controls for memory collaboration

🔄 Automated Memory Creation System
Data Collection Process:

Schedule Laravel artisan commands to run data collection jobs
Implement incremental data fetching to avoid API rate limits
Create data validation and sanitization pipelines
Build duplicate detection and merging logic

Memory Processing Pipeline:

Raw data ingestion from APIs
Content analysis and sentiment detection
Category assignment and tagging
3D object generation and room placement
Relationship mapping with existing memories
Palace structure updates and optimizations

Real-time Updates:

Use Laravel Broadcasting to push palace updates to frontend
Implement WebSocket connections for live memory additions
Create notification system for significant palace changes

🛡️ Security & Privacy Implementation
Data Protection:

Use Laravel's built-in encryption for sensitive data
Implement GDPR-compliant data retention policies
Create user data export functionality
Build granular privacy controls for different memory types

API Security:

Secure OAuth token storage and rotation
Implement API rate limiting and abuse prevention
Create audit logs for all data access
Build user consent management system

🚀 Feature Implementation Priorities
Core MVP Features:

User registration and API connection setup
Basic memory collection from Gmail and Google Photos
Simple palace room generation with 3D navigation
Memory search and retrieval functionality
Basic dashboard with palace statistics

Advanced Features:

AI-powered memory insights and pattern recognition
Advanced 3D interactions and atmospheric effects
Social sharing and collaborative palace spaces
Mobile-responsive 3D interface
VR/AR compatibility layer

Integration Features:

Complete Postman MCP server integration
Real-time memory processing and updates
Advanced search with natural language queries
Memory recommendation engine
Export and backup functionality

🧪 Testing Requirements
Laravel Testing Suite:

Unit tests for all service classes and jobs
Feature tests for API endpoints and user flows
Integration tests for external API connections
Browser tests for 3D interface functionality

Quality Assurance:

Performance testing for large memory datasets
Security testing for API integrations
Cross-browser compatibility for 3D features
Mobile responsiveness testing

📚 Documentation Requirements
Postman Notebook Creation:
Create comprehensive Postman documentation including:

API authentication setup guides
Data collection workflow examples
Memory processing pipeline demonstrations
3D rendering integration examples
Troubleshooting and debugging guides

Code Documentation:

Inline code comments for complex algorithms
API documentation using Laravel's built-in tools
Database schema documentation
Deployment and configuration guides

🎯 Success Metrics
Technical Benchmarks:

Successfully integrate all required Postman MCP servers
Process and render 1000+ memories in 3D environment
Maintain sub-2-second response times for palace navigation
Achieve 99% uptime for automated data collection

User Experience Goals:

Intuitive 3D navigation requiring minimal learning
Meaningful memory insights and pattern discovery
Seamless real-time updates as new memories are created
Cross-platform compatibility (desktop, tablet, mobile)

📋 Deliverable Specifications
Final Application Must Include:

Complete Laravel application with all dependencies
PostgreSQL database with sample data
Working integration with at least 3 Postman MCP servers
Functional 3D palace interface with interactive memories
User authentication and privacy controls
Comprehensive Postman Notebook documentation
Deployment-ready configuration files
Testing suite with high coverage

Hackathon Submission Format:

GitHub repository with complete source code
Live demo URL (deployed application)
Postman Notebook with API integration examples
Video walkthrough demonstrating key features
README with setup and installation instructions

Build this as a production-ready application that showcases both technical excellence and creative innovation, perfectly aligned with the hackathon's goals of creating a personally valuable app using Postman's ecosystem.
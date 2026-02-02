# NEOLink

<p align="center">
  <img src="logo.png" alt="NEOLink Logo" width="200"/>
</p>

<p align="center">
  <strong>A collaborative platform for sharing educational resources within the NEOLAiA European Universities Alliance</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#license">License</a>
</p>

---

## Overview

NEOLink is a web application designed for the **NEOLAiA European Universities Alliance** that enables universities to share and discover educational resources, courses, and learning materials. The platform facilitates collaboration between institutions by providing a centralized marketplace for educational items with features like categorization by academic fields, university associations, and Discourse forum integration.

## Features

- 🎓 **Educational Resource Sharing** - Create, publish, and manage educational items (courses, materials, etc.)
- 🏛️ **University Integration** - Associate resources with NEOLAiA partner universities
- 📚 **Academic Categorization** - Classify items using ISCED fields and ERC panels/keywords
- 🔐 **OTP Authentication** - Secure email-based one-time password authentication
- 💬 **Discourse Integration** - Automatic forum group/category creation for each item
- 🔍 **Advanced Filtering** - Search and filter resources by category, university, and status
- 👤 **Personal Dashboard** - Manage your items and express interest in others' resources
- 📱 **Responsive Design** - Modern Bootstrap-based UI that works on all devices

## Tech Stack

### Backend
- **[Strapi v5](https://strapi.io/)** - Headless CMS for content management and API
- **PostgreSQL** - Relational database
- **Node.js** (>=20.x) - Runtime environment
- **Nodemailer** - Email sending for OTP authentication

### Frontend
- **[React 19](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Build tool and development server
- **React Router v7** - Client-side routing
- **React Bootstrap** - UI components
- **Axios** - HTTP client

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Frontend static file serving

## Prerequisites

- **Docker** and **Docker Compose** (recommended)
- Or for local development:
  - Node.js >= 20.x
  - npm or yarn
  - PostgreSQL 15+

## Installation

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/NEOLAiA-European-Universities-Alliance/NEOLink.git
   cd NEOLink
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (see [Configuration](#configuration))

4. **Start the services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000/neolink
   - Strapi Admin: http://localhost:1337/admin

### Local Development

#### Backend (Strapi)

```bash
cd backend/neolink
npm install
npm run develop
```

#### Frontend (React + Vite)

```bash
cd frontend/neolink
npm install
npm run dev
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_secure_password

# Strapi Security Keys (generate unique values)
JWT_SECRET=your_jwt_secret
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
APP_KEYS=key1,key2,key3,key4
TRANSFER_TOKEN_SALT=your_transfer_token_salt

# Discourse Integration (optional)
DISCOURSE_URL=https://your-discourse-instance.com
DISCOURSE_API_TOKEN=your_discourse_api_token

# ORH API (optional)
ORH_API_URL=https://orh-api-url.com

# Email Configuration (for OTP)
HOST_MAIL=smtp.example.com
USER_MAIL=your_email@example.com
PASS_MAIL=your_email_password

# Custom JWT Authentication
JWT_SECRET_CUSTOM_AUTH=your_custom_jwt_secret
JWT_EXPIRES_CUSTOM_AUTH_IN=7d

# Frontend
VITE_API_URL=http://localhost:1337
```

## Usage

At the following link, you can find the complete guide on how to use the NEOLink platform: [https://books.neolaiacampus.eu/books/neolink-guide](https://books.neolaiacampus.eu/books/neolink-guide)

### User Flow

1. **Login** - Access the platform using your university email (OTP-based authentication)
2. **Browse Items** - Explore available educational resources with filtering options
3. **Create Items** - Share your courses or materials with the community
4. **Express Interest** - Show interest in resources from other universities
5. **Collaborate** - Use integrated Discourse forums for discussions

### API Endpoints

The Strapi backend exposes RESTful APIs for:
- `/api/items` - Educational resources
- `/api/universities` - Partner universities
- `/api/sellers` - User profiles
- `/api/isced-*` - Academic field classifications
- `/api/erc-*` - ERC panels and keywords

## Project Structure

```
NEOLink/
├── docker-compose.yml          # Docker orchestration
├── backend/
│   └── neolink/                # Strapi application
│       ├── config/             # Strapi configuration
│       ├── src/
│       │   ├── api/            # Content-types & controllers
│       │   └── middlewares/    # Custom middlewares (OTP auth)
│       └── public/             # Static files
└── frontend/
    └── neolink/                # React application
        ├── src/
        │   ├── components/     # Reusable components
        │   ├── pages/          # Page components
        │   └── api.jsx         # API client
        └── public/             # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **NEOLAiA European Universities Alliance** - For supporting this initiative

---

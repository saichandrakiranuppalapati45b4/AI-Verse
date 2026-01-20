# AI Verse - Club Website & Management System

A full-stack, responsive web application for managing club activities, hackathons, seminars, workshops, and tech events with role-based access control.

## 🚀 Features

### Public Website
- **Home Page**: Club introduction, vision, highlights, and upcoming events
- **About**: Mission, vision, values, and what we do
- **Events**: Browse upcoming and past events with filtering
- **Event Details & Registration**: View event details and register (individual or team)
- **Gallery**: Event photo gallery with lightbox view
- **Team**: Meet core members and coordinators
- **Contact**: Contact form and club information
- **Results**: View published event results and rankings

### Admin Dashboard
- **Analytics Dashboard**: Overview of events, registrations, and jury members
- **Event Management**: Create, edit, delete events with all details
- **Jury Management**: Add jury members and assign them to events
- **Participant Management**: View all registrations with filtering and CSV export
- **Results Management**: View jury scores and publish final results with rankings
- **Content Management**: Edit website content (Home, About, Team, Contact)

### Jury Portal
- **Assigned Events**: View events assigned by admin
- **Participant Evaluation**: View all participants/teams for assigned events
- **Scoring Interface**: Score participants on 4 criteria (Innovation, Technical, Presentation, Impact)
- **Feedback Submission**: Provide detailed feedback for each participant

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (https://supabase.com)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-verse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to **SQL Editor** and execute the following files in order:
   - `supabase/schema.sql` - Creates all tables, RLS policies, and functions
   - `supabase/seed.sql` - Seeds initial content and sample data

3. Create storage buckets in **Storage**:
   - `gallery-images` (public)
   - `team-photos` (public)
   - `event-banners` (public)

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings under **API**.

### 5. Create Admin User

1. Go to **Authentication** in your Supabase dashboard
2. Create a new user with email and password
3. Go to **Table Editor** → **users** table
4. Find the newly created user and update their `role` to `admin`

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 👥 User Roles

### Admin
- Full access to all features
- Manage events, jury, participants, and results
- Edit website content

### Jury
- View assigned events only
- Evaluate participants
- Submit scores and feedback

### Public
- Browse public pages
- Register for events
- View published results

## 📱 Key Routes

### Public Routes
- `/` - Home page
- `/about` - About the club
- `/events` - Events listing
- `/events/:id` - Event details and registration
- `/gallery` - Photo gallery
- `/team` - Team members
- `/contact` - Contact page
- `/results` - Published results

### Admin Routes (requires admin login)
- `/admin` - Dashboard
- `/admin/events` - Event management
- `/admin/jury` - Jury management
- `/admin/participants` - Participant management
- `/admin/results` - Results management
- `/admin/content` - Content management

### Jury Routes (requires jury login)
- `/jury` - Jury dashboard
- `/jury/event/:eventId` - Event evaluation
- `/jury/event/:eventId/score/:registrationId` - Scoring interface

### Auth Routes
- `/login` - Login for admin and jury

## 🗄️ Database Schema

### Main Tables
- **users**: User profiles with roles (admin, jury, public)
- **events**: Event information and details
- **registrations**: Event registrations (individual and team)
- **jury_assignments**: Jury member assignments to events
- **scores**: Jury scoring data per participant
- **results**: Published final results with rankings
- **gallery**: Event photos
- **content_pages**: Editable website content

## 🔐 Security Features

- Row Level Security (RLS) policies on all tables
- Role-based route protection
- Admin-only access to management features
- Jury limited to assigned events only
- Public pages are read-only

## 📊 Features Overview

### Event Registration
- Support for individual and team registrations
- Dynamic team size configuration
- Auto-save to database
- Registration status tracking

### Jury Evaluation
- 4-criterion scoring system (0-10 scale each)
- Real-time total score calculation
- Feedback and comments
- Score editing capability

### Results Publishing
- Automatic score aggregation from multiple jury members
- Ranking calculation
- Prize assignment
- Publish/unpublish control

### Data Export
- CSV export of participant data
- Filtered export options
- Comprehensive participant information

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

### Deploy to Vercel/Netlify

1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy!

> **Note for Vercel Users:** A `vercel.json` configuration file has been included to ensure client-side routing works correctly.

## 🎨 Customization

### Updating Content
- Use the Admin → Content Management page to edit Home, About, Team, and Contact pages
- Content is stored as JSON in the `content_pages` table

### Styling
- Modify `tailwind.config.js` for theme colors
- Edit `src/index.css` for global styles

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, email aiverse@college.edu or create an issue in the repository.

---

**Built with ❤️ by AI Verse Team**

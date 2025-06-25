# Contact Dashboard

A modern, responsive dashboard application to track contacts and engagement metrics. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Metrics
- **Total Contacts This Week**: Count of new contacts in the current week
- **Contacts Who Left**: Number of people who stopped engaging
- **Active Contacts**: Currently engaged contacts
- **Total Contacts**: Overall contact count with growth percentage

### Visual Analytics
- **Contact Trends Chart**: Daily/weekly visualization of contact activity
- **Source Breakdown**: Distribution of contacts by source (website, social media, email, etc.)
- **Recent Contacts Table**: Detailed view of latest contacts with status indicators

### Key Capabilities
- Real-time metrics display
- Responsive design for all devices
- Interactive charts and visualizations
- Status tracking (active, inactive, left, unsubscribed)
- Source attribution tracking
- Weekly growth comparisons

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Create React App

## 📦 Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── MetricCard.tsx   # Individual metric display
│   ├── ContactTrendsChart.tsx  # Line chart for trends
│   ├── SourceBreakdown.tsx     # Source distribution
│   └── RecentContacts.tsx      # Contacts table
├── data/
│   └── mockData.ts      # Sample data for demonstration
├── types/
│   └── index.ts         # TypeScript type definitions
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## 📊 Data Structure

The dashboard uses the following data structure:

```typescript
interface Contact {
  id: string;
  name: string;
  email: string;
  source: ContactSource;  // 'email' | 'form' | 'call' | 'chat' | 'social_media' | 'website' | 'ads'
  date: string;
  status: ContactStatus;  // 'active' | 'inactive' | 'left' | 'unsubscribed'
}

interface ContactMetrics {
  totalContacts: number;
  contactsLeft: number;
  newContacts: number;
  activeContacts: number;
  weeklyGrowth: number;
}
```

## 🎨 Customization

### Adding New Metrics
1. Update the `ContactMetrics` interface in `src/types/index.ts`
2. Add new metric cards in `src/App.tsx`
3. Update the mock data in `src/data/mockData.ts`

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update component styles in `src/index.css`
- Use Tailwind utility classes for responsive design

### Data Sources
Replace the mock data in `src/data/mockData.ts` with real API calls:
```typescript
// Example API integration
const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch('/api/dashboard');
  return response.json();
};
```

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:
- **Mobile**: Single column layout
- **Tablet**: 2-column metric grid
- **Desktop**: 4-column metric grid with sidebar charts

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (irreversible)

## 🚀 Deployment

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder** to your hosting service:
   - Netlify
   - Vercel
   - AWS S3
   - GitHub Pages

## 📈 Future Enhancements

- Real-time data updates
- Export functionality (PDF, CSV)
- Advanced filtering and search
- User authentication
- Multiple dashboard views
- Email notifications
- Integration with CRM systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ using React and TypeScript** 
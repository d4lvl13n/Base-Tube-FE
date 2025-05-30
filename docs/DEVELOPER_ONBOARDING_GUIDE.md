# Base.Tube Developer Onboarding Guide

## 🎯 Welcome to Base.Tube

This guide will help you quickly understand and contribute to the Base.Tube project - a revolutionary decentralized video platform that enables content creators to monetize through innovative "Pass-as-a-Link" technology.

## 📚 Documentation Overview

### Essential Reading (Start Here)
1. **[README.md](./README.md)** - Project overview and quick start
2. **[PRD.md](./PRD.md)** - Product requirements and business logic
3. **This Guide** - Step-by-step onboarding process

### Technical Deep Dives
4. **[API.md](./API.md)** - Complete API documentation
5. **[HOOKS.md](./HOOKS.md)** - Custom React hooks reference
6. **[APP_ARCHITECTURE.md](./APP_ARCHITECTURE.md)** - Application architecture and routing

## 🚀 Quick Start (30 Minutes)

### Step 1: Environment Setup (10 minutes)

```bash
# Clone the repository
git clone [repository-url]
cd base-tube-mockup

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

**Required Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
REACT_APP_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Step 2: Start Development Server (5 minutes)

```bash
# Start the development server
npm start

# The app will open at http://localhost:3000
```

### Step 3: Explore the Application (15 minutes)

1. **Homepage** (`/`) - Understanding the landing experience
2. **Creator Hub** (`/creator-hub`) - Main creator interface
3. **Video Upload** (`/creator-hub/upload`) - Content creation flow
4. **Analytics** (`/creator-hub/analytics`) - Performance dashboard

## 🏗️ Architecture Overview

### Technology Stack
```
Frontend:
├── React 18 + TypeScript     # Core framework
├── React Router v6           # Navigation
├── React Query               # Data fetching & caching
├── Styled Components         # Styling
├── Framer Motion            # Animations
└── Tailwind CSS             # Utility styling

Authentication:
├── Clerk                    # Traditional auth
└── Wagmi + RainbowKit       # Web3 auth

Blockchain:
├── Base Network             # Primary blockchain
├── Viem                     # Ethereum client
└── Coinbase OnchainKit      # Web3 utilities
```

### Key Concepts

#### 1. Pass-as-a-Link System
The core monetization feature that allows creators to:
- Create exclusive content access links
- Set pricing (crypto/fiat)
- Control access duration and features
- Track sales and revenue

#### 2. Dual Authentication
- **Traditional**: Email/password via Clerk
- **Web3**: Wallet connection via Wagmi
- Unified user experience across both methods

#### 3. Creator Hub
Comprehensive dashboard for content creators:
- Video upload and management
- Analytics and insights
- Channel management
- Content pass creation
- Revenue tracking

## 📁 Codebase Structure

```
src/
├── api/                     # API layer (18 modules)
│   ├── analytics.ts         # Analytics endpoints
│   ├── video.ts            # Video operations
│   ├── pass.ts             # Content pass management
│   └── ...
├── hooks/                   # Custom React hooks (35+ hooks)
│   ├── useAnalyticsData.ts  # Analytics data management
│   ├── usePass.ts          # Content pass operations
│   └── ...
├── components/              # UI components
│   ├── common/             # Shared components
│   ├── pages/              # Page-specific components
│   └── ...
├── contexts/               # React contexts
├── types/                  # TypeScript definitions
├── utils/                  # Utility functions
└── App.tsx                 # Main application component
```

## 🔧 Development Workflow

### 1. Understanding the API Layer

**Key API Modules:**
- `analytics.ts` - Creator analytics and metrics
- `video.ts` - Video upload, streaming, management
- `pass.ts` - Content pass creation and sales
- `channel.ts` - Channel management
- `thumbnail.ts` - AI thumbnail generation

**Example API Usage:**
```typescript
// Get channel analytics
import { getChannelWatchHours } from '../api/analytics';

const watchHours = await getChannelWatchHours(channelId, '30d');
```

### 2. Working with Custom Hooks

**Data Fetching Pattern:**
```typescript
// Using useAnalyticsData hook
const { 
  watchHours, 
  engagement, 
  isLoading, 
  error 
} = useAnalyticsData(channelId, '30d');
```

**Authentication Hooks:**
```typescript
// Traditional auth
const { user, isSignedIn } = useCurrentUser();

// Web3 auth
const { isAuthenticated, address } = useWeb3Auth();
```

### 3. Component Development

**Page Component Pattern:**
```typescript
const MyPage: React.FC = () => {
  // 1. Authentication check
  const { isAuthenticated } = useAuth();
  
  // 2. Data fetching
  const { data, isLoading } = useMyData();
  
  // 3. Loading state
  if (isLoading) return <LoadingSpinner />;
  
  // 4. Render
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

## 🎯 Common Development Tasks

### 1. Adding a New API Endpoint

```typescript
// 1. Add to API module (e.g., src/api/video.ts)
export const getVideoStats = async (videoId: string) => {
  const response = await api.get(`/api/v1/videos/${videoId}/stats`);
  return response.data;
};

// 2. Create a hook (e.g., src/hooks/useVideoStats.ts)
export const useVideoStats = (videoId: string) => {
  return useQuery({
    queryKey: ['videoStats', videoId],
    queryFn: () => getVideoStats(videoId),
    enabled: Boolean(videoId),
  });
};

// 3. Use in component
const { data: stats } = useVideoStats(videoId);
```

### 2. Creating a New Page

```typescript
// 1. Create page component
const NewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <h1>New Page</h1>
    </div>
  );
};

// 2. Add route to App.tsx
<Route path="/new-page" element={<NewPage />} />
```

### 3. Adding Analytics Tracking

```typescript
// Use existing analytics hooks
const { trackEvent } = useAnalytics();

const handleButtonClick = () => {
  trackEvent('button_clicked', {
    page: 'creator-hub',
    button: 'upload-video'
  });
};
```

## 🧪 Testing Strategy

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch       # Run in watch mode
npm test -- --coverage    # Run with coverage
```

### Test Structure
```
src/
├── components/
│   └── __tests__/        # Component tests
├── hooks/
│   └── __tests__/        # Hook tests
└── api/
    └── __tests__/        # API tests
```

### Writing Tests
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { VideoCard } from '../VideoCard';

test('renders video title', () => {
  render(<VideoCard video={mockVideo} />);
  expect(screen.getByText('Video Title')).toBeInTheDocument();
});
```

## 🐛 Debugging Guide

### Common Issues & Solutions

#### 1. Authentication Issues
```typescript
// Check auth state
console.log('Auth state:', {
  isAuthenticated: useAuth().isAuthenticated,
  user: useCurrentUser().user
});
```

#### 2. API Call Failures
```typescript
// Enable React Query DevTools
// Already included in App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

#### 3. Styling Issues
```typescript
// Check Tailwind classes are working
className="bg-red-500 text-white p-4"

// Check styled-components
const StyledDiv = styled.div`
  background: red;
  color: white;
`;
```

## 📊 Performance Optimization

### React Query Best Practices
```typescript
// Good: Specific query keys
['videos', 'trending', { limit: 10 }]

// Bad: Generic query keys
['getData']

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateVideo,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['video', videoId]);
    const previousData = queryClient.getQueryData(['video', videoId]);
    queryClient.setQueryData(['video', videoId], newData);
    return { previousData };
  },
});
```

### Component Optimization
```typescript
// Memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

## 🔐 Security Considerations

### Authentication
- Never store sensitive data in localStorage
- Use proper error handling for auth failures
- Implement proper route protection

### API Security
- Always validate user input
- Use proper error handling
- Implement rate limiting awareness

### Web3 Security
- Validate wallet connections
- Handle network switching
- Implement proper transaction error handling

## 🚀 Deployment

### Build Process
```bash
npm run build              # Create production build
npm run build:analyze      # Analyze bundle size
```

### Environment Configuration
```env
# Production
REACT_APP_API_URL=https://api.base.tube
REACT_APP_ENVIRONMENT=production

# Staging
REACT_APP_API_URL=https://staging-api.base.tube
REACT_APP_ENVIRONMENT=staging
```

## 📖 Learning Resources

### Internal Documentation
- **API Reference**: Complete endpoint documentation
- **Hook Reference**: All custom hooks with examples
- **Component Library**: Reusable component documentation

### External Resources
- [React Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com/)
- [Wagmi Docs](https://wagmi.sh/)
- [Base Network Docs](https://docs.base.org/)

## 🤝 Contributing

### Code Standards
- Use TypeScript for all new code
- Follow existing patterns for components and hooks
- Add proper error handling
- Include JSDoc comments for complex functions

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback

### Code Review Checklist
- [ ] TypeScript types are proper
- [ ] Error handling is implemented
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Documentation updated

## 🆘 Getting Help

### Team Resources
- **Slack**: #base-tube-dev channel
- **Wiki**: Internal project wiki
- **Stand-ups**: Daily at 9 AM EST

### Code Questions
- Check existing documentation first
- Search through code comments
- Ask in team chat with specific context
- Schedule pairing session for complex issues

---

**Next Steps:**
1. Complete the 30-minute quick start
2. Read through the API and Hooks documentation
3. Pick up a good first issue from the backlog
4. Join the next team stand-up

Welcome to the team! 🎉 
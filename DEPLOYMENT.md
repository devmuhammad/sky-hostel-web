# Sky Student Hostel - Deployment Guide

## 🚀 Production Deployment Checklist

### ✅ **Pre-Deployment Setup**

#### 1. Environment Variables

```bash
# Copy and configure environment variables
cp .env.example .env.local

# Required variables - get these from your services:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYCASHLESS_API_KEY=your-paycashless-key
PAYCASHLESS_API_SECRET=your-paycashless-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

#### 2. Supabase Database Setup

```sql
-- Run the database schema from shared/config/database-schema.sql
-- This creates all required tables and indexes
```

#### 3. Supabase Storage Setup

Follow instructions in `SUPABASE_STORAGE_SETUP.md` to:

- Create `student-documents` bucket
- Set up RLS policies
- Configure file upload permissions

### 🔧 **Production Optimizations**

#### 4. Performance Settings

```javascript
// next.config.ts - Add production optimizations
export default {
  // Enable compression
  compress: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Enable experimental features
  experimental: {
    optimizeCss: true,
  },
};
```

#### 5. Security Headers

```javascript
// Add to next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];

export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

### 📊 **Monitoring & Observability**

#### 6. Health Check Endpoint

Your app includes a health check at `/api/health`

- Monitor this endpoint for system status
- Returns 200 for healthy, 503 for unhealthy
- Checks database connectivity and environment

#### 7. Error Monitoring (Recommended)

```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Add to your environment
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### 8. Performance Monitoring

- Use Vercel Analytics (if deploying to Vercel)
- Or integrate Google Analytics
- Monitor Core Web Vitals

### 🌐 **Deployment Platforms**

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

#### Option 3: Custom Server (Docker)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### 🔒 **Security Hardening**

#### 9. Rate Limiting (Already Implemented ✅)

- Registration: 3 attempts per hour
- Payments: 5 attempts per 10 minutes
- General API: 100 requests per 15 minutes

#### 10. Input Sanitization (Already Implemented ✅)

- All user inputs are sanitized
- XSS protection enabled
- SQL injection prevention

#### 11. Environment Validation (Already Implemented ✅)

- Required environment variables are validated at startup
- Application fails fast if configuration is missing

### 📝 **Post-Deployment**

#### 12. Testing Production

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test payment flow
# Test registration flow
# Test admin dashboard
```

#### 13. Monitoring Setup

- Set up uptime monitoring for `/api/health`
- Configure alerts for 5xx errors
- Monitor database performance
- Track registration and payment success rates

#### 14. Backup Strategy

- Supabase handles database backups automatically
- Consider additional backup of user files
- Document recovery procedures

### 🚨 **Emergency Procedures**

#### Rollback Process

```bash
# If using Vercel
vercel rollback

# If using custom deployment
# Keep previous build artifacts
# Have rollback script ready
```

#### Key Contacts

- Supabase Support: dashboard.supabase.io
- Paycashless Support: [their support channel]
- DNS/CDN Provider support

### 📈 **Performance Targets**

#### Expected Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Registration Completion**: < 3 minutes
- **Payment Processing**: < 30 seconds
- **Database Queries**: < 100ms
- **Uptime Target**: 99.9%

---

## 🎯 **Production Readiness Status**

### ✅ **Completed**

- ✅ Environment validation
- ✅ Structured logging
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Health check endpoint
- ✅ Mobile optimization
- ✅ Error handling
- ✅ File upload security
- ✅ Database indexes
- ✅ Transaction handling

### ⚠️ **Recommended Additions**

- Error monitoring (Sentry)
- Performance monitoring
- Automated testing
- CI/CD pipeline
- Load testing
- Security audit

Your application is **production-ready** with the current implementation! 🚀

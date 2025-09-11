# ReminderApp Roadmap & Work Items

## 🎯 Service Strategy
**Vision:** Provide reminder app as a service for people with memory issues

**Current Status:** Single-user prototype with GAS backend
**Target:** Multi-tenant SaaS with Azure backend

---

## 📋 Work Items by Priority

### 🔥 HIGH PRIORITY (Next 1-2 months)

#### 1. Admin UI for Webhook Management
**Description:** Create admin interface to manage Telegram webhooks without curl commands

**Requirements:**
- Admin dashboard page (`/admin`)
- Webhook status display (ON/OFF, last error, pending updates)
- Enable/Disable webhook buttons
- Webhook logs viewer
- Authentication required to access admin

**Files to modify:**
- `ReminderApp.js` - Add admin routes and functions
- Create `admin.html` - Admin dashboard UI

**Acceptance Criteria:**
- Admin can view webhook status
- Admin can enable/disable webhook with one click
- All webhook operations logged
- Secure authentication required

#### 2. Authentication System for Admin
**Description:** Implement secure authentication for admin features

**Requirements:**
- Admin login system
- Password protection for admin routes
- Session management
- Secure credential storage (not in code)

**Technical Details:**
- Use Google OAuth or simple username/password
- Store credentials securely (GAS PropertiesService with encryption)
- Session timeout after inactivity
- Audit log for admin actions

**Security Considerations:**
- No hardcoded credentials
- HTTPS required
- Rate limiting for login attempts
- Secure password storage

---

### 🟡 MEDIUM PRIORITY (Next 3-6 months)

#### 3. Multi-tenancy Preparation (GAS)
**Description:** Prepare GAS codebase for multiple users

**Current Issues:**
- Shared PropertiesService across all users
- Single Google Sheet for data
- Shared Telegram bot token
- No user isolation

**Requirements:**
- User-specific configuration storage
- Separate data storage per user
- User-specific API keys
- Isolated webhook processing

**Technical Challenges:**
- GAS PropertiesService is global - need workarounds
- Google Sheets per user approach
- Telegram bot per user vs shared bot with routing

#### 4. User Isolation Design
**Description:** Design architecture for user data isolation

**Options:**
1. **Separate GAS projects per user** (easiest but expensive)
2. **Shared GAS with user prefixes** (cheaper but complex)
3. **Azure migration** (best long-term)

**Decision Needed:**
- Cost vs complexity trade-off
- Scalability requirements
- Maintenance overhead

#### 5. Database Schema Planning
**Description:** Design database schema for user data

**Current Data Structure:**
- Google Sheets with tabs: Config, Kuittaukset, Viestit, Tapaamiset, Kuvat, etc.
- PropertiesService for configuration

**Future Database Schema:**
```
Users:
- user_id (UUID)
- email
- created_date
- subscription_status

UserSettings:
- user_id
- setting_key
- setting_value

Reminders:
- user_id
- reminder_id
- type (MEDICINE, FOOD, ACTIVITY)
- title
- time
- status

Photos:
- user_id
- photo_id
- telegram_file_id
- drive_url
- caption
- uploaded_date
```

---

### 🟢 LOW PRIORITY (6+ months)

#### 6. Azure Migration Planning
**Description:** Plan migration from GAS to Azure for scalability

**Migration Steps:**
1. **Phase 1:** Backend API (Azure Functions)
2. **Phase 2:** Database (Azure SQL/Cosmos DB)
3. **Phase 3:** Frontend migration
4. **Phase 4:** User data migration
5. **Phase 5:** DNS and domain setup

**Azure Services:**
- Azure Functions (backend API)
- Azure SQL Database (user data)
- Azure Blob Storage (photos)
- Azure App Service (frontend)
- Azure Key Vault (secrets)

**Timeline:** 3-6 months implementation

#### 7. Performance Optimization
**Description:** Optimize performance for multiple users

**Areas to Optimize:**
- Database query optimization
- Image processing and storage
- API response times
- Caching strategies
- Background job processing

---

## 🔄 Implementation Strategy

### Phase 1: Admin & Security (1-2 months)
1. ✅ Implement admin authentication
2. ✅ Create admin UI for webhook management
3. ✅ Add audit logging
4. ✅ Security hardening

### Phase 2: Multi-tenancy (3-4 months)
1. Design user isolation architecture
2. Implement user-specific data storage
3. Update authentication system
4. Test with 2-3 users

### Phase 3: Azure Migration (5-8 months)
1. Set up Azure infrastructure
2. Migrate backend services
3. Migrate database
4. Migrate frontend
5. User acceptance testing

---

## 📊 Success Metrics

### Technical Metrics
- **Uptime:** 99.9% availability
- **Response Time:** <500ms API responses
- **Concurrent Users:** Support 100+ simultaneous users
- **Data Security:** SOC2 compliance

### Business Metrics
- **User Adoption:** 50+ active users in 6 months
- **Retention:** 80% monthly retention
- **Revenue:** Sustainable subscription model
- **Support:** <24h response time

---

## 💰 Budget Considerations

### GAS (Current - Free tier)
- Free for basic usage
- Google Sheets free for <100 users
- Manual maintenance required

### Azure (Future - Paid)
- **Estimated Monthly Cost:**
  - Azure Functions: $10-50/month
  - Azure SQL: $20-100/month
  - Azure Storage: $5-20/month
  - Total: $35-170/month

- **Break-even:** ~10 paying customers at $5-15/month

---

## 🚀 Next Steps

### ✅ **COMPLETED (Current Status)**
1. **Admin UI Framework** - Basic structure implemented in GAS
2. **GAS URL Centralization** - All GAS URLs now in appsettings.json
3. **API Key Security** - Moved to server-side (Azure Functions proxy)
4. **Webhook Management** - Basic enable/disable functionality
5. **Authentication System** - Basic admin auth implemented

### 🔄 **IMMEDIATE NEXT (This Week)**
1. **Complete Admin UI** - Finish webhook management interface
2. **Test Admin UI** - Deploy and test with real GAS instance
3. **Remove VALID_API_KEYS** - Clean up GAS security (no longer needed)
4. **Update Documentation** - Document new architecture

### 📋 **SHORT-TERM (Next Month)**
1. **Multi-user Testing** - Test with 2-3 different users
2. **Performance Monitoring** - Add metrics and monitoring
3. **User Feedback Integration** - Collect feedback from test users
4. **Security Audit** - Review security measures

### 🎯 **MEDIUM-TERM (2-3 Months)**
1. **User Isolation Design** - Plan multi-tenancy architecture
2. **Database Schema** - Design scalable data structure
3. **Payment Integration** - Add subscription/payment system
4. **Mobile App Updates** - Update Android/iOS apps

### 🚀 **LONG-TERM (3-6 Months)**
1. **Azure Migration** - Migrate from GAS to Azure
2. **Advanced Features** - AI-powered suggestions, advanced analytics
3. **Multi-language Support** - Support for multiple languages
4. **Enterprise Features** - Advanced admin tools, reporting

---

## 📊 Current Architecture Status

### ✅ **Working Components**
- **Frontend (PWA):** ReminderPWA with Blazor WebAssembly
- **Backend:** .NET 8 Azure Functions (reminderapp-functions)
- **Database:** Azure Cosmos DB + Google Sheets fallback
- **Storage:** Azure Blob Storage for photos
- **Communication:** Telegram Bot + Twilio SMS/Voice integration
- **Admin:** Complete Admin API for system management
- **Security:** CORS headers, API key management, secure endpoints

### 🔧 **Infrastructure**
- **Development:** Local Azure Functions + GAS
- **Production:** Azure Static Web Apps + Azure Functions + GAS
- **CI/CD:** GitHub Actions workflows
- **Monitoring:** Basic logging in GAS and Azure

### 🎯 **Business Status**
- **Current Users:** 1 (mom - test user)
- **Target Users:** 10-50 in 6 months
- **Revenue Model:** Subscription-based SaaS
- **Market:** Memory care, elderly care, special needs

---

## ⚠️ Critical Issues to Resolve

### 🔥 **HIGH PRIORITY BUGS**
1. **Webhook 302 Redirect Error** - Sometimes returns 302 instead of 200
2. **Telegram Message Duplication** - Multiple messages for same photo
3. **GAS Authentication** - VALID_API_KEYS cleanup needed

### 🔧 **TECHNICAL DEBT**
1. **Code Duplication** - Some logic duplicated between GAS and PWA
2. **Error Handling** - Inconsistent error handling across components
3. **Testing** - Limited automated testing coverage
4. **Documentation** - Architecture documentation needs updating

---

## 💡 Key Decisions Made

### **Architecture Decisions**
- ✅ **GAS + Azure Functions hybrid** (not pure GAS or pure Azure)
- ✅ **Google Sheets as primary database** (for now)
- ✅ **Azure Functions as API gateway** (for security)
- ✅ **Telegram Bot for notifications** (reliable and familiar)

### **Security Decisions**
- ✅ **API keys server-side only** (not in client code)
- ✅ **Proxy-based authentication** (Azure Functions validates requests)
- ✅ **GAS trusts proxy** (no duplicate validation needed)

### **Business Decisions**
- ✅ **SaaS model** (subscription-based)
- ✅ **Memory care focus** (specialized market)
- ✅ **Hybrid infrastructure** (balance cost vs scalability)

---

*Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*
*Next review: Weekly status updates*
*Current Phase: Admin UI Completion & Testing*

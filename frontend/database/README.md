# 📁 Database SQL Scripts

All Supabase database setup and migration scripts.

## 🚀 Setup Order (Run in Supabase SQL Editor)

### **Initial Setup** (First Time)
Run these in order:

1. **`supabase-setup.sql`** - Core users table
2. **`supabase-batches-setup.sql`** - Batches and stages tables
3. **`supabase-image-verification-setup.sql`** - Image verification tracking
4. **`supabase-notifications-FIXED.sql`** - ✅ Notifications system (WORKING VERSION)
5. **`supabase-education-setup.sql`** - Education module tables

### **Migration Scripts** (For Existing Databases)
If tables already exist, use these:

- **`supabase-add-rejection-reason.sql`** - Adds rejectionReason column to image_verifications

---

## 📊 Database Schema Overview

### **users**
- User authentication and profiles
- Roles: FARMER, MANUFACTURER, CONSUMER, ADMIN

### **batches**
- Batch tracking with QR codes
- Status: ACTIVE, HARVESTED, SOLD, PROCESSING
- Verification status: PENDING, VERIFIED, REJECTED

### **stages**
- 7 farming stages per batch
- Stores imageUrls from Supabase Storage
- Status: PENDING, IN_PROGRESS, COMPLETED, VERIFIED, REJECTED

### **image_verifications**
- Admin verification of farmer images
- Status: REAL (verified) or FAKE (flagged)
- **rejectionReason** - Admin's explanation when flagging
- Links to: batch, stage, farmer, admin

### **notifications**
- Real-time notifications for farmers
- Types: IMAGE_VERIFIED, IMAGE_FLAGGED, BATCH_VERIFIED, etc.
- Auto-created when admin verifies/flags images
- **metadata** - Contains rejection reasons, batch info, etc.

---

## ✅ Verification Status

All scripts tested and working in Supabase PostgreSQL.

**Note:** MSSQL extension errors in VS Code are normal - these are PostgreSQL scripts.

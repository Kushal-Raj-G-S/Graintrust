# 🧪 GrainTrust Testing Guide

## **📋 SETUP STEPS (Do These First!)**

### 1. **Run SQL Scripts in Supabase**
Go to: Supabase Dashboard → SQL Editor → New Query

**Execute in this order:**

#### Step 1: Add rejection reason column (if table already exists)
```sql
-- File: database/supabase-add-rejection-reason.sql
ALTER TABLE image_verifications 
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
```

#### Step 2: Create notifications table
```sql
-- File: database/supabase-notifications-FIXED.sql
-- ✅ This is the WORKING version
-- Copy entire file content and run in SQL Editor
```

**Verify:**
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'image_verifications';

-- Should show: rejectionReason column

SELECT * FROM notifications LIMIT 1;
-- Should show table structure
```

---

## **🎯 TESTING SCENARIOS**

### **Scenario 1: Admin Flags Image with Reason** ✅

**Steps:**
1. Login as **ADMIN** user
2. Navigate to Farmer Dashboard (Admin view)
3. Click on any batch's "Stages" button
4. Find an uploaded image
5. Click ❌ **"Flag as Fake"** button
6. **Dialog should open** asking for rejection reason
7. Type: `"Stock image detected, not from actual farm location"`
8. Click **"Flag as Fake"** button in dialog

**Expected Results:**
- ✅ Dialog closes
- ✅ Toast shows: "Image flagged as fake with reason"
- ✅ Image gets red border/overlay
- ✅ Red ❌ badge appears on image

**Database Check:**
```sql
-- Check if rejection reason was saved
SELECT "imageUrl", "verificationStatus", "rejectionReason", "verifiedAt"
FROM image_verifications
WHERE "verificationStatus" = 'FAKE'
ORDER BY "verifiedAt" DESC
LIMIT 5;
```

**Check Notification Created:**
```sql
-- Check if farmer got notification
SELECT * FROM notifications
WHERE type = 'IMAGE_FLAGGED'
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

### **Scenario 2: Farmer Sees Notification** 🔔

**Steps:**
1. Logout from Admin
2. Login as the **FARMER** who uploaded the image
3. Look at **header** - should see 🔔 bell icon with red badge (1+)
4. Click the bell icon

**Expected Results:**
- ✅ Notification panel opens
- ✅ Shows notification: "❌ Image Flagged"
- ✅ Message includes rejection reason
- ✅ Red background/border on notification
- ✅ Clicking notification marks it as read

**Test Actions:**
- Click notification → badge count decreases
- Click "Mark all read" → all turn gray
- Click X on notification → deletes it

---

### **Scenario 3: Farmer Views Flagged Image** 🖼️

**Steps:**
1. As farmer, go to your dashboard
2. Click on the batch with flagged image
3. Click "Stages" button
4. Look at the images for that stage

**Expected Results:**
- ✅ Flagged image has **RED BORDER**
- ✅ Shows badge: "❌ Flagged"
- ✅ Click on image → dialog opens
- ✅ Dialog shows rejection reason
- ✅ Shows "Reupload Image" button

---

### **Scenario 4: Admin Verifies Image as Real** ✅

**Steps:**
1. Login as ADMIN
2. Navigate to any farmer's batch
3. Click ✅ **"Mark as Real"** on an image

**Expected Results:**
- ✅ Toast: "Image verified as authentic"
- ✅ Green checkmark appears
- ✅ Farmer gets notification

**Database Check:**
```sql
SELECT "imageUrl", "verificationStatus", "verifiedAt"
FROM image_verifications
WHERE "verificationStatus" = 'REAL'
ORDER BY "verifiedAt" DESC
LIMIT 5;
```

**Notification Check:**
```sql
SELECT * FROM notifications
WHERE type = 'IMAGE_VERIFIED'
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

### **Scenario 5: Check Batch Verification Status** 📊

**Steps:**
1. Get a batch ID from database or URL
2. Test the API endpoint

**API Call:**
```bash
curl "http://localhost:3005/api/batches/verify-status?batchId=YOUR_BATCH_ID"
```

**Or in browser:**
```
http://localhost:3005/api/batches/verify-status?batchId=YOUR_BATCH_ID
```

**Expected Response:**
```json
{
  "batchId": "...",
  "batchCode": "FB001",
  "totalStages": 7,
  "totalImages": 14,
  "verifiedImages": 10,
  "flaggedImages": 2,
  "pendingImages": 2,
  "allImagesVerified": false,
  "readyForBlockchain": false,
  "verificationPercentage": 71,
  "stageVerifications": [...]
  "message": "⚠️ 2 image(s) flagged - needs correction"
}
```

**Test Different Scenarios:**
- All images verified → `readyForBlockchain: true`
- Some flagged → `message shows warning`
- Some pending → `message shows pending count`

---

### **Scenario 6: Test Notification Bell Auto-Refresh** 🔄

**Steps:**
1. Login as Farmer
2. Keep dashboard open
3. In another tab/browser, login as Admin
4. Admin flags an image belonging to that farmer
5. Wait 30 seconds (auto-refresh interval)

**Expected Results:**
- ✅ Bell badge updates automatically (1+ appears)
- ✅ No page refresh needed
- ✅ Click bell → new notification shows up

---

## **🐛 WHAT TO LOOK FOR (BUGS TO REPORT)**

### **Check These:**
1. ❌ **Rejection reason not saved** → Check SQL script ran
2. ❌ **Notification not created** → Check browser console for errors
3. ❌ **Bell icon not showing** → Check if user is logged in
4. ❌ **Images not showing status** → Check API `/api/image-verification`
5. ❌ **Dialog not opening** → Check browser console
6. ❌ **Badge count wrong** → Check notifications API response

### **Browser Console Errors:**
Open: F12 → Console tab
Look for:
- Red error messages
- Failed API calls (status 400, 500)
- TypeScript errors

### **Network Tab (F12 → Network):**
Check these API calls succeed:
- `/api/image-verification` (POST) - should return 200
- `/api/notifications` (GET) - should return 200
- `/api/notifications` (POST) - should return 201
- `/api/batches/verify-status` - should return 200

---

## **📸 SCREENSHOTS TO SHARE**

Please share screenshots of:
1. ✅ Admin dialog with rejection reason input
2. ✅ Farmer notification bell with badge
3. ✅ Notification panel with flagged image notification
4. ✅ Flagged image with red border in farmer dashboard
5. ✅ Rejection reason dialog when farmer clicks flagged image
6. ✅ Batch verification status API response (JSON)

---

## **🔍 DATABASE VERIFICATION QUERIES**

Run these in Supabase SQL Editor:

```sql
-- 1. Check all verifications
SELECT 
  iv."imageUrl",
  iv."verificationStatus",
  iv."rejectionReason",
  u.name as verified_by_name,
  iv."verifiedAt"
FROM image_verifications iv
LEFT JOIN users u ON iv."verifiedBy" = u.id
ORDER BY iv."verifiedAt" DESC
LIMIT 10;

-- 2. Check all notifications
SELECT 
  n.type,
  n.title,
  n.message,
  n.read,
  u.name as user_name,
  n."createdAt"
FROM notifications n
LEFT JOIN users u ON n."userId" = u.id
ORDER BY n."createdAt" DESC
LIMIT 10;

-- 3. Count notifications by type
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications
GROUP BY type;

-- 4. Find flagged images
SELECT 
  b."batchCode",
  s.name as stage_name,
  iv."rejectionReason",
  u.name as farmer_name
FROM image_verifications iv
JOIN batches b ON iv."batchId" = b.id
JOIN stages s ON iv."stageId" = s.id
JOIN users u ON iv."farmerId" = u.id
WHERE iv."verificationStatus" = 'FAKE';
```

---

## **✅ TESTING CHECKLIST**

Mark these off as you test:

- [ ] SQL scripts executed successfully
- [ ] Admin can flag image with reason
- [ ] Rejection reason dialog works
- [ ] Rejection reason saves to database
- [ ] Notification auto-created when image flagged
- [ ] Notification auto-created when image verified
- [ ] Farmer sees notification bell
- [ ] Bell shows correct unread count
- [ ] Clicking notification marks as read
- [ ] Flagged images show red border
- [ ] Clicking flagged image shows rejection dialog
- [ ] Batch verification status API works
- [ ] API returns correct counts
- [ ] `readyForBlockchain` flag works correctly
- [ ] Auto-refresh of notifications (30 sec)

---

## **🚀 NEXT STEPS AFTER TESTING**

Once all tests pass:
1. ✅ Confirm all features working
2. ✅ Report any bugs you find
3. ✅ We'll fix bugs together
4. ✅ Then move to **BLOCKCHAIN INTEGRATION** 🔗

Let me know what works and what doesn't! 🎉

# 🚀 DEPLOYMENT GUIDE - Settlement System Fix

## Pre-Deployment Checklist

- [ ] Review all code changes
- [ ] Backup production database
- [ ] Test in development environment first
- [ ] Verify all team members are aware of the deployment

## Step-by-Step Deployment

### 1. **Backup Database** (CRITICAL!)

```bash
# MongoDB backup
mongodump --uri="mongodb://your-connection-string" --out=./backup-$(date +%Y%m%d)

# Verify backup was created
ls -lh ./backup-*
```

### 2. **Deploy Code to Server**

```bash
# Commit changes
git add .
git commit -m "fix(group-transactions): Separate settlements from expenses for accurate calculations

- Added settlements array to GroupTransaction schema
- Updated calculateGroupBalances to process settlements correctly
- Fixed settleDebt and settleMultipleDebts to use new settlements array
- Removed isSettledItem checks (no longer needed)
- Added migration script to clean up existing data"

# Push to repository
git push origin main

# Deploy to server (adjust for your deployment method)
# Example for PM2:
ssh your-server
cd /path/to/app
git pull
npm install
pm2 restart teddy-backend
```

### 3. **Run Migration**

Choose ONE of these methods:

#### Option A: Via API (Recommended)

```bash
# 1. First, temporarily add migration route to your router
# In groupTransection.route.ts, add:
# import migrationController from './migration.controller';
# groupTransactionRouter.post('/migrate/settlements', auth([userRole.admin]), migrationController.runSettlementMigration);

# 2. Call the migration endpoint
curl -X POST https://your-api.com/groupTransaction/migrate/settlements \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# 3. Check the response - should show:
# {
#   "status": "success",
#   "data": {
#     "groupsProcessed": X,
#     "settlementsMoved": Y
#   }
# }
```

#### Option B: Direct Script Execution

```bash
# SSH into server
ssh your-server
cd /path/to/app

# Create a one-time migration script
cat > run-migration.ts << 'EOF'
import mongoose from 'mongoose';
import { migrateSettlements } from './src/modules/groupTransection/migration-cleanup-settlements';

async function run() {
    await mongoose.connect(process.env.MONGO_URI!);
    const result = await migrateSettlements();
    console.log('Migration complete:', result);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
EOF

# Run it
npx ts-node run-migration.ts

# Clean up
rm run-migration.ts
```

#### Option C: Via MongoDB Shell (Manual)

```javascript
// Connect to MongoDB
mongosh "mongodb://your-connection-string"

// Switch to your database
use your_database_name

// Find groups with settlement expenses
db.grouptransactions.find({
  "groupExpenses": {
    $elemMatch: {
      $or: [
        { "isSettledItem": true },
        { "note": /Settlement:/i }
      ]
    }
  }
}).count()

// The migration script will handle moving these
```

### 4. **Verify Migration Success**

```bash
# Check logs
pm2 logs teddy-backend

# Test APIs
curl -X GET https://your-api.com/groupTransaction/getGroups \
  -H "Authorization: Bearer USER_TOKEN"

curl -X GET https://your-api.com/groupTransaction/getGroupTransactions/1762329852 \
  -H "Authorization: Bearer USER_TOKEN"

curl -X GET https://your-api.com/groupTransaction/getGroupStatus/1762329852 \
  -H "Authorization: Bearer USER_TOKEN"
```

### 5. **Validation Tests**

Run these tests to ensure everything works:

#### Test 1: Check Group List
```bash
GET /groupTransaction/getGroups

Expected:
✅ financialSummary.youllPay should be accurate
✅ financialSummary.youllCollect should be accurate
✅ groupStats.totalExpenses should NOT include settlements
✅ No "Settlement:" expenses in the response
```

#### Test 2: Check Group Transactions
```bash
GET /groupTransaction/getGroupTransactions/:groupId

Expected:
✅ expenses.list should only contain real expenses
✅ summary.totalExpenses should be correct
✅ summary.youllPay should be accurate
✅ summary.youllCollect should be accurate
```

#### Test 3: Check Group Status
```bash
GET /groupTransaction/getGroupStatus/:groupId

Expected:
✅ summary.netBalance should be accurate
✅ categoryWise should only show real expense categories
✅ personWise calculations should be correct
```

#### Test 4: New Settlement
```bash
POST /groupTransaction/:groupId/settle-debt
{
  "fromEmail": "user1@example.com",
  "toEmail": "user2@example.com",
  "amount": 50
}

Expected:
✅ Should complete successfully
✅ Should update balances correctly
✅ Should NOT create a new expense
✅ Check database: settlements array should have new entry
```

### 6. **Database Verification**

```javascript
// Connect to MongoDB
mongosh "mongodb://your-connection-string"
use your_database_name

// 1. Check that settlements were migrated
db.grouptransactions.findOne({ groupId: 1762329852 })

// Verify:
// - groupExpenses array has NO settlement items
// - settlements array exists and has entries
// - No items with isSettledItem: true

// 2. Count total settlements
db.grouptransactions.aggregate([
  { $unwind: "$settlements" },
  { $count: "totalSettlements" }
])

// 3. Verify no settlement expenses remain
db.grouptransactions.find({
  "groupExpenses.note": /Settlement:/i
}).count()
// Should return 0
```

### 7. **Monitor for Issues**

```bash
# Watch logs for errors
pm2 logs teddy-backend --lines 100 --err

# Check application metrics
pm2 monit

# Monitor API response times
# Use your monitoring tool (New Relic, DataDog, etc.)
```

## Rollback Plan (If Needed)

If something goes wrong:

### Quick Rollback Steps

1. **Stop the application**
   ```bash
   pm2 stop teddy-backend
   ```

2. **Restore from backup**
   ```bash
   mongorestore --uri="mongodb://your-connection-string" --drop ./backup-YYYYMMDD
   ```

3. **Revert code**
   ```bash
   git revert HEAD
   git push origin main
   # Redeploy previous version
   ```

4. **Restart application**
   ```bash
   pm2 restart teddy-backend
   ```

## Post-Deployment

### Clean Up (Optional)

After verifying everything works for a few days:

1. **Remove migration route** (if you added it temporarily)
   ```typescript
   // Remove from groupTransection.route.ts
   // groupTransactionRouter.post('/migrate/settlements', ...)
   ```

2. **Archive migration files** (optional)
   ```bash
   mkdir -p archive/migration-2024-11-06
   mv src/modules/groupTransection/migration-*.ts archive/migration-2024-11-06/
   ```

### Monitor These Metrics

- [ ] API response times (should be same or better)
- [ ] Error rates (should not increase)
- [ ] User-reported calculation issues (should decrease to zero)
- [ ] Database query performance (should be similar or better)

## Troubleshooting

### Issue: Migration shows 0 groups processed

**Cause:** No settlement expenses found OR already migrated
**Solution:** Check database manually for settlement items

### Issue: Balance calculations still wrong

**Cause:** Cache or frontend using old data
**Solution:** 
- Clear backend cache if you have any
- Have users refresh their apps
- Check API responses directly (not through frontend)

### Issue: "settlements is not defined" error

**Cause:** Migration not run properly
**Solution:** Run migration again or manually initialize settlements arrays

```javascript
// MongoDB fix
db.grouptransactions.updateMany(
  { settlements: { $exists: false } },
  { $set: { settlements: [] } }
)
```

## Success Criteria

✅ All existing groups have `settlements` array (even if empty)  
✅ No `groupExpenses` contain settlement items  
✅ API `/getGroupTransactions` returns accurate totals  
✅ API `/getGroupStatus` returns accurate balances  
✅ New settlements create entries in `settlements` array  
✅ No errors in application logs  
✅ No user-reported calculation issues  

## Timeline Estimate

- Backup: 5-10 minutes
- Code deployment: 5 minutes
- Migration execution: 1-5 minutes (depends on data size)
- Verification: 10-15 minutes
- **Total: ~30 minutes**

## Support Contact

If you encounter issues during deployment:
1. Check logs first
2. Verify migration completed
3. Test with a single group manually
4. Restore from backup if necessary

---

**Last Updated:** November 6, 2025  
**Author:** GitHub Copilot  
**Version:** 1.0

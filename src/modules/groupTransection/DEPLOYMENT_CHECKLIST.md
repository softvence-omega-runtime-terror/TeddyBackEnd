# 📋 DEPLOYMENT CHECKLIST

Copy this checklist and check off items as you complete them.

## Pre-Deployment

- [ ] **Code Review**
  - [ ] Read COMPLETE.md to understand all changes
  - [ ] Review groupTransection.model.ts changes
  - [ ] Review groupTransection.interface.ts changes
  - [ ] Review groupTransection.service.ts changes
  - [ ] No TypeScript compilation errors

- [ ] **Testing in Development**
  - [ ] Application starts without errors
  - [ ] GET /groupTransaction/getGroups works
  - [ ] GET /groupTransaction/getGroupTransactions/:groupId works
  - [ ] GET /groupTransaction/getGroupStatus/:groupId works
  - [ ] POST /groupTransaction/:groupId/settle-debt works
  - [ ] POST /groupTransaction/:groupId/settle-multiple-debts works
  - [ ] Calculations appear correct in dev environment

- [ ] **Documentation Review**
  - [ ] Read DEPLOYMENT_GUIDE.md
  - [ ] Read VISUAL_GUIDE.md
  - [ ] Understand rollback process
  - [ ] Have database backup strategy ready

## Deployment Day

### Step 1: Backup (CRITICAL!)

- [ ] **Database Backup**
  - [ ] Run: `mongodump --uri="..." --out=./backup-$(date +%Y%m%d)`
  - [ ] Verify backup files exist: `ls -lh ./backup-*`
  - [ ] Note backup location: ________________
  - [ ] Test backup can be restored (optional but recommended)

### Step 2: Deploy Code

- [ ] **Git Operations**
  - [ ] Commit changes: `git add .`
  - [ ] Commit with message: `git commit -m "fix: Separate settlements from expenses"`
  - [ ] Push to repository: `git push origin main`
  
- [ ] **Server Deployment**
  - [ ] Pull latest code on server: `git pull`
  - [ ] Install dependencies: `npm install`
  - [ ] Build if needed: `npm run build`
  - [ ] Restart application: `pm2 restart app-name` (or your method)
  - [ ] Check application is running: `pm2 status`

### Step 3: Run Migration

Choose ONE method and check it off:

- [ ] **Option A: Via API Endpoint**
  - [ ] Add migration route temporarily (if needed)
  - [ ] Call: `POST /groupTransaction/migrate/settlements`
  - [ ] With admin authorization token
  - [ ] Note response: _____ groups processed, _____ settlements moved
  - [ ] Check for errors in response

- [ ] **Option B: Direct Script**
  - [ ] Create migration runner script
  - [ ] Run: `npx ts-node run-migration.ts`
  - [ ] Note output: _____ groups processed, _____ settlements moved
  - [ ] Check for errors in output
  - [ ] Clean up script file

### Step 4: Verify Migration

- [ ] **Check Logs**
  - [ ] View application logs: `pm2 logs`
  - [ ] No errors related to settlements
  - [ ] No errors related to groupExpenses

- [ ] **Database Verification**
  ```javascript
  // Run in MongoDB shell
  - [ ] Connect to database
  - [ ] Check sample group: db.grouptransactions.findOne({ groupId: _____ })
  - [ ] Verify settlements array exists
  - [ ] Verify no settlement items in groupExpenses
  - [ ] Count total settlements: db.grouptransactions.aggregate([{$unwind:"$settlements"},{$count:"total"}])
  - [ ] Note total settlements: _____
  ```

### Step 5: API Testing

- [ ] **Test GET /groupTransaction/getGroups**
  - [ ] Returns 200 status
  - [ ] financialSummary.youllPay looks accurate
  - [ ] financialSummary.youllCollect looks accurate
  - [ ] groupStats.totalExpenses does NOT include settlements
  - [ ] No settlement items in any expense lists

- [ ] **Test GET /groupTransaction/getGroupTransactions/:groupId**
  - [ ] Returns 200 status
  - [ ] summary.totalExpenses looks correct
  - [ ] summary.youllPay looks accurate
  - [ ] summary.youllCollect looks accurate
  - [ ] expenses.list contains only real expenses
  - [ ] expenses.count is correct

- [ ] **Test GET /groupTransaction/getGroupStatus/:groupId**
  - [ ] Returns 200 status
  - [ ] summary.netBalance looks accurate
  - [ ] categoryWise breakdown looks correct
  - [ ] personWise breakdown looks correct
  - [ ] No "Settlement:" categories

- [ ] **Test POST /groupTransaction/:groupId/settle-debt**
  - [ ] Create a test settlement
  - [ ] Returns 200 status
  - [ ] Balances update correctly
  - [ ] Check database: settlement in settlements array
  - [ ] Check database: NO new expense created
  - [ ] Verify calculations still accurate

- [ ] **Test POST /groupTransaction/:groupId/settle-multiple-debts**
  - [ ] Create multiple test settlements
  - [ ] Returns 200 status
  - [ ] All balances update correctly
  - [ ] Check database: all settlements in settlements array
  - [ ] Check database: NO new expenses created
  - [ ] batchId is present in response

### Step 6: User Testing

- [ ] **Test with Real User**
  - [ ] User can view groups
  - [ ] User sees accurate balances
  - [ ] User can create new expense
  - [ ] User can settle debt
  - [ ] User sees updated balances after settlement

### Step 7: Monitoring

- [ ] **Application Health**
  - [ ] Application is running: `pm2 status`
  - [ ] No memory leaks: `pm2 monit`
  - [ ] Response times normal
  - [ ] Error rate normal (check monitoring tool)

- [ ] **Database Health**
  - [ ] Connection pool stable
  - [ ] Query performance normal
  - [ ] No unusual errors in MongoDB logs

## Post-Deployment (First 24 Hours)

### Immediate (First Hour)

- [ ] **Monitor Closely**
  - [ ] Watch application logs continuously
  - [ ] Check for any error spikes
  - [ ] Monitor API response times
  - [ ] Check user activity/feedback

### Within 24 Hours

- [ ] **Verify Stability**
  - [ ] No increase in error rates
  - [ ] No user complaints about calculations
  - [ ] No performance degradation
  - [ ] Settlement operations working normally

- [ ] **Data Validation**
  - [ ] Spot-check 5-10 groups manually
  - [ ] Verify balances make sense
  - [ ] Confirm no settlement items in expenses
  - [ ] Confirm settlements array populated

## Cleanup (After 1 Week of Stable Operation)

- [ ] **Optional Code Cleanup**
  - [ ] Remove migration route (if added temporarily)
  - [ ] Archive migration files
  - [ ] Update documentation with deployment date

## Rollback (If Needed)

If something goes wrong, check these boxes:

- [ ] **Stop Application**
  - [ ] Run: `pm2 stop app-name`

- [ ] **Restore Database**
  - [ ] Run: `mongorestore --uri="..." --drop ./backup-YYYYMMDD`
  - [ ] Verify restore completed

- [ ] **Revert Code**
  - [ ] Run: `git revert HEAD`
  - [ ] Push: `git push origin main`
  - [ ] Deploy previous version

- [ ] **Restart Application**
  - [ ] Run: `pm2 restart app-name`
  - [ ] Verify application is working

- [ ] **Document Issue**
  - [ ] Note what went wrong: ________________
  - [ ] Note error messages: ________________
  - [ ] Plan next steps: ________________

## Sign-Off

**Deployment completed by:** ________________  
**Date:** ________________  
**Time:** ________________  

**Migration results:**
- Groups processed: _____
- Settlements moved: _____
- Errors encountered: _____

**Post-deployment verification:**
- [ ] All tests passed
- [ ] No errors in logs
- [ ] Users reporting correct calculations
- [ ] System stable

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Reference

**Backup command:**
```bash
mongodump --uri="mongodb://..." --out=./backup-$(date +%Y%m%d)
```

**Restore command (if needed):**
```bash
mongorestore --uri="mongodb://..." --drop ./backup-YYYYMMDD
```

**Check migration:**
```bash
POST /groupTransaction/migrate/settlements
```

**Key endpoints to test:**
- GET /groupTransaction/getGroups
- GET /groupTransaction/getGroupTransactions/:groupId
- GET /groupTransaction/getGroupStatus/:groupId
- POST /groupTransaction/:groupId/settle-debt

**Success criteria:**
✅ No compilation errors  
✅ Migration completed  
✅ All tests pass  
✅ No errors in logs  
✅ Balances accurate  

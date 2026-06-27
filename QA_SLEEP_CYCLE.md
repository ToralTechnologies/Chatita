# QA Checklist — Sleep & Cycle Tracking

## Setup
- [ ] `npx prisma db push` completed successfully
- [ ] `npx tsc --noEmit` passes clean
- [ ] `npx next build` passes clean

## Onboarding (profile-setup)
- [ ] "Sleep & Body Patterns" collapsible section appears
- [ ] Section can be expanded and collapsed
- [ ] Sleep goal (hours), bedtime, wake time, and notes fields accept input
- [ ] Section can be skipped entirely — no required fields
- [ ] Cycle tracking question shows radio options:
  - Yes / Maybe later / No / Not relevant to me / Prefer not to say
- [ ] Selecting "Yes" shows optional cycle length, period length, notes fields
- [ ] Selecting any other option does NOT show cycle fields
- [ ] Form submission saves sleep fields to DB (verify via /api/user/profile)
- [ ] tracksMenstrualCycle = true only when user selects "Yes"
- [ ] tracksMenstrualCycle = false for all other choices

## Settings Page
- [ ] SleepBodyProfileCard appears in Settings (mobile and desktop)
- [ ] Card shows current sleep and cycle preferences
- [ ] Edit mode opens form
- [ ] Can toggle sleep tracking on/off
- [ ] Can set sleep goal hours, bedtime, wake time, notes
- [ ] Can enable/disable menstrual cycle tracking
- [ ] When cycle tracking enabled: cycle length, period length, notes fields appear
- [ ] When cycle tracking disabled: cycle fields hidden and saved as null
- [ ] Save button updates profile via PATCH /api/user/profile
- [ ] Cancel button reverts changes

## Dashboard / Home
- [ ] SleepCard appears for all users (below movement card)
- [ ] CycleCard is hidden when tracksMenstrualCycle = false
- [ ] CycleCard appears when tracksMenstrualCycle = true
- [ ] SleepCard opens with collapsible form
- [ ] Can log: bedtime, wake time, quality, wake energy, night wakeups, stress, caffeine, notes
- [ ] Sleep log saved to /api/sleep → 201 response
- [ ] Card shows "✓ Saved!" confirmation
- [ ] CycleCard (if shown) opens with collapsible form
- [ ] Can log: cycle phase, flow (for period phase), symptoms, appetite, energy, glucose notes, notes
- [ ] Flow field only visible when cycle phase = "period"
- [ ] Cycle log saved to /api/cycle → 201 response
- [ ] If user not opted in: /api/cycle POST returns 403

## API Routes

### /api/sleep
- [ ] GET returns empty logs for new user
- [ ] POST creates sleep log — returns 201
- [ ] POST with invalid wakeEnergy (e.g. 11) returns 400
- [ ] POST with negative totalSleepMinutes returns 400
- [ ] POST calculates totalSleepMinutes from sleepStart + wakeTime if not provided
- [ ] PATCH /api/sleep/[id] updates existing log
- [ ] PATCH with wrong userId returns 404
- [ ] DELETE /api/sleep/[id] removes log
- [ ] DELETE with wrong userId returns 404

### /api/cycle
- [ ] GET returns 403 if tracksMenstrualCycle = false
- [ ] POST returns 403 if tracksMenstrualCycle = false
- [ ] GET returns logs when tracksMenstrualCycle = true
- [ ] POST creates cycle log when opted in — returns 201
- [ ] POST with cycleDay = 0 returns 400
- [ ] POST with energy = 11 returns 400
- [ ] PATCH /api/cycle/[id] updates existing log
- [ ] DELETE /api/cycle/[id] removes log

### /api/user/profile
- [ ] GET returns: tracksSleep, sleepGoalHours, typicalBedtime, typicalWakeTime, sleepTrackingNotes
- [ ] GET returns: tracksMenstrualCycle, typicalCycleLength, typicalPeriodLength, cycleTrackingNotes
- [ ] PATCH correctly saves all sleep fields
- [ ] PATCH correctly saves all cycle fields
- [ ] PATCH tracksMenstrualCycle = false clears related UI

## AI Chat
- [ ] Recent sleep data is included in AI context when user logged sleep
- [ ] AI responds with cautious language: "may affect," "could be related," not "caused by"
- [ ] AI mentions cycle context only when tracksMenstrualCycle = true in profile
- [ ] AI does not mention periods/cycles for users who have not opted in
- [ ] AI does not say "your sleep caused your glucose spike"
- [ ] AI does not say "your period caused your high glucose"
- [ ] AI does not shame poor sleep
- [ ] AI accounts for GLP-1 fatigue when sleep + nausea are both present

## Language and Tone
- [ ] No "women's health" label used anywhere
- [ ] Cycle section is always labeled "menstrual cycle tracking, if relevant to you" or similar
- [ ] No gender assumptions in copy
- [ ] No fertility or pregnancy assumptions
- [ ] Cautious language used: "may affect," "could be related," "worth tracking"
- [ ] Cycle tracking described as optional throughout

## Privacy
- [ ] Cycle card hidden when not opted in
- [ ] Cycle API returns 403 when not opted in
- [ ] No cycle data in AI context when tracksMenstrualCycle = false
- [ ] Disabling cycle tracking in settings hides cycle card immediately on next load

import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { type AddressInfo } from 'net';
import app from '../app.js';
import User from '../models/user.model.js';
import {
  Batch,
  RecurringScheduleSlot,
  ScheduleOverride,
  ClassAlertSubscription,
} from '../models/timetable.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

async function runTimetableE2ETests() {
  console.log('🚀 Starting Batch Timetable & Shift Schedule E2E Test Suite...\n');

  let server: any;
  let baseUrl: string;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection established.');

    server = app.listen(0);
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}/api/timetable`;
    console.log(`📡 In-memory test server listening on port ${addr.port}\n`);

    // 1. Get or Create Test Student & Admin
    let student: any = await User.findOne({ role: 'student' }).select('+authVersion');
    if (!student) {
      student = await User.create({
        name: 'Test Student Aspirant',
        rollNo: 'TEST_STU_TIME',
        role: 'student',
        email: 'test.student.time@rla.com',
        isEmailVerified: true,
      });
      student = await User.findById(student._id).select('+authVersion');
    }

    let admin: any = await User.findOne({ role: 'admin' }).select('+authVersion');
    if (!admin) {
      admin = await User.create({
        name: 'Academic Dean Admin',
        rollNo: 'TEST_ADM_TIME',
        role: 'admin',
        email: 'admin.time@rla.com',
        isEmailVerified: true,
      });
      admin = await User.findById(admin._id).select('+authVersion');
    }

    if (!student || !admin) {
      throw new Error('Student or Admin initialization failed.');
    }

    // Generate tokens
    const studentTokens = generateAuthTokens(
      student._id.toString(),
      student.authVersion || 0,
      student.role
    );
    const studentAuthHeader = {
      Authorization: `Bearer ${studentTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    const adminTokens = generateAuthTokens(
      admin._id.toString(),
      admin.authVersion || 0,
      admin.role
    );
    const adminAuthHeader = {
      Authorization: `Bearer ${adminTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    const batch = await Batch.findOne({ code: 'FJS-2025' });
    if (!batch) {
      throw new Error('FJS-2025 batch not found. Please run seedTimetable first.');
    }

    // Clean up student's prior alerts and test overrides for test idempotency
    await ClassAlertSubscription.deleteMany({ student: student._id });
    await ScheduleOverride.deleteMany({ batch: batch._id, dateIST: '2026-09-28' });

    // =========================================================================
    // Step 1: Student fetches Monday Morning Schedule (GET /api/timetable/my-schedule)
    // =========================================================================
    console.log("Step 1: Student fetches Monday Morning Schedule (GET /api/timetable/my-schedule)...");
    const res1 = await fetch(
      `${baseUrl}/my-schedule?dayOfWeek=Monday&shiftId=shift-morning`,
      { headers: studentAuthHeader }
    );

    assert.strictEqual(res1.status, 200, `Step 1 expected 200 OK, got ${res1.status}`);
    const data1: any = await res1.json();
    assert.strictEqual(data1.success, true);

    const { header, schedule } = data1;
    console.log(`  ✅ PASS: Batch: "${header.batchName}" • ${header.sessionName}`);
    console.log(`  ✅ PASS: Subtitle: "${header.subtitle}"`);
    console.log(`  ✅ PASS: Day: ${schedule.dayOfWeek} • Found ${schedule.slots.length} class slots`);

    // Verify slots match reference UI
    const cpcSlot = schedule.slots.find((s: any) => s.subject.includes('CPC'));
    const bnsSlot = schedule.slots.find((s: any) => s.subject.includes('BNS'));
    const testSlot = schedule.slots.find((s: any) => s.type === 'Test Series');

    assert.ok(cpcSlot, 'Missing CPC slot in Monday Morning');
    assert.ok(bnsSlot, 'Missing BNS slot in Monday Morning');
    assert.ok(testSlot, 'Missing Test Series slot in Monday Morning');

    console.log(`  ✅ PASS: Slot 1: ${cpcSlot.time} • ${cpcSlot.subject} (${cpcSlot.faculty}) in ${cpcSlot.room}`);
    console.log(`  ✅ PASS: Slot 2: ${bnsSlot.time} • ${bnsSlot.subject} (${bnsSlot.faculty}) in ${bnsSlot.room}`);
    console.log(`  ✅ PASS: Slot 3: ${testSlot.time} • ${testSlot.subject} (${testSlot.faculty}) in ${testSlot.room}\n`);

    // =========================================================================
    // Step 2: Student switches shift to Evening Shift (POST /api/timetable/switch-shift)
    // =========================================================================
    console.log("Step 2: Student switches shift to Evening Shift (POST /api/timetable/switch-shift)...");
    const res2 = await fetch(`${baseUrl}/switch-shift`, {
      method: 'POST',
      headers: studentAuthHeader,
      body: JSON.stringify({ shiftId: 'shift-evening' }),
    });

    assert.strictEqual(res2.status, 200);
    const data2: any = await res2.json();
    assert.strictEqual(data2.activeShiftId, 'shift-evening');
    console.log('  ✅ PASS: Active shift switched to shift-evening');

    const res2Check = await fetch(`${baseUrl}/my-schedule?dayOfWeek=Monday`, {
      headers: studentAuthHeader,
    });
    const data2Check: any = await res2Check.json();
    console.log(`  ✅ PASS: Retrieved evening schedule with ${data2Check.schedule.slots.length} evening slots\n`);

    // =========================================================================
    // Step 3: Student toggles Class Alert (POST /api/timetable/alerts/toggle)
    // =========================================================================
    console.log("Step 3: Student toggles Class Alert (POST /api/timetable/alerts/toggle)...");
    const res3 = await fetch(`${baseUrl}/alerts/toggle`, {
      method: 'POST',
      headers: studentAuthHeader,
      body: JSON.stringify({ slotId: cpcSlot.slotId, batchId: batch._id }),
    });

    assert.ok(res3.status === 200 || res3.status === 201);
    const data3: any = await res3.json();
    assert.strictEqual(data3.isAlertSet, true);
    console.log(`  ✅ PASS: ${data3.message}`);

    // Re-verify schedule shows isAlertSet = true
    const res3Check = await fetch(
      `${baseUrl}/my-schedule?dayOfWeek=Monday&shiftId=shift-morning`,
      { headers: studentAuthHeader }
    );
    const data3Check: any = await res3Check.json();
    const updatedCpc = data3Check.schedule.slots.find((s: any) => s.slotId === cpcSlot.slotId);
    assert.strictEqual(updatedCpc?.isAlertSet, true);
    console.log('  ✅ PASS: Dynamic alert state persisted in student schedule\n');

    // =========================================================================
    // Step 4: Admin conflict detection engine (POST /api/timetable/admin/check-conflicts)
    // =========================================================================
    console.log("Step 4: Testing Admin Conflict Detection (POST /api/timetable/admin/check-conflicts)...");
    const res4 = await fetch(`${baseUrl}/admin/check-conflicts`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        batchId: batch._id,
        shiftId: 'shift-morning',
        dayOfWeek: 'Monday',
        startTime: '08:30',
        endTime: '10:30',
        facultyId: cpcSlot.faculty,
        roomId: cpcSlot.room,
      }),
    });

    assert.strictEqual(res4.status, 200);
    const data4: any = await res4.json();
    assert.strictEqual(data4.hasConflict, true);
    assert.ok(data4.conflicts.length > 0);
    console.log(`  ✅ PASS: Conflict successfully detected: "${data4.conflicts[0].title}"`);
    console.log(`  ✅ PASS: Warning message: "${data4.conflicts[0].message}"\n`);

    // =========================================================================
    // Step 5: Admin creates Date-Specific Override: Rescheduled class
    // =========================================================================
    console.log("Step 5: Admin creates Schedule Override (POST /api/timetable/admin/overrides)...");
    const testDateIST = '2026-09-28'; // A future Monday

    const res5 = await fetch(`${baseUrl}/admin/overrides`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        dateIST: testDateIST,
        batchId: batch._id,
        shiftId: 'shift-morning',
        slotId: bnsSlot.slotId,
        overrideType: 'rescheduled',
        newStartTime: '11:30',
        newEndTime: '13:30',
        newTimeFormatted: '11:30 AM - 01:30 PM',
        newRoomName: 'Chamber 104',
        reason: 'Division Bench Special Hearing at High Court',
        notifyStudents: true,
      }),
    });

    assert.strictEqual(res5.status, 201);
    const data5: any = await res5.json();
    assert.strictEqual(data5.success, true);
    console.log(`  ✅ PASS: ${data5.message}\n`);

    // =========================================================================
    // Step 6: Student queries future date to verify Reschedule Banner
    // =========================================================================
    console.log("Step 6: Student queries rescheduled date (GET /api/timetable/my-schedule?dateIST=2026-09-28)...");
    const res6 = await fetch(
      `${baseUrl}/my-schedule?dateIST=${testDateIST}&shiftId=shift-morning`,
      { headers: studentAuthHeader }
    );

    assert.strictEqual(res6.status, 200);
    const data6: any = await res6.json();
    const rescheduledSlot = data6.schedule.slots.find((s: any) => s.slotId === bnsSlot.slotId);
    assert.strictEqual(rescheduledSlot?.isRescheduled, true);
    console.log(`  ✅ PASS: Slot marked as isRescheduled: ${rescheduledSlot.time} (Original: ${rescheduledSlot.originalTime})`);
    console.log(`  ✅ PASS: Reschedule reason displayed: "${rescheduledSlot.rescheduleReason}" in ${rescheduledSlot.room}\n`);

    // =========================================================================
    // Step 7: Student exports weekly schedule as iCal (.ics)
    // =========================================================================
    console.log("Step 7: Student exports schedule as iCal (GET /api/timetable/export/ical)...");
    const res7 = await fetch(
      `${baseUrl}/export/ical?shiftId=shift-morning`,
      { headers: studentAuthHeader }
    );

    assert.strictEqual(res7.status, 200);
    const icalText = await res7.text();
    assert.ok(icalText.includes('BEGIN:VCALENDAR'), 'Expected BEGIN:VCALENDAR');
    assert.ok(icalText.includes('BEGIN:VEVENT'), 'Expected BEGIN:VEVENT');
    console.log('  ✅ PASS: Successfully generated RFC-5545 iCalendar stream with VEVENT blocks\n');

    console.log('🎉 ALL 7 BATCH TIMETABLE & SHIFT SCHEDULE E2E TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err: any) {
    console.error('❌ E2E TEST SUITE FAILED:', err?.message || err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('MongoDB connection closed gracefully.');
  }
}

runTimetableE2ETests();

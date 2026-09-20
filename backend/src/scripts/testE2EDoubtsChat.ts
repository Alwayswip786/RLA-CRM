import { io, Socket } from 'socket.io-client';

const BASE_URL = 'http://127.0.0.1:8000';

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    rollNo?: string;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runE2ETests() {
  console.log('===========================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E VERIFICATION SUITE');
  console.log('   Academic Doubt Query Engine & Live Chamber Chat System');
  console.log('===========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, detail !== undefined ? detail : '');
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // Wait for server to be ready
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (res.status) break;
      } catch (e) {
        await sleep(1000);
      }
    }

    // -------------------------------------------------------------
    // TEST 1: Authenticate Student & Admin via HTTP REST
    // -------------------------------------------------------------
    console.log('\n--- Step 1: User Authentication ---');

    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'rohit.verma@rajinderlawacademy.com',
        password: 'Judicial@2025',
      }),
    });
    const studentData = (await studentLoginRes.json()) as LoginResponse;
    assert(studentData.success && !!studentData.accessToken, 'Student Rohit Verma logs in successfully');
    const studentToken = studentData.accessToken;
    const studentUser = studentData.user;

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'director@rajinderlawacademy.com',
        password: 'Judicial@2025',
      }),
    });
    const adminData = (await adminLoginRes.json()) as LoginResponse;
    assert(adminData.success && !!adminData.accessToken, 'Admin Adv. Rajinder Sir logs in successfully');
    const adminToken = adminData.accessToken;
    const adminUser = adminData.user;

    // -------------------------------------------------------------
    // TEST 2: REST Doubt Queries Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Formal Doubt Queries REST Lifecycle ---');

    // 2.1 Student lists their queries
    const studentQueriesRes = await fetch(`${BASE_URL}/api/doubts/my-queries`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentQueries = (await studentQueriesRes.json()) as any;
    assert(studentQueries.success && Array.isArray(studentQueries.queries), 'Student fetches my-queries');
    assert(studentQueries.queries.length >= 2, `Student has seeded queries (found ${studentQueries.queries.length})`);

    // 2.2 Student submits a new doubt
    const newDoubtPayload = {
      subject: 'Bhartiya Nyaya Sanhita (BNS)',
      bareActSection: 'Section 103 BNS',
      title: 'Distinction between Murder and Culpable Homicide under BNS 103',
      initialQuestion: 'Sir, how does Section 103 BNS correlate with Exception 1 to 5 regarding sudden provocation?',
      category: 'Bare Act Interpretation',
      priority: 'urgent',
      tags: ['BNS', 'Section 103', 'Culpable Homicide'],
    };

    const createDoubtRes = await fetch(`${BASE_URL}/api/doubts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(newDoubtPayload),
    });
    const createdDoubt = (await createDoubtRes.json()) as any;
    assert(createdDoubt.success && !!createdDoubt.query?.queryNumber, 'Student successfully submits new doubt query');
    const doubtId = createdDoubt.query._id;
    const doubtQueryNumber = createdDoubt.query.queryNumber;
    console.log(`     Created Doubt: ${doubtQueryNumber} (ID: ${doubtId})`);

    // 2.3 Admin views triage queue & statistics
    const adminQueriesRes = await fetch(`${BASE_URL}/api/doubts/admin/all?limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminQueries = (await adminQueriesRes.json()) as any;
    assert(adminQueries.success && !!adminQueries.stats, 'Admin retrieves triage queue with KPI statistics');
    console.log('     Admin KPI Stats:', JSON.stringify(adminQueries.stats));
    assert(adminQueries.stats.total >= 6, 'KPI stats reflects total >= 6 queries');

    // 2.4 Admin replies to the student's query
    const adminReplyPayload = {
      message:
        'Under BNS Section 103, culpable homicide is murder if the act falls within clauses 1-4, subject to the 5 exceptions. Please refer to K.M. Nanavati v. State of Maharashtra for Grave and Sudden Provocation rules.',
    };
    const replyRes = await fetch(`${BASE_URL}/api/doubts/${doubtId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(adminReplyPayload),
    });
    const replyData = (await replyRes.json()) as any;
    assert(replyData.success && replyData.thread?.length === 2, 'Admin posts faculty response to doubt thread');

    // 2.5 Admin updates query status to resolved
    const statusRes = await fetch(`${BASE_URL}/api/doubts/${doubtId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const statusData = (await statusRes.json()) as any;
    assert(statusData.success && statusData.query?.status === 'resolved', 'Admin marks doubt query as RESOLVED');

    // 2.6 Student views updated query detail
    const studentDetailRes = await fetch(`${BASE_URL}/api/doubts/${doubtId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentDetail = (await studentDetailRes.json()) as any;
    assert(
      studentDetail.success &&
        studentDetail.query?.status === 'resolved' &&
        studentDetail.query?.thread[1]?.senderRole === 'admin',
      'Student confirms updated thread and resolved status'
    );

    // -------------------------------------------------------------
    // TEST 3: REST Chat Conversations & Unread Counts
    // -------------------------------------------------------------
    console.log('\n--- Step 3: REST Live Chat Conversations & Unread Counts ---');

    // 3.1 Admin lists all student conversations
    const adminConvsRes = await fetch(`${BASE_URL}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminConvs = (await adminConvsRes.json()) as any;
    assert(adminConvs.success && Array.isArray(adminConvs.conversations), 'Admin lists active conversations');
    assert(
      adminConvs.conversations.length >= 2,
      `Admin has at least 2 student conversations (found ${adminConvs.conversations.length})`
    );

    const poojaConv = adminConvs.conversations.find((c: any) => c.studentName?.includes('Pooja'));
    const rohitConv = adminConvs.conversations.find((c: any) => c.studentName?.includes('Rohit'));
    assert(!!poojaConv && poojaConv.unreadCountAdmin >= 1, 'Pooja conversation shows unread badge for faculty');
    assert(!!rohitConv, 'Rohit conversation found in faculty desk');

    // 3.2 Student Rohit fetches his conversation
    const studentConvsRes = await fetch(`${BASE_URL}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentConvs = (await studentConvsRes.json()) as any;
    assert(
      studentConvs.success && studentConvs.conversations.length >= 1,
      'Student fetches own active chamber conversation'
    );
    const conversationId = studentConvs.conversations[0]._id;

    // 3.3 Student Rohit fetches message history
    const messagesRes = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const messagesData = (await messagesRes.json()) as any;
    assert(
      messagesData.success && messagesData.messages?.length >= 4,
      'Student retrieves conversation message stream'
    );

    // -------------------------------------------------------------
    // TEST 4: WebSocket Real-Time Chamber Chat Flow
    // -------------------------------------------------------------
    console.log('\n--- Step 4: WebSocket Chamber Chat Real-Time Flow ---');

    // 4.1 Connect Student Socket
    const studentSocket: Socket = io(`${BASE_URL}/chamber-chat`, {
      auth: { token: studentToken },
      transports: ['websocket'],
    });

    // 4.2 Connect Admin Socket
    const adminSocket: Socket = io(`${BASE_URL}/chamber-chat`, {
      auth: { token: adminToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      let studentConnected = false;
      let adminConnected = false;

      const checkBoth = () => {
        if (studentConnected && adminConnected) {
          assert(true, 'Both Student and Admin connected to /chamber-chat namespace via WebSocket');
          resolve();
        }
      };

      studentSocket.on('connect', () => {
        studentConnected = true;
        checkBoth();
      });

      adminSocket.on('connect', () => {
        adminConnected = true;
        checkBoth();
      });

      setTimeout(() => {
        if (!studentConnected || !adminConnected) {
          reject(new Error(`WebSocket connection timeout (Student: ${studentConnected}, Admin: ${adminConnected})`));
        }
      }, 5000);
    });

    // 4.3 Join conversation room
    await new Promise<void>((resolve, reject) => {
      studentSocket.emit('conversation:join', { conversationId }, (res1: any) => {
        adminSocket.emit('conversation:join', { conversationId }, (res2: any) => {
          if (res1?.success && res2?.success) {
            assert(true, 'Student and Admin joined room: chat:conversation:' + conversationId);
            resolve();
          } else {
            reject(new Error(`Failed to join room: ${JSON.stringify({ res1, res2 })}`));
          }
        });
      });
    });

    await sleep(200);

    // 4.4 Test Typing Indicators
    console.log('     Testing real-time typing indicators...');
    const typingPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Typing indicator timeout')), 4000);
      adminSocket.on('typing:start', (data: { conversationId: string; userId: string; userName: string }) => {
        if (data.conversationId === conversationId && data.userId === String(studentUser._id)) {
          clearTimeout(timeout);
          assert(true, 'Admin received typing:start event with student userId & userName');
          resolve();
        }
      });
    });

    studentSocket.emit('typing:start', { conversationId });
    await typingPromise;
    studentSocket.emit('typing:stop', { conversationId });
    adminSocket.off('typing:start');

    // 4.5 Send live message from Student -> Admin
    console.log('     Testing live message transmission and delivery acknowledgement...');
    const testClientMsgId = `e2e-test-${Date.now()}`;
    const testMessageText = 'Sir, I have reviewed the Mahboob Sahab judgment. Thank you for the guidance!';

    let receivedMsgId = '';
    const receivePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Message receive timeout')), 4000);
      adminSocket.on('message:new', (newMsg: any) => {
        if (newMsg.clientMessageId === testClientMsgId) {
          clearTimeout(timeout);
          receivedMsgId = newMsg._id;
          assert(true, 'Admin received real-time message:new event');
          assert(newMsg.message === testMessageText, 'Message text matches exactly');
          assert(newMsg.deliveryStatus === 'delivered', 'Message marked as delivered because admin is in the room');
          resolve();
        }
      });
    });

    studentSocket.emit(
      'message:send',
      {
        conversationId,
        message: testMessageText,
        clientMessageId: testClientMsgId,
      },
      (ack: any) => {
        assert(ack?.success === true, 'Student received send ack with success=true');
      }
    );

    await receivePromise;
    adminSocket.off('message:new');

    // 4.6 Read Receipt & Gold Double Tick
    console.log('     Testing read receipt propagation (double gold tick)...');
    const readPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Read receipt timeout')), 4000);
      studentSocket.on('message:read', (readData: { conversationId: string; readByUserId: string; readAt: string }) => {
        if (readData.conversationId === conversationId) {
          clearTimeout(timeout);
          assert(true, 'Student received message:read event confirming double gold tick');
          resolve();
        }
      });
    });

    adminSocket.emit('message:read', {
      conversationId,
    });

    await readPromise;
    studentSocket.off('message:read');

    // 4.7 Deduplication / Idempotency Test
    console.log('     Testing message deduplication with duplicate clientMessageId...');
    const dedupePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dedupe timeout')), 4000);
      studentSocket.emit(
        'message:send',
        {
          conversationId,
          message: testMessageText,
          clientMessageId: testClientMsgId, // Duplicate!
        },
        (ack: any) => {
          clearTimeout(timeout);
          assert(ack?.success === true && ack?.duplicate === true, 'Server acknowledges duplicate idempotently (duplicate: true)');
          assert(ack?.message?._id === receivedMsgId, 'Server returned existing message ID without creating duplicate');
          resolve();
        }
      );
    });

    await dedupePromise;

    // 4.8 Clean disconnect
    studentSocket.disconnect();
    adminSocket.disconnect();
    await sleep(200);
    assert(true, 'Sockets cleanly disconnected');

    console.log('\n===========================================================');
    console.log(`🏆 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('   Formal Academic Doubts + Live Chamber Chat are 100% Operational.');
    console.log('===========================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ E2E Verification Suite encountered an error:', error.message, error.cause, error.stack);
    process.exit(1);
  }
}

runE2ETests();

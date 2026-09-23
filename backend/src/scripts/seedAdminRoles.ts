import bcrypt from 'bcryptjs';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import AdminRole from '../models/adminRole.model.js';
import AdminAuditLog from '../models/adminAuditLog.model.js';

export const seedAdminRolesAndStaff = async (): Promise<void> => {
  console.log('🏛️ Initializing Chamber RBAC & Staff Directory Seeding...');

  const defaultPassword = 'Judicial@2025';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // 1. Predefined System Roles
  const systemRolesData = [
    {
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Director / Unrestricted executive clearance across all chamber modules, settings, and governance.',
      isSystemRole: true,
      permissionTier: 'Full Access',
      permissions: ['*'],
    },
    {
      name: 'Academic Admin / Mentor',
      slug: 'academic_mentor',
      description: 'Manages live classroom streams, course curricula, daily digest, timetable, and student doubts.',
      isSystemRole: true,
      permissionTier: 'Academic & Grading',
      permissions: [
        'overview:view',
        'courses:*',
        'live_classes:*',
        'timetable:*',
        'daily_digest:*',
        'doubts:*',
        'notices:view',
        'students:view',
      ],
    },
    {
      name: 'Paper Evaluator',
      slug: 'paper_evaluator',
      description: 'Evaluates handwritten Mains copies, submits structured line-by-line feedback, and assesses tests.',
      isSystemRole: true,
      permissionTier: 'Academic & Grading',
      permissions: ['overview:view', 'mains_evaluation:*', 'tests:view', 'doubts:view'],
    },
    {
      name: 'Admissions Counselor',
      slug: 'admissions_counselor',
      description: 'Manages lead inquiries pipeline, demo requests, student enrollments, and tuition fee records.',
      isSystemRole: true,
      permissionTier: 'Leads & Inquiries',
      permissions: ['overview:view', 'leads:*', 'students:view', 'fees:view', 'notices:view'],
    },
    {
      name: 'Course Manager',
      slug: 'course_manager',
      description: 'Builds ordered modules, lessons, video lectures, Bare Act documents, and curriculum settings.',
      isSystemRole: true,
      permissionTier: 'Curriculum & Media',
      permissions: ['overview:view', 'courses:*', 'live_classes:view', 'vault:*'],
    },
    {
      name: 'Faculty Manager',
      slug: 'faculty_manager',
      description: 'Coordinates faculty rosters, lecture shifts, classroom assignments, and timetable overrides.',
      isSystemRole: true,
      permissionTier: 'Faculty Operations',
      permissions: ['overview:view', 'live_classes:*', 'timetable:*', 'doubts:*', 'notices:view'],
    },
    {
      name: 'Content Manager',
      slug: 'content_manager',
      description: 'Curates and publishes landmark judgments, daily legal digest briefs, and solved PYQs.',
      isSystemRole: true,
      permissionTier: 'Knowledge Vault',
      permissions: ['overview:view', 'daily_digest:*', 'vault:*'],
    },
    {
      name: 'Support Admin',
      slug: 'support_admin',
      description: 'Resolves aspirant support inquiries, broadcasts notice alerts, and tracks student progress.',
      isSystemRole: true,
      permissionTier: 'Student Support',
      permissions: ['overview:view', 'doubts:*', 'students:view', 'notices:view'],
    },
    {
      name: 'Finance Admin',
      slug: 'finance_admin',
      description: 'Administers installment plans, fee concessions, receipts generation, and financial telemetry.',
      isSystemRole: true,
      permissionTier: 'Finance & Accounts',
      permissions: ['overview:view', 'fees:*', 'students:view'],
    },
  ];

  const roleMap = new Map<string, any>();

  for (const roleDef of systemRolesData) {
    let role = await AdminRole.findOne({ slug: roleDef.slug });
    if (!role) {
      role = await AdminRole.create(roleDef);
      console.log(`  ➕ Created System Role: ${role.name} [Tier: ${role.permissionTier}]`);
    } else {
      // Update permissions in case they were updated
      role.permissions = roleDef.permissions;
      role.permissionTier = roleDef.permissionTier;
      await role.save();
    }
    roleMap.set(roleDef.slug, role);
  }

  // 2. Reference Staff Accounts from media_1790028961232.png
  const referenceStaff = [
    {
      name: 'Adv. Rajinder Sir',
      salutation: 'Adv.' as const,
      email: 'rajinder@rajinderlawacademy.com',
      phone: '+91 98111 00001',
      rollNo: 'RLA-DIR-001',
      roleSlug: 'super_admin',
      title: 'Director / Super Admin',
      tier: 'Full Access',
      isSuperAdmin: true,
      minutesAgo: 0, // Active Now
    },
    {
      name: 'Adv. Sharma',
      salutation: 'Adv.' as const,
      email: 'sharma.faculty@rajinderlawacademy.com',
      phone: '+91 98111 00002',
      rollNo: 'RLA-FAC-001',
      roleSlug: 'academic_mentor',
      title: 'Academic Mentor',
      tier: 'Academic & Grading',
      isSuperAdmin: false,
      minutesAgo: 25, // 25 mins ago
    },
    {
      name: 'Adv. R.K. Gupta',
      salutation: 'Adv.' as const,
      email: 'gupta.evaluator@rajinderlawacademy.com',
      phone: '+91 98111 00003',
      rollNo: 'RLA-EVAL-001',
      roleSlug: 'paper_evaluator',
      title: 'Paper Evaluator',
      tier: 'Academic & Grading',
      isSuperAdmin: false,
      minutesAgo: 120, // 2 hours ago
    },
    {
      name: 'Priya Malhotra',
      salutation: 'Ms.' as const,
      email: 'admissions@rajinderlawacademy.com',
      phone: '+91 98111 00004',
      rollNo: 'RLA-ADM-004',
      roleSlug: 'admissions_counselor',
      title: 'Admissions Counselor',
      tier: 'Leads & Inquiries',
      isSuperAdmin: false,
      minutesAgo: 10, // 10 mins ago
    },
  ];

  for (const staffDef of referenceStaff) {
    const role = roleMap.get(staffDef.roleSlug);
    const lastActiveAt = new Date(Date.now() - staffDef.minutesAgo * 60 * 1000);

    let user = await User.findOne({
      $or: [{ email: staffDef.email }, { rollNo: staffDef.rollNo }],
    });
    if (!user) {
      user = await User.create({
        name: staffDef.name,
        salutation: staffDef.salutation,
        email: staffDef.email,
        phone: staffDef.phone,
        rollNo: staffDef.rollNo,
        password: hashedPassword,
        role: staffDef.roleSlug === 'academic_mentor' ? 'faculty' : 'admin',
        adminRoleId: role?._id,
        adminTitle: staffDef.title,
        permissionTier: staffDef.tier,
        isSuperAdmin: staffDef.isSuperAdmin,
        accountStatus: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        needsOnboarding: false,
        themePreference: 'dark',
        authVersion: 1,
        lastActiveAt,
      });
      console.log(`  👤 Seeded Staff: ${staffDef.name} (${staffDef.email}) -> ${staffDef.title}`);
    } else {
      user.name = staffDef.name;
      user.salutation = staffDef.salutation;
      user.email = staffDef.email;
      user.phone = staffDef.phone;
      user.password = hashedPassword;
      user.role = staffDef.roleSlug === 'academic_mentor' ? 'faculty' : 'admin';
      user.adminRoleId = role?._id;
      user.adminTitle = staffDef.title;
      user.permissionTier = staffDef.tier;
      user.isSuperAdmin = staffDef.isSuperAdmin;
      user.accountStatus = 'active';
      user.lastActiveAt = lastActiveAt;
      await user.save();
      console.log(`  🔄 Updated Staff: ${staffDef.name} (${staffDef.email}) -> ${staffDef.title}`);
    }

    if (role) {
      await AdminRole.findByIdAndUpdate(role._id, { $inc: { assignedUsersCount: 1 } });
    }
  }

  // Also ensure director@ and faculty@ exist and link to proper roles for backward compatibility
  const directorUser = await User.findOne({ email: 'director@rajinderlawacademy.com' });
  if (directorUser) {
    const superRole = roleMap.get('super_admin');
    directorUser.adminRoleId = superRole?._id;
    directorUser.isSuperAdmin = true;
    directorUser.adminTitle = 'Director / Super Admin';
    directorUser.permissionTier = 'Full Access';
    await directorUser.save();
  }

  // 3. Realistic Governance Audit Logs
  const superAdmin = await User.findOne({ email: 'rajinder@rajinderlawacademy.com' });
  if (superAdmin) {
    const initialLogsCount = await AdminAuditLog.countDocuments();
    if (initialLogsCount < 4) {
      await AdminAuditLog.create([
        {
          actorId: superAdmin._id,
          actorName: superAdmin.name,
          actorEmail: superAdmin.email,
          actorRole: 'Director / Super Admin',
          action: 'auth:login',
          targetResource: 'admin_user',
          targetResourceId: String(superAdmin._id),
          targetName: superAdmin.name,
          description: 'Director Adv. Rajinder Sir logged into Executive Command Center',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 122.0.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          actorId: superAdmin._id,
          actorName: superAdmin.name,
          actorEmail: superAdmin.email,
          actorRole: 'Director / Super Admin',
          action: 'admin:create',
          targetResource: 'admin_user',
          targetName: 'Priya Malhotra',
          description: 'Created administrative credential for Priya Malhotra with Admissions Counselor clearance',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 122.0.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          actorId: superAdmin._id,
          actorName: superAdmin.name,
          actorEmail: superAdmin.email,
          actorRole: 'Director / Super Admin',
          action: 'role:create',
          targetResource: 'admin_role',
          targetName: 'Paper Evaluator',
          description: 'Created system clearance tier "Paper Evaluator" with Mains grading permissions',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 122.0.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 120 * 60 * 1000),
        },
        {
          actorId: superAdmin._id,
          actorName: superAdmin.name,
          actorEmail: superAdmin.email,
          actorRole: 'Director / Super Admin',
          action: 'content:publish',
          targetResource: 'course',
          targetName: 'Code of Civil Procedure (CPC) Mastery 2026',
          description: 'Published 4 modules and 18 lecture sessions to Judicial Foundation Batch',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 122.0.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 180 * 60 * 1000),
        },
      ]);
      console.log('  🛡️ Seeded Governance Audit Activity Trail.');
    }
  }

  console.log('✅ Chamber RBAC & Staff Management successfully seeded!');
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedAdminRoles.ts') || process.argv[1]?.endsWith('seedAdminRoles.js')) {
  (async () => {
    await connectDB();
    await seedAdminRolesAndStaff();
    await disconnectDB();
    process.exit(0);
  })();
}

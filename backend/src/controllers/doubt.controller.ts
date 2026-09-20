import type { Request, Response } from 'express';
import DoubtQuery from '../models/doubtQuery.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * 1. Get logged-in student's doubt queries
 */
export const getMyQueries = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { status, subject, search } = req.query;
  const filter: Record<string, any> = { student: userId };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(`^${String(subject)}$`, 'i');
  }

  if (search) {
    const searchRegex = new RegExp(String(search), 'i');
    filter.$or = [
      { queryNumber: searchRegex },
      { title: searchRegex },
      { initialQuestion: searchRegex },
      { bareActSection: searchRegex },
      { subject: searchRegex },
    ];
  }

  const queries = await DoubtQuery.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const totalPending = queries.filter((q) => q.status === 'pending' || q.status === 'under_review').length;
  const totalResolved = queries.filter((q) => q.status === 'resolved').length;

  res.status(200).json({
    success: true,
    count: queries.length,
    totalPending,
    totalResolved,
    queries,
  });
});

/**
 * 2. Get single doubt query by ID or Query Number (with thread discussion)
 */
export const getQueryById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const id = String(req.params.id || '');
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

  const query = await DoubtQuery.findOne({
    $or: [{ _id: isMongoId ? id : null }, { queryNumber: id.toUpperCase() }],
  }).lean();

  if (!query) {
    throw new ApiError(404, 'Doubt query record not found.');
  }

  // RBAC Access Check: Students can only access their own queries
  if (user.role === 'student' && String(query.student) !== String(user._id)) {
    throw new ApiError(403, 'Access denied: You do not have permission to view this query.');
  }

  res.status(200).json({
    success: true,
    query,
  });
});

/**
 * 3. Submit a new academic doubt / mentorship query (Student)
 */
export const createDoubtQuery = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const {
    subject,
    bareActSection,
    title,
    initialQuestion,
    category,
    priority,
    tags,
    attachments,
  } = req.body;

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    throw new ApiError(400, 'Legal subject area is required.');
  }

  if (!initialQuestion || typeof initialQuestion !== 'string' || !initialQuestion.trim()) {
    throw new ApiError(400, 'Question or case scenario body is required.');
  }

  const cleanTitle = title?.trim() || initialQuestion.trim().slice(0, 100) + '...';

  // Generate official sequential query number
  const currentYear = new Date().getFullYear();
  const totalCount = await DoubtQuery.countDocuments();
  const nextSeq = String(totalCount + 1).padStart(3, '0');
  const queryNumber = `RLA-DBT-${currentYear}-${nextSeq}`;

  // Initial thread entry
  const initialThreadEntry = {
    senderId: user._id,
    senderRole: user.role as 'student',
    senderName: user.name,
    senderSalutation: user.salutation || 'Adv.',
    message: initialQuestion.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
    createdAt: new Date(),
  };

  const newQuery = await DoubtQuery.create({
    queryNumber,
    student: user._id,
    studentName: user.name,
    rollNo: user.rollNo,
    subject: subject.trim(),
    bareActSection: bareActSection?.trim() || '',
    title: cleanTitle,
    initialQuestion: initialQuestion.trim(),
    category: category || 'Bare Act Interpretation',
    priority: priority === 'urgent' ? 'urgent' : 'normal',
    status: 'pending',
    thread: [initialThreadEntry],
    tags: Array.isArray(tags) ? tags : [],
  });

  res.status(201).json({
    success: true,
    message: 'Academic query submitted successfully to Judicial Faculty Desk.',
    query: newQuery,
  });
});

/**
 * 4. Post a follow-up reply to an existing doubt thread (Student or Faculty/Admin)
 */
export const addThreadReply = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const { id } = req.params;
  const { message, attachments } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, 'Reply message cannot be empty.');
  }

  const query = await DoubtQuery.findById(id);
  if (!query) {
    throw new ApiError(404, 'Doubt query thread not found.');
  }

  // RBAC Access Check
  if (user.role === 'student' && String(query.student) !== String(user._id)) {
    throw new ApiError(403, 'You are not authorized to post to this query thread.');
  }

  const isStaff = user.role === 'admin' || user.role === 'faculty';
  const facultyName = isStaff ? (user.name || 'Adv. Rajinder Sir') : '';

  const newReply = {
    senderId: user._id,
    senderRole: user.role as 'student' | 'faculty' | 'admin',
    senderName: user.name,
    senderSalutation: user.salutation || (isStaff ? 'Adv.' : ''),
    message: message.trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
    createdAt: new Date(),
  };

  query.thread.push(newReply);

  // If faculty replied, mark as under_review or update faculty info
  if (isStaff) {
    if (query.status === 'pending') {
      query.status = 'under_review';
    }
    if (!query.assignedFaculty) {
      query.assignedFaculty = user._id;
      query.assignedFacultyName = facultyName;
    }
  }

  await query.save();

  res.status(200).json({
    success: true,
    message: 'Reply posted to doubt thread.',
    thread: query.thread,
    query,
  });
});

/**
 * 5. Mark doubt query as resolved
 */
export const resolveDoubtQuery = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const { id } = req.params;
  const query = await DoubtQuery.findById(id);
  if (!query) {
    throw new ApiError(404, 'Doubt query not found.');
  }

  if (user.role === 'student' && String(query.student) !== String(user._id)) {
    throw new ApiError(403, 'Permission denied.');
  }

  query.status = 'resolved';
  query.resolvedAt = new Date();
  await query.save();

  res.status(200).json({
    success: true,
    message: `Query ${query.queryNumber} marked as resolved.`,
    query,
  });
});

/**
 * 6. Get all doubt queries for Admin / Faculty Desk
 */
export const getAllQueriesAdmin = catchAsync(async (req: Request, res: Response) => {
  const { status, subject, priority, search } = req.query;
  const filter: Record<string, any> = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(`^${String(subject)}$`, 'i');
  }

  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  if (search) {
    const searchRegex = new RegExp(String(search), 'i');
    filter.$or = [
      { queryNumber: searchRegex },
      { studentName: searchRegex },
      { rollNo: searchRegex },
      { title: searchRegex },
      { initialQuestion: searchRegex },
      { bareActSection: searchRegex },
    ];
  }

  const queries = await DoubtQuery.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const totalPending = await DoubtQuery.countDocuments({ status: 'pending' });
  const totalUnderReview = await DoubtQuery.countDocuments({ status: 'under_review' });
  const totalResolved = await DoubtQuery.countDocuments({ status: 'resolved' });
  const totalCount = await DoubtQuery.countDocuments();

  res.status(200).json({
    success: true,
    count: queries.length,
    stats: {
      pending: totalPending,
      underReview: totalUnderReview,
      resolved: totalResolved,
      total: totalCount,
    },
    queries,
  });
});

/**
 * 7. Assign query to Faculty (Admin only)
 */
export const assignFaculty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { facultyId } = req.body;

  if (!facultyId) {
    throw new ApiError(400, 'Faculty ID is required.');
  }

  const faculty = await User.findById(facultyId);
  if (!faculty || (faculty.role !== 'faculty' && faculty.role !== 'admin')) {
    throw new ApiError(400, 'Invalid faculty user specified.');
  }

  const query = await DoubtQuery.findByIdAndUpdate(
    id,
    {
      assignedFaculty: faculty._id,
      assignedFacultyName: faculty.name,
      status: 'under_review',
    },
    { new: true }
  );

  if (!query) {
    throw new ApiError(404, 'Doubt query not found.');
  }

  res.status(200).json({
    success: true,
    message: `Query assigned to ${faculty.name}.`,
    query,
  });
});

/**
 * 8. Update query status (Admin & Faculty)
 */
export const updateQueryStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  const query = await DoubtQuery.findById(id);
  if (!query) {
    throw new ApiError(404, 'Doubt query not found.');
  }

  if (status && ['pending', 'under_review', 'resolved', 'closed'].includes(status)) {
    query.status = status;
    if (status === 'resolved') query.resolvedAt = new Date();
  }

  if (priority && ['normal', 'urgent'].includes(priority)) {
    query.priority = priority;
  }

  await query.save();

  res.status(200).json({
    success: true,
    message: `Query status updated to ${query.status}.`,
    query,
  });
});

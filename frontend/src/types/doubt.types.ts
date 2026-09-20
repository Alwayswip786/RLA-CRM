export type DoubtStatus = 'pending' | 'under_review' | 'resolved' | 'closed';
export type DoubtPriority = 'normal' | 'urgent';
export type DoubtCategory =
  | 'Bare Act Interpretation'
  | 'Mains Answer Drafting'
  | 'Case Law & Precedent'
  | 'Procedural Practice'
  | 'General Legal Doubt';

export interface IDoubtThreadMessage {
  _id?: string;
  senderId: string;
  senderRole: 'student' | 'faculty' | 'admin';
  senderName: string;
  senderSalutation?: string;
  message: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
}

export interface DoubtQuery {
  _id: string;
  queryNumber: string;
  student: string;
  studentName: string;
  rollNo: string;
  subject: string;
  bareActSection?: string;
  title: string;
  initialQuestion: string;
  category: DoubtCategory;
  priority: DoubtPriority;
  status: DoubtStatus;
  assignedFaculty?: string;
  assignedFacultyName?: string;
  thread: IDoubtThreadMessage[];
  tags: string[];
  resolvedAt?: string;
  escalatedToLiveChat: boolean;
  liveChatConversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'student' | 'faculty' | 'admin' | 'system';
  senderName: string;
  message: string;
  clientMessageId: string;
  deliveryStatus: MessageDeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  readBy?: Array<{
    userId: string;
    readAt: string;
  }>;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    rollNo?: string;
    salutation?: string;
    role: string;
    avatarUrl?: string;
    lastActiveAt?: string;
  }>;
  studentId: string;
  adminId: string;
  studentRollNo: string;
  studentName: string;
  channel: 'mentorship' | 'admissions' | 'general';
  status: 'active' | 'archived' | 'muted';
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderId?: string;
  unreadCountStudent: number;
  unreadCountAdmin: number;
  createdAt: string;
  updatedAt: string;
}

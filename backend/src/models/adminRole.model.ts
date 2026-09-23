import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAdminRole extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  isSystemRole: boolean;
  permissionTier: string;
  permissions: string[];
  assignedUsersCount: number;
  isActive: boolean;
  createdById?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminRoleSchema = new Schema<IAdminRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
      index: true,
    },
    permissionTier: {
      type: String,
      default: 'Full Access',
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    assignedUsersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdminRoleSchema.index({ isActive: 1, isSystemRole: 1 });

const AdminRole = mongoose.model<IAdminRole>('AdminRole', AdminRoleSchema);
export default AdminRole;

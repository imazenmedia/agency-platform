import mongoose, { Schema, Document } from 'mongoose';

export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';

export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId | null;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  roleIds: mongoose.Types.ObjectId[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Tenant', 
      default: null 
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    passwordHash: { 
      type: String, 
      required: true, 
      select: false 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED'], 
      default: 'INVITED' 
    },
    roleIds: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Role' 
    }],
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

UserSchema.index({ tenantId: 1 });
UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthSession extends Document {
  userId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId | null;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuthSessionSchema = new Schema<IAuthSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
AuthSessionSchema.index({ tokenHash: 1 }, { unique: true });
AuthSessionSchema.index({ userId: 1 });

export const AuthSession = (mongoose.models.AuthSession || mongoose.model<IAuthSession>('AuthSession', AuthSessionSchema)) as mongoose.Model<IAuthSession>;

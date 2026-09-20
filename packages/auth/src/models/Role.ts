import mongoose, { Schema, Document } from 'mongoose';

export type RoleScope = 'PLATFORM' | 'TENANT';

export interface IRole extends Document {
  tenantId: mongoose.Types.ObjectId | null;
  name: string;
  description?: string;
  scope: RoleScope;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Tenant', 
      default: null 
    },
    name: { type: String, required: true },
    description: { type: String },
    scope: { 
      type: String, 
      enum: ['PLATFORM', 'TENANT'], 
      required: true 
    },
    permissions: [{ type: String }],
    isSystemRole: { type: Boolean, default: false }
  },
  { timestamps: true }
);

RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Role = (mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema)) as mongoose.Model<IRole>;

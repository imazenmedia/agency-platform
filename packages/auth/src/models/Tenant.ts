import mongoose, { Schema, Document } from 'mongoose';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface ITenant extends Document {
  name: string;
  slug: string;
  status: TenantStatus;
  timezone?: string;
  currency?: string;
  contactInformation?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true 
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'], 
      default: 'ACTIVE' 
    },
    timezone: { type: String },
    currency: { type: String },
    contactInformation: {
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String },
      address: { type: String }
    }
  },
  { timestamps: true }
);

export const Tenant = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantModuleConfiguration extends Document {
  tenantId: mongoose.Types.ObjectId;
  moduleKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantModuleConfigurationSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    moduleKey: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

TenantModuleConfigurationSchema.index(
  { tenantId: 1, moduleKey: 1 },
  { unique: true },
);

export const TenantModuleConfiguration =
  mongoose.model<ITenantModuleConfiguration>(
    'TenantModuleConfiguration',
    TenantModuleConfigurationSchema,
  );

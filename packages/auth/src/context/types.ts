export type PlatformContext = {
  scope: 'PLATFORM';
  userId: string;
  tenantId: null;
};

export type TenantContext = {
  scope: 'TENANT';
  tenantId: string;
  userId: string;
};

export type RequestContext = PlatformContext | TenantContext;

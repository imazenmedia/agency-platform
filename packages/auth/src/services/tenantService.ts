import { Tenant } from '../models/index.js';
import { CreateTenantRequest, UpdateTenantRequest } from '../schemas/tenant.js';

export class TenantService {
  public async createTenant(data: CreateTenantRequest) {
    const slug = data.slug.toLowerCase().trim();

    const existing = await Tenant.findOne({ slug });
    if (existing) {
      throw new Error('Tenant with this slug already exists');
    }

    const tenant = await Tenant.create({
      name: data.name,
      slug,
      status: 'ACTIVE',
    });

    return tenant;
  }

  public async getTenantById(tenantId: string) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  public async updateTenant(
    tenantId: string,
    data: UpdateTenantRequest,
    executorTenantId: string | null,
  ) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    if (data.name) tenant.name = data.name;

    if (data.status) {
      if (executorTenantId !== null) {
        throw new Error('Tenant admins cannot change tenant status');
      }
      tenant.status = data.status;
    }

    await tenant.save();
    return tenant;
  }

  public async listTenants() {
    return await Tenant.find({});
  }
}

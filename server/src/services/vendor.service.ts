import prisma from '../utils/prisma';
import { validateGSTIN } from '../utils/gstinValidator';
import { AuditService } from './audit.service';

export interface CreateVendorInput {
  name: string;
  legalName?: string;
  gstin: string;
  pan?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  isVerified?: boolean;
}

export interface UpdateVendorInput {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  isVerified?: boolean;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
}

export class VendorService {
  public static async getVendors(query: {
    page?: number;
    limit?: number;
    search?: string;
    isVerified?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { legalName: { contains: query.search } },
        { gstin: { contains: query.search } },
        { pan: { contains: query.search } },
        { city: { contains: query.search } },
      ];
    }
    if (query.isVerified !== undefined && query.isVerified !== '') {
      where.isVerified = query.isVerified === 'true';
    }
    if (query.state) {
      where.state = query.state;
    }

    const orderByField = query.sortBy || 'name';
    const orderDirection = query.sortOrder || 'asc';

    const [total, vendors] = await Promise.all([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderDirection },
        include: {
          _count: {
            select: { invoices: true, purchaseOrders: true },
          },
        },
      }),
    ]);

    return {
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getVendorById(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            taxableAmount: true,
            grandTotal: true,
            status: true,
            fraudScore: true,
            riskLevel: true,
          },
        },
        purchaseOrders: {
          orderBy: { issueDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!vendor) {
      throw new Error('Vendor not found.');
    }

    return vendor;
  }

  public static async createVendor(input: CreateVendorInput, actorId?: string) {
    const cleanGstin = input.gstin.trim().toUpperCase();

    const existing = await prisma.vendor.findUnique({
      where: { gstin: cleanGstin },
    });

    if (existing) {
      throw new Error(`Vendor with GSTIN "${cleanGstin}" is already registered.`);
    }

    const gstinValidation = validateGSTIN(cleanGstin);
    const pan = input.pan ? input.pan.trim().toUpperCase() : gstinValidation.extractedPan;

    const vendor = await prisma.vendor.create({
      data: {
        name: input.name.trim(),
        legalName: input.legalName?.trim() || input.name.trim(),
        gstin: cleanGstin,
        pan,
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        stateCode: input.stateCode || gstinValidation.stateCode,
        pincode: input.pincode.trim(),
        bankAccountNumber: input.bankAccountNumber,
        bankIfsc: input.bankIfsc,
        bankName: input.bankName,
        isVerified: input.isVerified ?? true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'VENDOR_CREATED',
      entityType: 'VENDOR',
      entityId: vendor.id,
      newState: vendor,
      details: `New vendor "${vendor.name}" registered with GSTIN ${vendor.gstin}.`,
    });

    return vendor;
  }

  public static async updateVendor(id: string, input: UpdateVendorInput, actorId?: string) {
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Vendor not found.');
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: input,
    });

    await AuditService.log({
      userId: actorId,
      action: 'VENDOR_UPDATED',
      entityType: 'VENDOR',
      entityId: id,
      previousState: existing,
      newState: updated,
      details: `Vendor profile for "${updated.name}" updated.`,
    });

    return updated;
  }
}

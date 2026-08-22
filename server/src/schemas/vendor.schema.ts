import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Vendor name is required.'),
    legalName: z.string().optional(),
    gstin: z.string().length(15, 'GSTIN must be exactly 15 characters.'),
    pan: z.string().length(10, 'PAN must be exactly 10 characters.').optional(),
    email: z.string().email('Invalid email address.'),
    phone: z.string().min(10, 'Phone must be at least 10 digits.'),
    address: z.string().min(3, 'Address is required.'),
    city: z.string().min(2, 'City is required.'),
    state: z.string().min(2, 'State is required.'),
    stateCode: z.string().length(2, 'State code must be 2 digits.'),
    pincode: z.string().min(6, 'Pincode must be 6 digits.'),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    bankName: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
});

export const updateVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    legalName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    stateCode: z.string().length(2).optional(),
    pincode: z.string().optional(),
    isVerified: z.boolean().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    bankName: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid vendor ID.'),
  }),
});

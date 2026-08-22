import { z } from 'zod';

export const createInvoiceItemSchema = z.object({
  itemDescription: z.string().min(1, 'Item description is required.'),
  hsnSac: z.string().optional().default(''),
  quantity: z.number().positive('Quantity must be greater than 0.'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative.'),
  taxableValue: z.number().nonnegative('Taxable value cannot be negative.'),
  gstRate: z.number().nonnegative('GST rate cannot be negative.'),
  cgstAmount: z.number().optional(),
  sgstAmount: z.number().optional(),
  igstAmount: z.number().optional(),
  totalAmount: z.number().optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required.'),
    vendorId: z.string().uuid('Invalid vendor ID format.'),
    purchaseOrderId: z.string().uuid().optional().nullable(),
    invoiceDate: z.string().min(1, 'Invoice date is required.'),
    dueDate: z.string().optional().nullable(),
    vendorGstin: z.string().min(15, 'GSTIN must be 15 characters.').max(15),
    customerGstin: z.string().optional(),
    placeOfSupply: z.string().min(1, 'Place of supply state is required.'),
    placeOfSupplyStateCode: z.string().length(2, 'State code must be 2 digits (e.g. "27").'),
    billingAddress: z.string().min(3, 'Billing address is required.'),
    shippingAddress: z.string().optional().nullable(),
    taxableAmount: z.number().nonnegative('Taxable amount cannot be negative.'),
    cgstAmount: z.number().optional(),
    sgstAmount: z.number().optional(),
    igstAmount: z.number().optional(),
    grandTotal: z.number().optional(),
    roundOff: z.number().optional(),
    isInterState: z.boolean().optional(),
    items: z.array(createInvoiceItemSchema).min(1, 'At least one line item is required.'),
  }),
});

export const updateInvoiceStatusSchema = z.object({
  body: z.object({
    status: z.enum(['VERIFIED', 'SUSPICIOUS', 'FLAGGED_FRAUD', 'REJECTED']),
    reviewNotes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format.'),
  }),
});

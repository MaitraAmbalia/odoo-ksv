import prisma from '../config/db';

interface AuditPayload {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  meta?: Record<string, any>;
}

// Action constants — use these everywhere, never raw strings
export const Actions = {
  VENDOR_REGISTERED:        'VENDOR_REGISTERED',
  VENDOR_STATUS_CHANGED:    'VENDOR_STATUS_CHANGED',
  VENDOR_DOC_UPLOADED:      'VENDOR_DOC_UPLOADED',
  RFQ_CREATED:              'RFQ_CREATED',
  RFQ_PUBLISHED:            'RFQ_PUBLISHED',
  RFQ_AMENDED:              'RFQ_AMENDED',
  RFQ_CLOSED:               'RFQ_CLOSED',
  RFQ_CANCELLED:            'RFQ_CANCELLED',
  QUOTATION_SUBMITTED:      'QUOTATION_SUBMITTED',
  QUOTATION_WITHDRAWN:      'QUOTATION_WITHDRAWN',
  QUOTATION_SUPERSEDED:     'QUOTATION_SUPERSEDED',
  QUOTATION_SELECTED:       'QUOTATION_SELECTED',
  APPROVAL_CREATED:         'APPROVAL_CREATED',
  APPROVAL_APPROVED:        'APPROVAL_APPROVED',
  APPROVAL_REJECTED:        'APPROVAL_REJECTED',
  PO_ISSUED:                'PO_ISSUED',
  PO_STATUS_CHANGED:        'PO_STATUS_CHANGED',
  PO_CANCELLED:             'PO_CANCELLED',
  GRN_SUBMITTED:            'GRN_SUBMITTED',
  GRN_VERIFIED:             'GRN_VERIFIED',
  INVOICE_GENERATED:        'INVOICE_GENERATED',
  INVOICE_SENT:             'INVOICE_SENT',
  INVOICE_PAID:             'INVOICE_PAID',
  INVOICE_OVERDUE:          'INVOICE_OVERDUE',
  INVOICE_CANCELLED:        'INVOICE_CANCELLED',
} as const;

export const auditLog = {
  write: (payload: AuditPayload) =>
    prisma.activityLog.create({ data: payload }),
};

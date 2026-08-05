import { renderPaymentAgreementPdf } from "../../../../lib/payment-agreement";
import { getTemplatesConfig } from "../../../../lib/templates-config";
import { breederSessionFromRequest, requireAdminSession } from "../../../../lib/admin-session";
import { findKennelById } from "../../../../lib/supabase-auth";

export async function GET(request: Request) {
  const unauthorized = requireAdminSession(request); if (unauthorized) return unauthorized;
  const session = breederSessionFromRequest(request)!;
  const [config, kennel] = await Promise.all([
    getTemplatesConfig(session.kennelId),
    findKennelById(session.kennelId),
  ]);
  const pdf = await renderPaymentAgreementPdf({
    breederName: kennel?.legal_name || kennel?.name || session.kennelName,
    buyerName: "____________________________________________",
    planType: "Pre-transfer purchase plan",
    processor: "____________________________________________",
    cashPriceCents: 0,
    taxCents: 0,
    transportCents: 0,
    otherChargesCents: 0,
    depositCreditCents: 0,
    downPaymentCents: 0,
    otherCreditCents: 0,
    apr: 0,
    financeChargeCents: 0,
    installmentCount: 12,
    installmentAmountCents: 0,
    frequency: "____________________________________________",
    firstDueDate: "",
    finalDueDate: "",
    monthlyAdminFeeCents: 0,
    lateFeeCents: 0,
    graceDays: 0,
    returnedPaymentFeeCents: 0,
    onTimeCreditCents: 0,
    autopayRequired: false,
    standardTerms: config.documents.payment_agreement.content,
  });
  return new Response(new Blob([pdf as BlobPart], { type: "application/pdf" }), {
    headers: {
      "content-disposition": 'attachment; filename="payment-plan-agreement.pdf"',
      "content-type": "application/pdf",
      "cache-control": "no-store",
    },
  });
}

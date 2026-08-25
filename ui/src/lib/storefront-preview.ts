export const PREVIEW_DRAFT_MESSAGE = "quiero-menu:preview-draft";
export const PREVIEW_READY_MESSAGE = "quiero-menu:preview-ready";

export interface StorefrontPreviewDraft {
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
}

export interface StorefrontPreviewDraftMessage {
  type: typeof PREVIEW_DRAFT_MESSAGE;
  payload: StorefrontPreviewDraft;
}

export function isPreviewDraftMessage(
  value: unknown,
): value is StorefrontPreviewDraftMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as { type?: unknown; payload?: unknown };
  if (message.type !== PREVIEW_DRAFT_MESSAGE) return false;
  const payload = message.payload as StorefrontPreviewDraft | undefined;
  return (
    typeof payload?.logoUrl === "string" &&
    typeof payload?.bannerUrl === "string" &&
    typeof payload?.primaryColor === "string"
  );
}

export function isPreviewReadyMessage(
  value: unknown,
): value is { type: typeof PREVIEW_READY_MESSAGE } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === PREVIEW_READY_MESSAGE
  );
}

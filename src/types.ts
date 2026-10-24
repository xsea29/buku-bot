export const RequestStatus = {
  AwaitingEmail: "awaiting_email",
  PendingReview: "pending_review",
  ApprovedForSourcing: "approved_for_sourcing",
  Rejected: "rejected",
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export interface BookRequest {
  id: number;
  telegramUserId: number;
  username: string | null;
  bookTitle: string;
  email: string | null;
  status: RequestStatus;
  createdAt: string;
}

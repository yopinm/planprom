import { db } from '@/lib/db'

export type FacebookCommentReceiptStatus = 'processing' | 'replied' | 'skipped' | 'failed'

export interface FacebookCommentClaimInput {
  postId: string
  fbPostId: string
  commentId: string
  commenterId?: string | null
  receivedAt?: string
}

export interface FacebookCommentClaimResult {
  claimed: boolean
  receiptId: string | null
  reason?: 'duplicate_comment'
}

interface ReceiptInsertResult {
  id: string
}

type DbJsonValue = Parameters<typeof db.json>[0]

interface DatabaseErrorLike {
  code?: string
  message?: string
}

function isDatabaseErrorLike(value: unknown): value is DatabaseErrorLike {
  if (typeof value !== 'object' || value === null) return false
  return 'code' in value || 'message' in value
}

function isUniqueViolation(error: unknown): boolean {
  if (!isDatabaseErrorLike(error)) return false
  return error.code === '23505' || error.message?.toLowerCase().includes('duplicate key') === true
}

export async function claimFacebookComment(
  input: FacebookCommentClaimInput,
): Promise<FacebookCommentClaimResult> {
  try {
    const [receipt] = await db<ReceiptInsertResult[]>`
      INSERT INTO facebook_comment_receipts (
        post_id,
        fb_post_id,
        comment_id,
        commenter_id,
        status,
        first_seen_at
      )
      VALUES (
        ${input.postId},
        ${input.fbPostId},
        ${input.commentId},
        ${input.commenterId ?? null},
        'processing',
        ${input.receivedAt ?? new Date().toISOString()}
      )
      RETURNING id
    `

    return { claimed: true, receiptId: receipt?.id ?? null }
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return { claimed: false, receiptId: null, reason: 'duplicate_comment' }
    }
    throw error
  }
}

export async function updateFacebookCommentReceipt(
  commentId: string,
  status: FacebookCommentReceiptStatus,
  meta?: Record<string, unknown>,
): Promise<void> {
  await db`
    UPDATE facebook_comment_receipts
    SET status = ${status},
        processed_at = ${new Date().toISOString()},
        meta = ${meta ? db.json(meta as DbJsonValue) : null}
    WHERE comment_id = ${commentId}
  `
}

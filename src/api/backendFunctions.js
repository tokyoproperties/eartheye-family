// backendFunctions.js
// Plain-English: These are "actions" instead of "things".
// Approve review, reject review, submit stewardship, etc.

import { postJSON } from "./restClient";

// TODO: Change these paths ("/curator/approve") to match your real backend later.

export async function approveCuratorReview(reviewId) {
  return postJSON("/curator/approve", { reviewId });
}

export async function rejectCuratorReview(reviewId, reason) {
  return postJSON("/curator/reject", { reviewId, reason });
}

export async function submitStewardshipUpdate(payload) {
  return postJSON("/stewardship/update", payload);
}

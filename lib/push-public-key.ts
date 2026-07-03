// Not secret — this is the public half of the VAPID keypair, sent to every
// browser via pushManager.subscribe(). The private half lives in the
// VAPID_PRIVATE_KEY Cloudflare secret (see lib/vapid.ts) and never reaches
// the client.
export const VAPID_PUBLIC_KEY =
  "BFhMi-1tAz6ONdeaB-kkc5p7QNTIXtgM0ffylFZOurVejckdfvPRWTnpepJctQ-2UgBvT9DmCxAVRUOOFnHo1Zo";

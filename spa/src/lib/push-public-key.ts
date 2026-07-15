// Not secret — this is the public half of the VAPID keypair, sent to every
// browser via pushManager.subscribe(). The private half lives on the
// Laravel server only (config/services.php `vapid.private_key`).
export const VAPID_PUBLIC_KEY =
  "BFhMi-1tAz6ONdeaB-kkc5p7QNTIXtgM0ffylFZOurVejckdfvPRWTnpepJctQ-2UgBvT9DmCxAVRUOOFnHo1Zo";

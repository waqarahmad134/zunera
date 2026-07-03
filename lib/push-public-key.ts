// Not secret — this is the public half of the VAPID keypair, sent to every
// browser via pushManager.subscribe(). The private half lives in the
// VAPID_PRIVATE_KEY Cloudflare secret (see lib/vapid.ts) and never reaches
// the client.
export const VAPID_PUBLIC_KEY =
  "BKZGgwnWC5qH68jaXTp8wuwUom9i7JNmuIUb1Nl4A-JZN2G32oV7CXgcP1gJ65HlQlgMQDw9SXZ7W2ILShWzyHc";

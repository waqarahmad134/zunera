// Notification types.

export interface Notification {
  id: number;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
}

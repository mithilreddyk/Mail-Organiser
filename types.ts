export interface Email {
  subject: string;
  date: string;
  summary: string;
}

export interface OrganizedEmailGroup {
  senderName: string;
  senderEmail: string;
  emails: Email[];
}

export type SortOrder = 'newest' | 'oldest';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  sub: string; // Google's unique user ID
}


export interface FirebaseContact {
  id: string;
  email?: string;
  phoneNumber?: string;
  linkedId?: string;
  linkPrecedence: 'primary' | 'secondary';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseProfile {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

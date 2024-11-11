export {}

declare global {
  interface CustomJwtSessionClaims {
    userId: string;
    username: string | null;
    imageUrl: string | null;
    hasImage: boolean;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    email: string | null;
    externalId: string | null;
    publicMetadata: Record<string, any>;
    createdAt: string;
  }
}
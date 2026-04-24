export type SearchHit =
  | {
      kind: 'artist';
      id: string;
      artisticName: string;
      location: string;
      genrePrimary: string | null;
      photoUrl: string | null;
      isVerified: boolean;
    }
  | {
      kind: 'collective';
      id: string;
      name: string;
      location: string;
      genrePrimary: string;
      logoUrl: string | null;
    };

export type SearchErrorCode = 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'DB_ERROR';

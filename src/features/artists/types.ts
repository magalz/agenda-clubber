export type PrivacyMode = 'public' | 'collectives_only' | 'private' | 'ghost';
export type FieldVisibility = 'public' | 'collectives_only' | 'private';

export type ArtistPrivacySettings = {
  mode: PrivacyMode;
  fields: {
    social_links: FieldVisibility;
    presskit: FieldVisibility;
    bio: FieldVisibility;
    genre: FieldVisibility;
  };
};

export const DEFAULT_PRIVACY_SETTINGS: ArtistPrivacySettings = {
  mode: 'public',
  fields: {
    social_links: 'public',
    presskit: 'public',
    bio: 'public',
    genre: 'public',
  },
};

export function privacySettingsFromMode(mode: PrivacyMode): ArtistPrivacySettings {
  const fieldValue: FieldVisibility =
    mode === 'public' ? 'public' :
    mode === 'collectives_only' ? 'collectives_only' :
    'private';

  return {
    mode,
    fields: {
      social_links: fieldValue,
      presskit: fieldValue,
      bio: fieldValue,
      genre: fieldValue,
    },
  };
}

import { describe, it, expect } from 'vitest';
import { profiles } from './auth';
import { collectives } from './collectives';
import { collectiveMembers } from './collective-members';
import { artists } from './artists';

describe('Database Schema', () => {
    it('profiles table should have correct columns', () => {
        expect(profiles.id).toBeDefined();
        expect(profiles.userId).toBeDefined();
        expect(profiles.nickname).toBeDefined();
        expect(profiles.role).toBeDefined();
        expect(profiles.createdAt).toBeDefined();
        expect(profiles.updatedAt).toBeDefined();
    });

    it('collectives table should have correct columns', () => {
        expect(collectives.id).toBeDefined();
        expect(collectives.name).toBeDefined();
        expect(collectives.location).toBeDefined();
        expect(collectives.logoUrl).toBeDefined();
        expect(collectives.genrePrimary).toBeDefined();
        expect(collectives.status).toBeDefined();
        expect(collectives.ownerId).toBeDefined();
        expect(collectives.createdAt).toBeDefined();
    });

    it('collectiveMembers table should have correct columns', () => {
        expect(collectiveMembers.id).toBeDefined();
        expect(collectiveMembers.collectiveId).toBeDefined();
        expect(collectiveMembers.profileId).toBeDefined();
        expect(collectiveMembers.role).toBeDefined();
    });

    it('artists table should have correct columns', () => {
        expect(artists.id).toBeDefined();
        expect(artists.profileId).toBeDefined();
        expect(artists.artisticName).toBeDefined();
        expect(artists.location).toBeDefined();
        expect(artists.genrePrimary).toBeDefined();
        expect(artists.photoUrl).toBeDefined();
        expect(artists.isVerified).toBeDefined();
    });
});

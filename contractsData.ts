
import { LegalTemplate } from './types';

export const LEGAL_TEMPLATES: LegalTemplate[] = [
    {
        id: 'master-recording',
        name: 'Master Recording & Production Agreement',
        description: 'The industry-standard contract for producers and artists securing rights to masters.',
        price: 3500,
        category: 'Music',
        benefits: ['Work-for-hire protection', 'Royalty split clarity', 'Termination clauses']
    },
    {
        id: 'non-disclosure',
        name: 'Creative IP NDA',
        description: 'Protect your demos, beats, and business secrets before sharing with third parties.',
        price: 1500,
        category: 'General IP',
        benefits: ['Ironclad confidentiality', 'Fixed term protection', 'Breach penalty clauses']
    },
    {
        id: 'sync-license',
        name: 'Sync Licensing Master',
        description: 'Essential for licensing music to films, ads, or video games internationally.',
        price: 4500,
        category: 'Licensing',
        benefits: ['Global territory rights', 'Single-use terms', 'Fee protection']
    },
    {
        id: 'artist-management',
        name: 'Artist Management Agreement',
        description: 'Professional relationship terms with clear commission and sunset clauses.',
        price: 5000,
        category: 'Business',
        benefits: ['Commission capping', 'Sunset clauses', 'Performance milestones']
    },
    {
        id: 'producer-catalog-sheet',
        name: 'Producer Song Catalog & Metadata Sheet',
        description: 'The professional "Bible" for tracking publishing, sync splits, ISRC/IPI, and distribution data.',
        price: 1000,
        category: 'Production',
        benefits: ['Sync & Publishing ready', 'BPM/Key/Stems tracking', 'IPI & ISRC metadata core']
    }
];

export {};

declare global {
    /** Representing the structure of a match score. */
    interface MatchScore {
        id: number | null;
        player_id: number | null;
        points: number | null;
    }
}

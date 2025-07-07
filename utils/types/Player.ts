export {};

declare global {
    /** Representing the structure of a player. */
    interface Player {
        id: number | null;
        name: string | null;
        match_scores: MatchScore[] | null;
        average_score: number | null;
        average_placement: number | null;
    }
}

export {};

declare global {
    /** Representing the structure of a record. */
    interface PlayerRecord {
        id: number | null;
        science: number | null;
        culture: number | null;
        least_rounds: number | null;
    }
}

<script setup lang="ts">
import {SupabaseService} from '../utils/SupabaseService';
import {onMounted, ref} from "vue";

const supabaseService = new SupabaseService();
const matchScoreModalIsOpen = ref(false);
const recordScoreModalIsOpen = ref(false);
const openedRecordTypeModal = ref('');
const selectedRecordPlayerId = ref(0);
const recordValue = ref(0);
const playerBeingModified = ref<Player>();
const gameNumber = ref<number | null>(null);
const points = ref<number | null>(null);
const character = ref('');
const showInactivePlayers = ref(false); // default: Martin ausblenden
const players = ref<Player[]>([]); // //currentlyShownPlayers
const playerRecords = ref<PlayerRecord[]>([]);
const highestScorePlayer = ref<RecordPlayerResult>();
const lowestScorePlayer = ref<RecordPlayerResult>();
const mostFrequentSecondPlacePlayer = ref<RecordPlayerResult>();
const highestSciencePlayer = ref<RecordPlayerResult>();
const highestCulturePlayer = ref<RecordPlayerResult>();
const leastRoundsPlayer = ref<RecordPlayerResult>();

interface RecordPlayerResult {
  playerName: string;
  score: number;
}

function openMatchScoreModal(player: Player) {
  matchScoreModalIsOpen.value = true;
  playerBeingModified.value = player;
}

function closeMatchScoreModal() {
  matchScoreModalIsOpen.value = false;
}

async function saveMatchScore() {
  const matchScore: MatchScore = {
    player_id: playerBeingModified.value.id,
    game_nr: gameNumber.value,
    character: character.value,
    points: points.value
  }

  await supabaseService.saveScore(matchScore);
  closeMatchScoreModal();
  location.reload();
}

function openRecordModal(recordType: string) {
  recordScoreModalIsOpen.value = true;
  openedRecordTypeModal.value = recordType;
}

function closeRecordModal() {
  recordScoreModalIsOpen.value = false;
}

async function saveRecord() {
  const playerRecord: PlayerRecord = {
    id: selectedRecordPlayerId.value,
    science: openedRecordTypeModal.value == "science" ? recordValue.value : null,
    culture: openedRecordTypeModal.value == "culture" ? recordValue.value : null,
    least_rounds: openedRecordTypeModal.value == "least_rounds" ? recordValue.value : null,
  }

  await supabaseService.saveRecord(playerRecord);
  closeMatchScoreModal();
  location.reload();
}

// get the players from the database. calculate average placement and points
onMounted(async () => {
  const loadedPlayers = await getPlayers();
  playerRecords.value = await getPlayerRecords();

  const latestGameNr = getLatestGameNr(loadedPlayers);
  markInactivePlayers(loadedPlayers, latestGameNr);
  setPlayerWithHighestScore(loadedPlayers);
  setPlayerWithLowestScore(loadedPlayers);
  setMostFrequentSecondPlace(loadedPlayers);
  if(loadedPlayers) {
    setHighestSciencePlayer();
    setHighestCulturePlayer();
    setLeastRoundsPlayer();
  }

  players.value = sortPlayers(loadedPlayers);
})

// sort players by average placement and points
function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    // Falls null-Werte vorkommen, behandle sie als -Infinity (schlechter als alles andere)
    const aPlacement = a.average_placement ?? -Infinity;
    const bPlacement = b.average_placement ?? -Infinity;

    if (aPlacement !== bPlacement) {
      // niedrigere average_placement zuerst
      return aPlacement - bPlacement;
    }
    const aPoints = a.average_points ?? -Infinity;
    const bPoints = b.average_points ?? -Infinity;

    // höhere average_points zuerst
    return bPoints - aPoints;
  });
}

function getLatestGameNr(players: Player[]): number {
  const allGameNrs: number[] = [];

  for (const player of players) {
    if (!player.match_score) continue;
    for (const score of player.match_score) {
      allGameNrs.push(score.game_nr ?? 0);
    }
  }

  return Math.max(...allGameNrs);
}

/**
 * Markiere Spieler als inaktiv/aktiv basierend auf letzte game-nmr
 * Ein Spieler ist inaktiv, wenn er die letzten drei Spiele nicht gespielt hat.
 */
function markInactivePlayers(players: Player[], latestGameNr: number): void {
  for (const player of players) {
    const lastPlayed = Math.max(...(player.match_score?.map(ms => ms.game_nr ?? 0) || [0]));
    (player as any).isInactive = latestGameNr - lastPlayed >= 2;
  }
}

async function getPlayers(): Promise<Player[]> {
  let players: Player[] = await supabaseService.getPlayersWithScores() ?? [];

  calculatePlayerStats(players);

  return players;
}

async function getPlayerRecords(): Promise<PlayerRecord[]> {
  return await supabaseService.getPlayerRecords() ?? [];
}

function setPlayerWithHighestScore(players: Player[]): void {
  let currentBest: RecordPlayerResult | null = null;

  for (const player of players) {
    for (const match of player.match_score) {

      if (currentBest === null || match.points > currentBest.score) {
        currentBest = {
          playerName: player.name,
          score: match.points
        };
      }
    }
  }

  highestScorePlayer.value = currentBest;
}

function setPlayerWithLowestScore(players: Player[]): void {
  let currentLowest: RecordPlayerResult | null = null;

  for (const player of players) {
    for (const match of player.match_score) {

      if (currentLowest === null || match.points < currentLowest.score) {
        currentLowest = {
          playerName: player.name,
          score: match.points
        };
      }
    }
  }

  lowestScorePlayer.value = currentLowest;
}

function setMostFrequentSecondPlace(players: Player[]): void {
  const gamesMap = new Map<number, { name: string; points: number }[]>();

  for (const player of players) {
    for (const match of player.match_score) {
      if (!gamesMap.has(match.game_nr)) {
        gamesMap.set(match.game_nr, []);
      }

      gamesMap.get(match.game_nr)?.push({
        name: player.name,
        points: match.points
      });
    }
  }

  const secondPlaceCounts = new Map<string, number>();

  gamesMap.forEach((participants, gameNr) => {
    participants.sort((a, b) => b.points - a.points);

    if (participants.length >= 2) {
      const secondPlacePlayer = participants[1];

      const currentCount = secondPlaceCounts.get(secondPlacePlayer.name) || 0;
      secondPlaceCounts.set(secondPlacePlayer.name, currentCount + 1);
    }
  });

  let result: RecordPlayerResult | null = null;

  secondPlaceCounts.forEach((count, name) => {
    if (result === null || count > result.score) {
      result = {
        playerName: name,
        score: count
      };
    }
  });

  mostFrequentSecondPlacePlayer.value = result;
}

function setHighestSciencePlayer(): void {
  if (!playerRecords.value || playerRecords.value.length === 0) {
    return;
  }

  const bestRecord = playerRecords.value.reduce((prev, current) => {
    return (prev.science > current.science) ? prev : current;
  });

  highestSciencePlayer.value = {
    playerName: bestRecord.player?.name ?? 'Unbekannt',
    score: bestRecord.science
  };
}

function setHighestCulturePlayer(): void {
  if (!playerRecords.value || playerRecords.value.length === 0) {
    return;
  }

  const bestRecord = playerRecords.value.reduce((prev, current) => {
    return (prev.culture > current.culture) ? prev : current;
  });

  highestCulturePlayer.value = {
    playerName: bestRecord.player?.name ?? 'Unbekannt',
    score: bestRecord.culture
  };
}

function setLeastRoundsPlayer(): void {
  if (!playerRecords.value || playerRecords.value.length === 0) {
    return;
  }

  const bestRecord = playerRecords.value.reduce((prev, current) => {
    return (prev.least_rounds < current.least_rounds) ? prev : current;
  });

  leastRoundsPlayer.value = {
    playerName: bestRecord.player?.name ?? 'Unbekannt',
    score: bestRecord.least_rounds
  };
}

function calculatePlayerStats(players: Player[]): void {
  // Gruppieren nach game_nr
  const scoresByGame: Record<number, MatchScore[]> = {};

  for (const player of players) {
    player.total_wins = 0;

    if (!player.match_score) continue;

    for (const score of player.match_score) {
      if (score.game_nr === null) continue;

      if (!scoresByGame[score.game_nr]) {
        scoresByGame[score.game_nr] = [];
      }

      scoresByGame[score.game_nr].push(score);
    }
  }
  // Berechnungen
  for (const player of players) {
    const scores = player.match_score?.filter(s => s.points !== null) ?? [];

    const totalPoints = scores.reduce((sum, s) => sum + (s.points ?? 0), 0);
    player.average_points = scores.length > 0 ? totalPoints / scores.length : null;

    const placements: number[] = [];

    for (const score of scores) {
      const gameNr = score.game_nr;
      const playerId = score.player_id;

      const allScoresThisGame = scoresByGame[gameNr];
      if (!allScoresThisGame) continue;

      const sorted = [...allScoresThisGame]
          .filter(s => s.points !== null)
          .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

      const rank = sorted.findIndex(s => s.player_id === playerId) + 1;
      if (rank > 0) placements.push(rank);
      if (rank == 1) player.total_wins = player.total_wins + 1;
    }

    const totalPlacement = placements.reduce((sum, r) => sum + r, 0);
    player.average_placement = placements.length > 0 ? totalPlacement / placements.length : null;
  }
}

function getBgColor(index: number): string {
  let activePlayers = getActivePlayerCount();

  if (showInactivePlayers.value) {
    activePlayers = players.value.length;
  }

  // color for the first two places
  if (index === 0) return 'bg-green-400';
  if (index === 1) return 'bg-green-300';

  // colors for the last two players
  if (index === activePlayers - 2) return 'bg-red-300';
  if (index === activePlayers - 1) return 'bg-red-400';

  // color for the middle players (default)
  return 'bg-yellow-300';
}

function getActivePlayerCount(): number {
  return players.value.filter(p => !(p as any).isInactive).length;
}

//Returns the crown as a string based on total wins. Adjust this function to change the crown image
function getCrowns(totalWins: number | null): string {
  if (totalWins == null) return;
  return '👑'.repeat(totalWins);
}

</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <img src="@/assets/wallpaper.jpg" alt="Background" class="absolute top-0 left-0 w-full h-full object-cover z-0"/>

    <video autoplay muted loop playsinline class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10">
      <source src="@/assets/smoke.mp4" type="video/mp4"/>
      Dein Browser unterstützt das Video nicht.
    </video>

    <video autoplay muted loop playsinline class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10">
      <source src="@/assets/sparkles.mp4" type="video/mp4"/>
      Dein Browser unterstützt das Video nicht.
    </video>

    <!-- Normale Seitelemente -->
    <div class="relative z-20 p-4 h-screen">
      <div class="flex justify-center items-center m-auto max-w-10/12]">
        <img src="@/assets/headline.png" alt="headline">
      </div>

      <div class="flex flex-col flex-wrap sm:flex-row justify-center gap-8 px-8 h-full z-30">
        <div
            class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)] flex flex-col pb-2">
          <!-- Bild blockt nur so viel Platz wie nötig -->
          <img src="@/assets/player-ranking.png" alt="Spieler Ranking" class="w-full h-auto"/>

          <!-- Checkbox inaktive Spieler -->
          <div class="flex justify-center items-center mb-2 mt-1 text-white">
            <input type="checkbox" id="showInactivePlayers" v-model="showInactivePlayers"
                   class="mr-2 accent-amber-600"/>
            <label for="showInactivePlayers" class="cursor-pointer select-none">
              Verlorene Brüder anzeigen
            </label>
          </div>

          <div class="flex mx-4 text-sm text-white">
            <div class="flex-1 flex basis-[15%] justify-center items-center">Platz</div>
            <div class="flex-1 flex basis-[17%] justify-center items-center">Name</div>
            <div class="flex-1 flex basis-[8%] justify-center items-center">Games</div>
            <div class="flex-1 flex basis-[30%] justify-center items-center">⌀ Punkte</div>
            <div class="flex-1 flex basis-[30%] justify-center items-center">⌀ Platz</div>
          </div>

          <div v-for="(player, index) in players.filter(p => showInactivePlayers || !(p as any).isInactive)"
               :key="player.id" class="flex-1 flex flex-col space-y-1 cursor-pointer overflow-hidden py-1">
            <div class="flex-1 mx-2 rounded-2xl flex hover:outline-2 hover:outline-white"
                 @click="!(player as any).isInactive && openMatchScoreModal(player)"
                 :class="[getBgColor(index), (player as any).isInactive ? 'opacity-40 grayscale' : '']">
              <div class="flex-1 flex basis-[15%] text-2xl justify-center items-center">#{{ index + 1 }}</div>
              <div class="flex-1 flex basis-[17%] justify-center items-center">
                <div class="text-center">
                  {{ player.name }}<br>
                  <span v-if="player.total_wins">{{ getCrowns(player.total_wins) }}</span>
                </div>
              </div>
              <div class="flex-1 flex basis-[8%] justify-center items-center">{{ player.match_score.length }}</div>
              <div class="flex-1 flex basis-[30%] justify-center items-center text-center">⌀
                {{ player.average_points?.toFixed(2) ?? '-' }}
              </div>
              <div class="flex-1 flex basis-[30%] justify-center items-center">
                ⌀
                <img src="@/assets/podium.svg" alt="Podium" class="h-4 w-4 mx-2"/>
                {{ player.average_placement?.toFixed(2) ?? '-' }}
              </div>
            </div>
          </div>
        </div>

        <div
            class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)] gap-2 flex flex-col pb-2">
          <img src="@/assets/all-time-records.png" alt="All-Time Rekorde"/>

          <div v-if="highestScorePlayer"
              class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden bg-[rgba(199,194,43)] rounded-2xl hover:outline-2 hover:outline-white">
            <img src="@/assets/medal.svg" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">Punktesammler:</div>
                <div class="text-lg italic">&nbsp;(Meiste Punkte in einem Spiel)</div>
              </div>
              <div class="text-color">{{ highestScorePlayer.playerName }}: {{ highestScorePlayer.score }} Punkte</div>
            </div>

          </div>

          <div
              class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden
              bg-[rgba(21,166,218)] rounded-2xl hover:outline-2 hover:outline-white"
              @click="openRecordModal('science')">
            <img src="@/assets/science-symbol.webp" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">Newton:</div>
                <div class="text-lg italic">&nbsp;(Meiste Wissenschaft in einem Spiel)</div>
              </div>
              <div v-if="highestSciencePlayer" class="text-color">{{ highestSciencePlayer.playerName }}: {{ highestSciencePlayer.score }} Wissenschaft</div>
            </div>
          </div>

          <div
              class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden
              bg-[rgba(196,26,209)] rounded-2xl hover:outline-2 hover:outline-white"
              @click="openRecordModal('culture')">
            <img src="@/assets/culture-symbol.webp" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">Beethoven:</div>
                <div class="text-lg italic">&nbsp;(Meiste Kultur in einem Spiel)</div>
              </div>
              <div v-if="highestCulturePlayer" class="text-color">{{ highestCulturePlayer.playerName }}: {{ highestCulturePlayer.score }} Kultur</div>
            </div>
          </div>

          <div
              class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden
              bg-[rgba(52,207,73)] rounded-2xl hover:outline-2 hover:outline-white"
              @click="openRecordModal('least_rounds')">
            <img src="@/assets/clock.svg" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">Usain Bolt:</div>
                <div class="text-lg italic">&nbsp;(Schnellster Sieg nach Runden)</div>
              </div>
              <div v-if="leastRoundsPlayer" class="text-color">{{ leastRoundsPlayer.playerName }}: {{ leastRoundsPlayer.score }} Runden</div>
            </div>
          </div>

          <div v-if="mostFrequentSecondPlacePlayer"
              class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden bg-[rgba(129,129,129)] rounded-2xl hover:outline-2 hover:outline-white">
            <img src="@/assets/middlefinger.svg" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">Vizekusen:</div>
                <div class="text-lg italic">&nbsp;(Am häufigsten zweiter)</div>
              </div>
              <div class="text-color">{{ mostFrequentSecondPlacePlayer.playerName }}: {{ mostFrequentSecondPlacePlayer.score }}x</div>
            </div>
          </div>

          <div
              v-if="lowestScorePlayer" class="flex justify-center items-center gap-4 py-1 mx-2 overflow-hidden bg-[rgba(175,71,35)] rounded-2xl hover:outline-2 hover:outline-white">
            <img src="@/assets/thumb-down.svg" alt="medal" class="h-8 w-8"/>
            <div class="flex flex-col items-center text-center">
              <div class="flex flex-row justify-center">
                <div class="text-lg font-semibold">GG go next:</div>
                <div class="text-lg italic">&nbsp;(Am wenigsten Punkte in einem Spiel)</div>
              </div>
              <div class="text-color">{{ lowestScorePlayer.playerName }}: {{ lowestScorePlayer.score }} Punkte</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <div v-if="matchScoreModalIsOpen" class="fixed inset-0 flex justify-center items-center z-70">
    <div class="bg-white rounded-xl p-6 w-1/2 relative shadow-xl">
      <!-- Schließen Button -->
      <button @click="closeMatchScoreModal" class="absolute top-2 right-2 text-gray-500 hover:text-black">
        ✖
      </button>

      <!-- Modal für Spielergebniseintrag -->
      <div class="flex justify-center items-center">
        <h2 class="text-xl font-bold mb-4">Neuen Eintrag für {{ playerBeingModified.name }} hinzufügen</h2>
      </div>

      <div class="space-y-4">
        <label>Spiel Nummer / Id</label>
        <input type="number" v-model.number="gameNumber" placeholder="Spiel Nummer / Id"
               class="w-full border rounded p-2"/>
        <label>Charakter</label>
        <input type="text" v-model="character" placeholder="Charakter" class="w-full border rounded p-2"/>
        <label>Gesamtpunkte</label>
        <input type="number" v-model.number="points" placeholder="Gesamtpunkte" class="w-full border rounded p-2"/>
      </div>

      <!-- Button -->
      <div class="mt-6 flex justify-end">
        <button @click="saveMatchScore" class="bg-[rgba(133,63,63)] text-white px-4 py-2 rounded hover:bg-amber-600">
          Speichern
        </button>
      </div>
    </div>
  </div>

  <!-- Modal für Rekordeintrag -->
  <div v-if="recordScoreModalIsOpen" class="fixed inset-0 flex justify-center items-center z-70" style="background-color: rgba(0,0,0,0.5);">
    <div class="bg-white rounded-xl p-6 w-1/2 relative shadow-xl">
      <button @click="closeRecordModal" class="absolute top-2 right-2 text-gray-500 hover:text-black">
        ✖
      </button>

      <div class="flex justify-center items-center">
        <h2 class="text-xl font-bold mb-4">Neuen Rekord hinzufügen</h2>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block mb-1">Spieler wählen</label>
          <select v-model="selectedRecordPlayerId" class="w-full border rounded p-2 bg-white">
            <option value="" disabled selected>Spieler wählen</option>
            <option v-for="(player) in players.filter(p => showInactivePlayers || !(p as any).isInactive)"
                    :key="player.id" :value="player.id">{{ player.name }}</option>
          </select>
        </div>

        <div>
          <label class="block mb-1">Rekordwert</label>
          <input type="number" v-model.number="recordValue" placeholder="Gesamtpunkte" class="w-full border rounded p-2"/>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button @click="saveRecord()" class="bg-[rgba(133,63,63)] text-white px-4 py-2 rounded hover:bg-amber-600">
          Speichern
        </button>
      </div>
    </div>
  </div>

</template>

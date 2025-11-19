<script setup lang="ts">
import { SupabaseService } from '../utils/SupabaseService';
import { onMounted, ref } from "vue";

const supabaseService = new SupabaseService(); 
const isOpen = ref(false);
const playerBeingModified = ref<Player>();
const gameNumber = ref<number | null>(null);
const points = ref<number | null>(null);
const character = ref('');
const showInactivePlayers = ref(false); // default: Martin ausblenden 


function open(player: Player) {
  isOpen.value = true;
  playerBeingModified.value = player;
}

function close() {
  isOpen.value = false;
}

async function save() {
  const matchScore: MatchScore = {
    player_id: playerBeingModified.value.id,
    game_nr: gameNumber.value,
    character: character.value,
    points: points.value
  }

  const success = await supabaseService.saveScore(matchScore);
  console.log(success);
  // todo: die variablen wieder clearen
  close();
  location.reload();
}

//active players
const allPlayers = ref<Player[]>([])
//filtered (active) Players
const filteredPlayers = ref<Player[]>([])
//currentlyShownPlayers
const players = ref<Player[]>([])


onMounted(async () => {
  //get the players from the database. Calculate average placement and points
  const loadedPlayers = await getPlayers();

  const latestGameNr = getLatestGameNr(loadedPlayers);
  markInactivePlayers(loadedPlayers, latestGameNr);

  const sortedPlayers = sortPlayers(loadedPlayers);

  players.value = sortedPlayers;
  allPlayers.value = sortedPlayers;
  filteredPlayers.value = sortedPlayers.filter(p => !(p as any).isInactive);
  updateRanking();
})

function updateRanking():void {
  if (showInactivePlayers.value == true) {
    players.value = allPlayers.value; 
  } else {
    players.value = filteredPlayers.value;
  }
}

/*
* Sortiere Spieler bei Placement und Punkten
*/
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

/** 
 * Finde höchste Game-nmr
 */
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


function calculatePlayerStats(players: Player[]): void {
  // Gruppieren nach game_nr
  const scoresByGame: Record<number, MatchScore[]> = {};

  for (const player of players) {
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
    }

    const totalPlacement = placements.reduce((sum, r) => sum + r, 0);
    player.average_placement = placements.length > 0 ? totalPlacement / placements.length : null;
  }
}

function getBgColor(index: number): string {
  switch (index) {
    case 0:
      return 'bg-green-400'; // Platz 1
    case 1:
      return 'bg-green-300'; // Platz 2
    case 2:
    case 3:
    case 4:
      return 'bg-yellow-300'; // Platz 3-5
    case 5:
      return 'bg-red-300'; // Platz 6
    case 6:
      return 'bg-red-400'; // Platz 7
    default:
      return 'bg-gray-200'; // Fallback
  }
}

</script>

<template>
  <div class="relative w-full h-screen overflow-hidden">
    <img src="@/assets/wallpaper.jpg" alt="Background" class="absolute top-0 left-0 w-full h-full object-cover z-0" />

    <video autoplay muted loop playsinline class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10">
      <source src="@/assets/smoke.mp4" type="video/mp4" />
      Dein Browser unterstützt das Video nicht.
    </video>

    <video autoplay muted loop playsinline class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-10">
      <source src="@/assets/sparkles.mp4" type="video/mp4" />
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
          <img src="@/assets/player-ranking.png" alt="Spieler Ranking" class="w-full h-auto" />

          <!-- Checkbox inaktive Spieler -->
          <div class="flex justify-center items-center mb-2 mt-1 text-white">
            <input type="checkbox" id="showInactivePlayers" v-model="showInactivePlayers" @change="updateRanking"
              class="mr-2 accent-amber-600" />
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
            :key="player.id" class="flex-1 flex flex-col space-y-1 overflow-hidden py-1">
            <div class="flex-1 mx-2 rounded-2xl flex hover:outline-2 hover:outline-white" @click="open(player)"
              :class="[getBgColor(index), (player as any).isInactive ? 'opacity-40 grayscale' : '']">
              <div class="flex-1 flex basis-[15%] text-2xl justify-center items-center">#{{ index + 1 }}</div>
              <div class="flex-1 flex basis-[17%] justify-center items-center">{{ player.name }}</div>
              <div class="flex-1 flex basis-[8%] justify-center items-center">{{ player.match_score.length }}</div>
              <div class="flex-1 flex basis-[30%] justify-center items-center text-center">⌀
                {{ player.average_points?.toFixed(2) ?? '-' }}
              </div>
              <div class="flex-1 flex basis-[30%] justify-center items-center">
                ⌀
                <img src="@/assets/podium.svg" alt="Podium" class="h-4 w-4 mx-2" />
                {{ player.average_placement?.toFixed(2) ?? '-' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 h-3/4 rounded-lg shadow-md border-2 border-white bg-[rgba(133,63,63,0.5)]">
          <img src="@/assets/all-time-records.png" alt="All-Time Rekorde" />
        </div>
      </div>
    </div>
  </div>

  <div v-if="isOpen" class="fixed inset-0 flex justify-center items-center z-70">
    <div class="bg-white rounded-xl p-6 w-1/2 relative shadow-xl">
      <!-- Schließen Button -->
      <button @click="close" class="absolute top-2 right-2 text-gray-500 hover:text-black">
        ✖
      </button>

      <!-- Modal Inhalt -->
      <div class="flex justify-center items-center">
        <h2 class="text-xl font-bold mb-4">Neuen Eintrag für {{ playerBeingModified.name }} hinzufügen</h2>
      </div>

      <div class="space-y-4">
        <label>Spiel Nummer / Id</label>
        <input type="number" v-model.number="gameNumber" placeholder="Spiel Nummer / Id"
          class="w-full border rounded p-2" />
        <label>Charakter</label>
        <input type="text" v-model="character" placeholder="Charakter" class="w-full border rounded p-2" />
        <label>Gesamtpunkte</label>
        <input type="number" v-model.number="points" placeholder="Gesamtpunkte" class="w-full border rounded p-2" />
      </div>

      <!-- Button -->
      <div class="mt-6 flex justify-end">
        <button @click="save" class="bg-[rgba(133,63,63)] text-white px-4 py-2 rounded hover:bg-amber-600">
          Speichern
        </button>
      </div>
    </div>
  </div>

</template>

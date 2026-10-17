"use client";

import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit, MdEmojiEvents, MdRefresh, MdShuffle, MdSwapHoriz } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import storage, { onStorageChange, updateStorageItem } from "@/lib/localforage";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";

const STORAGE_KEY = "tournament";
const AUDIT_STORAGE_KEY = "tournament-audits";
const BRACKET_SIZE = 16;
const FIRST_ROUND_MATCHES = BRACKET_SIZE / 2;

type TournamentPlayer = {
  id: string;
  name: string;
  serye: string;
};

type TournamentMatch = {
  players: [string | null, string | null];
  winnerId: string | null;
};

type TournamentState = {
  players: TournamentPlayer[];
  rounds: TournamentMatch[][];
};

type TournamentAudit = {
  id: string;
  completedAt: string;
  champion: TournamentPlayer;
  players: TournamentPlayer[];
  rounds: TournamentMatch[][];
  missing: string[];
  duplicates: { serye: string; players: string[] }[];
};

const EMPTY_TOURNAMENT: TournamentState = { players: [], rounds: [] };

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const pickSpacedIndexes = (indexes: number[], count: number) => {
  if (count <= 0) return [];
  if (count === 1) return [indexes[Math.floor((indexes.length - 1) / 2)]];
  return Array.from(
    { length: count },
    (_, index) => indexes[Math.round((index * (indexes.length - 1)) / (count - 1))],
  );
};

const getMatchWinner = (
  players: [string | null, string | null],
  savedWinner: string | null,
  autoAdvance = true,
) => {
  const entrants = players.filter((playerId): playerId is string => playerId !== null);
  if (autoAdvance && entrants.length === 1) return entrants[0];
  return entrants.length === 2 && savedWinner !== null && entrants.includes(savedWinner) ? savedWinner : null;
};

const buildRounds = (players: TournamentPlayer[], savedRounds: TournamentMatch[][]): TournamentMatch[][] => {
  if (!savedRounds[0]) return [];

  const playerIds = new Set(players.map((player) => player.id));
  const rounds: TournamentMatch[][] = [];
  let currentMatches = savedRounds[0].map((match, index) => {
    const matchPlayers = match.players.map((id) => (id && playerIds.has(id) ? id : null)) as [
      string | null,
      string | null,
    ];
    const savedWinner = match.winnerId && playerIds.has(match.winnerId) ? match.winnerId : null;
    return {
      players: matchPlayers,
      winnerId: getMatchWinner(matchPlayers, savedWinner),
      index,
    };
  });

  let roundIndex = 0;
  while (currentMatches.length > 0) {
    rounds.push(
      currentMatches.map(({ players: matchPlayers, winnerId }) => ({ players: matchPlayers, winnerId })),
    );
    if (currentMatches.length === 1) break;

    const nextMatches: TournamentMatch[] = [];
    const useSeededNextRound =
      roundIndex === 0 && currentMatches.every((match) => match.players.every((playerId) => !playerId));
    for (let index = 0; index < currentMatches.length; index += 2) {
      const seededMatch = savedRounds[roundIndex + 1]?.[index / 2];
      const matchPlayers =
        useSeededNextRound && seededMatch
          ? (seededMatch.players.map((id) => (id && playerIds.has(id) ? id : null)) as [
              string | null,
              string | null,
            ])
          : ([currentMatches[index]?.winnerId || null, currentMatches[index + 1]?.winnerId || null] as [
              string | null,
              string | null,
            ]);
      const savedWinner = seededMatch?.winnerId || null;
      nextMatches.push({
        players: matchPlayers,
        winnerId: getMatchWinner(matchPlayers, savedWinner, false),
      });
    }
    currentMatches = nextMatches.map((match, index) => ({ ...match, index }));
    roundIndex += 1;
  }

  return rounds;
};

const migrateEightPlayerDraw = (tournament: TournamentState): TournamentState => {
  const firstRound = tournament.rounds[0];
  if (
    tournament.players.length !== 8 ||
    !firstRound ||
    firstRound.every((match) => match.players.every((playerId) => !playerId))
  ) {
    return tournament;
  }

  const playerIds = new Set(tournament.players.map((player) => player.id));
  const savedQuarterfinals = tournament.rounds[1]?.slice(0, 4).map((match) => ({
    players: match.players.map((id) => (id && playerIds.has(id) ? id : null)) as [
      string | null,
      string | null,
    ],
    winnerId: match.winnerId,
  }));
  const savedEntrants = savedQuarterfinals?.flatMap((match) => match.players.filter(Boolean)) || [];
  const quarterfinals =
    savedQuarterfinals?.length === 4 && new Set(savedEntrants).size === 8
      ? savedQuarterfinals
      : Array.from({ length: 4 }, (_, index) => ({
          players: [
            tournament.players[index * 2]?.id || null,
            tournament.players[index * 2 + 1]?.id || null,
          ] as [string | null, string | null],
          winnerId: null,
        }));
  const emptyRoundOf16 = Array.from({ length: FIRST_ROUND_MATCHES }, () => ({
    players: [null, null] as [null, null],
    winnerId: null,
  }));

  return {
    ...tournament,
    rounds: buildRounds(tournament.players, [emptyRoundOf16, quarterfinals]),
  };
};

export default function Tournament() {
  const [tournament, setTournament] = React.useState<TournamentState>(EMPTY_TOURNAMENT);
  const [name, setName] = React.useState("");
  const [serye, setSerye] = React.useState("");
  const playerNameInputRef = React.useRef<HTMLInputElement>(null);
  const [editingSlot, setEditingSlot] = React.useState<string | null>(null);
  const [slotName, setSlotName] = React.useState("");
  const [tournamentAudits, setTournamentAudits] = React.useState<TournamentAudit[]>([]);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditError, setAuditError] = React.useState("");
  const [isRandomizeDialogOpen, setIsRandomizeDialogOpen] = React.useState(false);
  const [switchingPlayerId, setSwitchingPlayerId] = React.useState<string | null>(null);
  const [switchTargetId, setSwitchTargetId] = React.useState("");

  React.useEffect(() => {
    const loadTournament = async () => {
      const saved = (await storage.getItem<TournamentState>(STORAGE_KEY)) || EMPTY_TOURNAMENT;
      const normalized = migrateEightPlayerDraw(saved);
      if (normalized !== saved) await storage.setItem(STORAGE_KEY, normalized);
      setTournament(normalized);
    };
    const loadAudits = async () => {
      setTournamentAudits((await storage.getItem<TournamentAudit[]>(AUDIT_STORAGE_KEY)) || []);
    };
    void loadTournament();
    void loadAudits();
    return onStorageChange([STORAGE_KEY, AUDIT_STORAGE_KEY], (key, value) => {
      if (key === AUDIT_STORAGE_KEY) {
        if (Array.isArray(value)) setTournamentAudits(value as TournamentAudit[]);
        else void loadAudits();
        return;
      }
      if (value && typeof value === "object" && "players" in value && "rounds" in value) {
        const saved = value as TournamentState;
        const normalized = migrateEightPlayerDraw(saved);
        if (normalized !== saved) void storage.setItem(STORAGE_KEY, normalized);
        setTournament(normalized);
      } else {
        void loadTournament();
      }
    });
  }, []);

  const saveTournament = async (next: TournamentState) => {
    await storage.setItem(STORAGE_KEY, next);
    setTournament(next);
  };

  const updateTournament = async (update: (current: TournamentState) => TournamentState) => {
    const next = await updateStorageItem<TournamentState>(STORAGE_KEY, update, EMPTY_TOURNAMENT);
    setTournament(next);
  };

  const addPlayer = async () => {
    const playerName = name.trim();
    if (!playerName || tournament.players.length >= BRACKET_SIZE) return;
    const player = { id: makeId(), name: playerName, serye: serye.trim() };
    await updateTournament((current) => ({ ...current, players: [...current.players, player] }));
    setName("");
    setSerye("");
    playerNameInputRef.current?.focus();
  };

  const updatePlayer = (playerId: string, changes: Partial<TournamentPlayer>) => {
    void updateTournament((current) => ({
      ...current,
      players: current.players.map((player) => (player.id === playerId ? { ...player, ...changes } : player)),
    }));
  };

  const removePlayer = (playerId: string) => {
    void updateTournament((current) => {
      if (!current.rounds[0]) {
        return { ...current, players: current.players.filter((player) => player.id !== playerId) };
      }
      const firstRound = current.rounds[0].map((match) => ({
        players: match.players.map((id) => (id === playerId ? null : id)) as [string | null, string | null],
        winnerId: match.winnerId === playerId ? null : match.winnerId,
      }));
      return {
        ...current,
        players: current.players.filter((player) => player.id !== playerId),
        rounds: buildRounds(
          current.players.filter((player) => player.id !== playerId),
          [firstRound],
        ),
      };
    });
  };

  const randomizePlayers = async () => {
    const entrants = shuffle(tournament.players);
    const isQuarterfinalDraw = entrants.length === 8;
    const activeMatchCount = Math.ceil(entrants.length / 2);
    const leftMatchIndexes = pickSpacedIndexes([0, 1, 2, 3], Math.ceil(activeMatchCount / 2));
    const rightMatchIndexes = pickSpacedIndexes([7, 6, 5, 4], Math.floor(activeMatchCount / 2));
    const activeMatchIndexes = [...leftMatchIndexes, ...rightMatchIndexes];
    const firstRound = Array.from({ length: FIRST_ROUND_MATCHES }, (_, matchIndex) => {
      if (isQuarterfinalDraw) {
        return { players: [null, null] as [null, null], winnerId: null };
      }
      const activeIndex = activeMatchIndexes.indexOf(matchIndex);
      return {
        players:
          activeIndex < 0
            ? ([null, null] as [null, null])
            : ([entrants[activeIndex * 2]?.id || null, entrants[activeIndex * 2 + 1]?.id || null] as [
                string | null,
                string | null,
              ]),
        winnerId: null,
      };
    });
    const quarterfinals = isQuarterfinalDraw
      ? Array.from({ length: 4 }, (_, matchIndex) => ({
          players: [entrants[matchIndex * 2]?.id || null, entrants[matchIndex * 2 + 1]?.id || null] as [
            string | null,
            string | null,
          ],
          winnerId: null,
        }))
      : null;
    await saveTournament({
      ...tournament,
      rounds: buildRounds(tournament.players, quarterfinals ? [firstRound, quarterfinals] : [firstRound]),
    });
  };

  const switchBracketPlayers = async (firstPlayerId: string, secondPlayerId: string) => {
    await updateTournament((current) => {
      const openingRoundIsEmpty = Boolean(
        current.rounds[0]?.every((match) => match.players.every((playerId) => !playerId)),
      );
      const seededRoundIndex = current.players.length === 8 && openingRoundIsEmpty ? 1 : 0;
      const seededRound = current.rounds[seededRoundIndex]?.map((match) => ({
        players: [...match.players] as [string | null, string | null],
        winnerId: null,
      }));
      if (!seededRound) return current;

      const firstPosition = seededRound
        .flatMap((match, matchIndex) =>
          match.players.map((id, playerIndex) => ({ id, matchIndex, playerIndex })),
        )
        .find((position) => position.id === firstPlayerId);
      const secondPosition = seededRound
        .flatMap((match, matchIndex) =>
          match.players.map((id, playerIndex) => ({ id, matchIndex, playerIndex })),
        )
        .find((position) => position.id === secondPlayerId);
      if (!firstPosition || !secondPosition) return current;

      seededRound[firstPosition.matchIndex].players[firstPosition.playerIndex] = secondPlayerId;
      seededRound[secondPosition.matchIndex].players[secondPosition.playerIndex] = firstPlayerId;

      const savedRounds = seededRoundIndex === 1 ? [current.rounds[0] || [], seededRound] : [seededRound];
      return { ...current, rounds: buildRounds(current.players, savedRounds) };
    });
    setSwitchingPlayerId(null);
    setSwitchTargetId("");
  };

  const auditAndRefresh = async () => {
    const winnerId = tournament.rounds[3]?.[0]?.winnerId;
    const champion = tournament.players.find((player) => player.id === winnerId);
    if (!champion || isAuditing) return;

    setIsAuditing(true);
    setAuditError("");
    const seryePlayers = new Map<string, string[]>();
    const missing = tournament.players.filter((player) => !player.serye.trim()).map((player) => player.name);
    tournament.players.forEach((player) => {
      const value = player.serye.trim();
      if (!value) return;
      const normalized = value.toLocaleLowerCase();
      seryePlayers.set(normalized, [...(seryePlayers.get(normalized) || []), player.name]);
    });
    const duplicates = [...seryePlayers.entries()]
      .filter(([, players]) => players.length > 1)
      .map(([seryeValue, players]) => ({ serye: seryeValue, players }));
    const audit: TournamentAudit = {
      id: makeId(),
      completedAt: new Date().toISOString(),
      champion: { ...champion },
      players: tournament.players.map((player) => ({ ...player })),
      rounds: tournament.rounds.map((round) =>
        round.map((match) => ({
          players: [...match.players] as [string | null, string | null],
          winnerId: match.winnerId,
        })),
      ),
      missing,
      duplicates,
    };
    try {
      const savedAudits = await updateStorageItem<TournamentAudit[]>(
        AUDIT_STORAGE_KEY,
        (current) => [...current, audit],
        [],
      );
      setTournamentAudits(savedAudits);
      await saveTournament(EMPTY_TOURNAMENT);
      setEditingSlot(null);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Could not save the tournament audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  const pickWinner = (roundIndex: number, matchIndex: number, playerId: string) => {
    void updateTournament((current) => {
      const currentRounds = buildRounds(current.players, current.rounds);
      const match = currentRounds[roundIndex]?.[matchIndex];
      if (!match?.players.includes(playerId)) return current;
      currentRounds[roundIndex][matchIndex] = {
        ...match,
        winnerId: match.winnerId === playerId ? null : playerId,
      };
      for (let nextRound = roundIndex + 1; nextRound < currentRounds.length; nextRound += 1) {
        currentRounds[nextRound] = currentRounds[nextRound].map((nextMatch) => ({
          ...nextMatch,
          winnerId: null,
        }));
      }
      return { ...current, rounds: buildRounds(current.players, currentRounds) };
    });
  };

  const startEditingSlot = (
    roundIndex: number,
    matchIndex: number,
    playerIndex: number,
    playerId: string | null,
  ) => {
    if (roundIndex > 0 && !playerId) return;
    setEditingSlot(`${roundIndex}-${matchIndex}-${playerIndex}`);
    setSlotName(tournament.players.find((player) => player.id === playerId)?.name || "");
  };

  const saveSlotName = async (
    roundIndex: number,
    matchIndex: number,
    playerIndex: number,
    playerId: string | null,
  ) => {
    const nextName = slotName.trim();
    if (roundIndex > 0 && playerId && nextName) {
      updatePlayer(playerId, { name: nextName });
      setEditingSlot(null);
      return;
    }

    if (roundIndex === 0) {
      await updateTournament((current) => {
        const firstRound = current.rounds[0]?.map((match) => ({
          players: [...match.players] as [string | null, string | null],
          winnerId: match.winnerId,
        }));
        if (!firstRound) return current;
        const previousId = firstRound[matchIndex].players[playerIndex];
        const trimmedName = slotName.trim();
        let players = [...current.players];
        let nextId = previousId;

        if (trimmedName && previousId) {
          players = players.map((player) =>
            player.id === previousId ? { ...player, name: trimmedName } : player,
          );
        } else if (trimmedName && !previousId && players.length < BRACKET_SIZE) {
          const created = { id: makeId(), name: trimmedName, serye: "" };
          players.push(created);
          nextId = created.id;
        } else if (!trimmedName && previousId) {
          players = players.filter((player) => player.id !== previousId);
          nextId = null;
        }

        firstRound[matchIndex].players[playerIndex] = nextId;
        if (
          firstRound[matchIndex].winnerId &&
          !firstRound[matchIndex].players.includes(firstRound[matchIndex].winnerId)
        ) {
          firstRound[matchIndex].winnerId = null;
        }
        return { players, rounds: buildRounds(players, [firstRound]) };
      });
    }
    setEditingSlot(null);
  };

  const playerById = React.useMemo(
    () => new Map(tournament.players.map((player) => [player.id, player])),
    [tournament.players],
  );
  const openingRoundIsEmpty = Boolean(
    tournament.rounds[0]?.every((match) => match.players.every((playerId) => !playerId)),
  );
  const quarterfinalDraw = tournament.players.length === 8 && openingRoundIsEmpty;
  const leftSideMatches = quarterfinalDraw
    ? tournament.rounds[1]?.slice(0, 2)
    : tournament.rounds[0]?.slice(0, FIRST_ROUND_MATCHES / 2);
  const rightSideMatches = quarterfinalDraw
    ? tournament.rounds[1]?.slice(2, 4)
    : tournament.rounds[0]?.slice(FIRST_ROUND_MATCHES / 2);
  const leftSideCount =
    leftSideMatches?.reduce((total, match) => total + match.players.filter(Boolean).length, 0) || 0;
  const rightSideCount =
    rightSideMatches?.reduce((total, match) => total + match.players.filter(Boolean).length, 0) || 0;
  const championId = tournament.rounds[3]?.[0]?.winnerId;
  const canArchiveTournament = Boolean(tournament.players.find((player) => player.id === championId));
  const switchingPlayer = tournament.players.find((player) => player.id === switchingPlayerId);
  const openingSeedRoundIndex = quarterfinalDraw ? 1 : 0;
  const switchOptions = (tournament.rounds[openingSeedRoundIndex] || [])
    .flatMap((match) => match.players)
    .filter((playerId): playerId is string => Boolean(playerId && playerId !== switchingPlayerId))
    .map((playerId) => playerById.get(playerId))
    .filter((player): player is TournamentPlayer => Boolean(player));

  return (
    <div className='space-y-5'>
      <Dialog open={isRandomizeDialogOpen} onOpenChange={setIsRandomizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randomize bracket?</DialogTitle>
            <DialogDescription>
              This will reshuffle the players and clear all current match results. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsRandomizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='warning'
              onClick={() => {
                setIsRandomizeDialogOpen(false);
                void randomizePlayers();
              }}
            >
              <MdShuffle /> Randomize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={switchingPlayerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSwitchingPlayerId(null);
            setSwitchTargetId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch bracket players</DialogTitle>
            <DialogDescription>
              Choose which seeded player to swap with {switchingPlayer?.name || "this player"}. Match results
              will be cleared after the draw changes.
            </DialogDescription>
          </DialogHeader>
          <label className='space-y-1'>
            <span className='font-semibold'>Switch with</span>
            <select
              className='h-11 w-full rounded-md border bg-background px-3'
              value={switchTargetId}
              onChange={(event) => setSwitchTargetId(event.target.value)}
            >
              <option value=''>Select a player</option>
              {switchOptions.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSwitchingPlayerId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!switchingPlayerId || !switchTargetId}
              onClick={() => {
                if (switchingPlayerId && switchTargetId) {
                  void switchBracketPlayers(switchingPlayerId, switchTargetId);
                }
              }}
            >
              Switch players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className='space-y-2 p-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h2 className='flex items-center gap-2 text-lg font-bold'>
              <MdEmojiEvents className='text-amber-500' /> Tournament
            </h2>
            <p className='text-sm text-muted-foreground'>
              {tournament.players.length} / {BRACKET_SIZE} players. Serye is saved with each player and shown
              in the bracket.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              disabled={tournament.players.length < 2}
              onClick={() => setIsRandomizeDialogOpen(true)}
              size='xl'
              variant='warning'
              className='cursor-pointer'
            >
              <MdShuffle /> Randomize bracket
            </Button>
          </div>
        </div>

        <div className='max-h-100 overflow-y-auto rounded-md border'>
          <table className='w-full table-fixed text-sm'>
            <thead className='sticky top-0 z-10 bg-white'>
              <tr>
                <th className='border-t bg-gray-100 px-3 py-2 text-left text-xs uppercase text-gray-600'>
                  Name
                </th>
                <th className='border-t bg-gray-100 px-3 py-2 text-left text-xs uppercase text-gray-600'>
                  Serye
                </th>
                <th className='w-14 border-t bg-gray-100 px-3 py-2'></th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-twh'>
                <td className='px-3 py-3'>
                  <Input
                    ref={playerNameInputRef}
                    aria-label='Player name'
                    placeholder='Player name'
                    value={name}
                    disabled={tournament.players.length >= BRACKET_SIZE}
                    onChange={(event) => setName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addPlayer();
                      }
                    }}
                  />
                </td>
                <td className='px-3 py-3'>
                  <Input
                    aria-label='Player serye'
                    placeholder='Serye'
                    value={serye}
                    disabled={tournament.players.length >= BRACKET_SIZE}
                    onChange={(event) => setSerye(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addPlayer();
                      }
                    }}
                  />
                </td>
                <td className='px-3 py-3'>
                  <Button
                    size='icon'
                    disabled={!name.trim() || tournament.players.length >= BRACKET_SIZE}
                    onClick={() => void addPlayer()}
                  >
                    <FaPlus />
                  </Button>
                </td>
              </tr>

              {[...tournament.players].reverse().map((player) => (
                <tr key={player.id} className='border-t'>
                  <td className='px-3 py-2'>
                    <Input
                      aria-label='Edit player name'
                      value={player.name}
                      onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <Input
                      aria-label='Edit player serye'
                      value={player.serye}
                      onChange={(event) => updatePlayer(player.id, { serye: event.target.value })}
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <Button
                      aria-label={`Remove ${player.name}`}
                      size='icon'
                      variant='destructive'
                      onClick={() => removePlayer(player.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
              {tournament.players.length === 0 && (
                <tr>
                  <td colSpan={3} className='px-3 py-8 text-center text-muted-foreground'>
                    Add players and their serye, then randomize the bracket.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {tournament.rounds.length > 0 && (
        <Card className='space-y-4 p-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h3 className='text-lg font-bold'>16-Team Single Elimination</h3>
              <p className='text-sm text-muted-foreground'>
                Click a player slot to select a match winner. Use the swap icon to change bracket positions or
                the pencil to edit a player name.
              </p>
              <div className='mt-2 flex flex-wrap gap-2 text-xs font-semibold'>
                <span className='rounded-full border bg-gray-50 px-3 py-1'>
                  Left side · {leftSideCount} / 8 players
                </span>
                <span className='rounded-full border bg-gray-50 px-3 py-1'>
                  Right side · {rightSideCount} / 8 players
                </span>
              </div>
            </div>
            <Button
              disabled={!canArchiveTournament || isAuditing}
              onClick={() => void auditAndRefresh()}
              size='xl'
              variant='outline'
              className='cursor-pointer'
            >
              <MdRefresh /> {isAuditing ? "Saving audit..." : "Audit & Refresh"}
            </Button>
            {!canArchiveTournament && (
              <p className='w-full text-right text-xs text-muted-foreground'>
                Select the Final winner before saving the audit.
              </p>
            )}
            {auditError && (
              <p role='alert' className='w-full text-right text-xs text-red-700'>
                {auditError}
              </p>
            )}
          </div>
          <div className='w-full'>
            <div className='w-full'>
              <div className='grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-gray-600'>
                <div className='bg-gray-100 border rounded-xl py-2'>Round of 16</div>
                <div className='bg-gray-100 border rounded-xl py-2'>Quarterfinals</div>
                <div className='bg-gray-100 border rounded-xl py-2'>Semifinals</div>
                <div className='flex items-center justify-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800'>
                  <MdEmojiEvents className='h-4 w-4' /> Final
                </div>
                <div className='bg-gray-100 border rounded-xl py-2'>Semifinals</div>
                <div className='bg-gray-100 border rounded-xl py-2'>Quarterfinals</div>
                <div className='bg-gray-100 border rounded-xl py-2'>Round of 16</div>
              </div>
              <div className='relative mt-2 grid w-full grid-cols-7 grid-rows-[repeat(16,36px)] gap-x-1'>
                <svg
                  aria-hidden='true'
                  className='pointer-events-none absolute inset-0 z-0 h-full w-full'
                  viewBox='0 0 1000 576'
                  preserveAspectRatio='none'
                >
                  <g
                    fill='none'
                    stroke='#cbd5e1'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1'
                  >
                    {!quarterfinalDraw && (
                      <>
                        <path d='M 140 72 H 143 V 144 H 147 M 140 216 H 143 V 144' />
                        <path d='M 140 360 H 143 V 432 H 147 M 140 504 H 143 V 432' />
                        <path d='M 861 72 H 857 V 144 H 853 M 861 216 H 857 V 144' />
                        <path d='M 861 360 H 857 V 432 H 853 M 861 504 H 857 V 432' />
                      </>
                    )}
                    <path d='M 282 144 H 286 V 288 H 290 M 282 432 H 286 V 288' />
                    <path d='M 425 288 H 433' />
                    <path d='M 718 144 H 714 V 288 H 710 M 718 432 H 714 V 288' />
                    <path d='M 575 288 H 567' />
                  </g>
                </svg>
                {(
                  [
                    {
                      column: 1,
                      roundIndex: 0,
                      matchIndexes: [0, 1, 2, 3],
                      startRows: [1, 5, 9, 13],
                      span: 4,
                    },
                    { column: 2, roundIndex: 1, matchIndexes: [0, 1], startRows: [1, 9], span: 8 },
                    { column: 3, roundIndex: 2, matchIndexes: [0], startRows: [1], span: 16 },
                    { column: 4, roundIndex: 3, matchIndexes: [0], startRows: [1], span: 16 },
                    { column: 5, roundIndex: 2, matchIndexes: [1], startRows: [1], span: 16 },
                    { column: 6, roundIndex: 1, matchIndexes: [3, 2], startRows: [1, 9], span: 8 },
                    {
                      column: 7,
                      roundIndex: 0,
                      matchIndexes: [7, 6, 5, 4],
                      startRows: [1, 5, 9, 13],
                      span: 4,
                    },
                  ] as const
                ).flatMap(({ column, roundIndex, matchIndexes, startRows, span }) =>
                  matchIndexes.map((matchIndex) => {
                    const match = tournament.rounds[roundIndex]?.[matchIndex];
                    if (!match) return null;
                    const visualMatchIndex = startRows.findIndex(
                      (_, index) => matchIndexes[index] === matchIndex,
                    );
                    return (
                      <div
                        key={`${roundIndex}-${matchIndex}-${column}`}
                        className={`relative z-10 flex min-h-0 w-[92%] justify-self-center flex-col justify-center gap-y-2 ${
                          roundIndex === 3
                            ? "h-fit self-center rounded-md  bg-linear-to-b from-amber-50 to-white "
                            : ""
                        }`}
                        style={{
                          gridColumn: column,
                          gridRow: `${startRows[visualMatchIndex]} / span ${span}`,
                        }}
                      >
                        {match.players.map((playerId, playerIndex) => {
                          const player = playerId ? playerById.get(playerId) : null;
                          const isWinner = match.winnerId === playerId && Boolean(playerId);
                          const editKey = `${roundIndex}-${matchIndex}-${playerIndex}`;
                          const isEditing = editingSlot === editKey;
                          const canEdit = (roundIndex === 0 && !quarterfinalDraw) || Boolean(playerId);
                          const isEmptySlot = quarterfinalDraw && roundIndex === 0 && !playerId;
                          return (
                            <div
                              key={`${editKey}-${playerId || "empty"}`}
                              className={`group/slot relative flex min-h-6 items-center rounded-lg border-2 ${
                                isEmptySlot
                                  ? "pointer-events-none border-transparent bg-transparent opacity-0"
                                  : isWinner
                                    ? "border-amber-500 bg-amber-50"
                                    : playerId
                                      ? "border-slate-300 bg-white"
                                      : "border-slate-200 bg-slate-50"
                              } ${playerId && match.players.filter(Boolean).length === 2 ? "cursor-pointer" : ""}`}
                              onClick={() => {
                                if (playerId && match.players.filter(Boolean).length === 2) {
                                  pickWinner(roundIndex, matchIndex, playerId);
                                }
                              }}
                            >
                              {isEditing ? (
                                <form
                                  className='flex w-full gap-1 p-1'
                                  onClick={(event) => event.stopPropagation()}
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    void saveSlotName(roundIndex, matchIndex, playerIndex, playerId);
                                  }}
                                >
                                  <Input
                                    autoFocus
                                    aria-label='Bracket player name'
                                    value={slotName}
                                    onChange={(event) => setSlotName(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Escape") setEditingSlot(null);
                                    }}
                                  />
                                  <Button size='sm' type='submit'>
                                    Save
                                  </Button>
                                </form>
                              ) : (
                                <>
                                  <div
                                    className={`min-w-0 flex-1 px-1.5 text-xs py-2 ${
                                      playerId ? "text-gray-900" : "text-gray-400"
                                    }
                                    
                                    ${player?.name || (roundIndex === 0 ? "" : "py-3.5")}
                                    `}
                                  >
                                    <span className='block truncate font-bold text-sm capitalize'>
                                      {player?.name || (roundIndex === 0 ? "" : "Winner advances here")}
                                    </span>
                                    {player?.serye && (
                                      <span className='block truncate text-[0.65rem] text-muted-foreground'>
                                        Serye: {player.serye}
                                      </span>
                                    )}
                                    {isWinner && (
                                      <span className='text-[0.65rem] font-bold text-amber-700'>
                                        {match.players.filter(Boolean).length === 1
                                          ? ""
                                          : roundIndex === 3
                                            ? "FINAL WINNER"
                                            : ""}
                                      </span>
                                    )}
                                  </div>
                                  {canEdit && (
                                    <div className='mr-0.5 flex shrink-0 items-center'>
                                      {playerId && switchOptions.length > 0 && (
                                        <Button
                                          type='button'
                                          size='sm'
                                          variant='ghost'
                                          aria-label={`Switch ${player?.name || "player"} in bracket`}
                                          className='shrink-0'
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSwitchingPlayerId(playerId);
                                            setSwitchTargetId("");
                                          }}
                                        >
                                          <HiOutlineSwitchHorizontal className='h-10 w-10' />
                                        </Button>
                                      )}
                                      <Button
                                        type='button'
                                        size='icon-xs'
                                        variant='ghost'
                                        aria-label={`Edit ${player?.name || "bracket slot"}`}
                                        className='shrink-0'
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          startEditingSlot(roundIndex, matchIndex, playerIndex, playerId);
                                        }}
                                      >
                                        <MdEdit />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
      {tournamentAudits.length > 0 && (
        <Card className='space-y-4 p-5'>
          <div>
            <h3 className='text-lg font-bold'>Tournament Audit History</h3>
            <p className='text-sm text-muted-foreground'>
              Saved tournament results, champion, and player serye details.
            </p>
          </div>
          <ol className='space-y-3 max-h-[31.25rem] overflow-y-auto'>
            {[...tournamentAudits].reverse().map((audit) => (
              <li key={audit.id} className='rounded-lg border bg-white p-4'>
                <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2'>
                  <div className='flex items-center gap-2 font-semibold text-amber-800'>
                    <MdEmojiEvents aria-hidden='true' />
                    Champion: {audit.champion.name}
                    {audit.champion.serye && (
                      <span className='font-normal text-muted-foreground'>
                        · Serye {audit.champion.serye}
                      </span>
                    )}
                  </div>
                  <time className='text-xs text-muted-foreground' dateTime={audit.completedAt}>
                    {new Date(audit.completedAt).toLocaleString()}
                  </time>
                </div>
                <ul className='mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4'>
                  {audit.players.map((player) => (
                    <li key={player.id} className='rounded-md bg-gray-50 px-3 py-2'>
                      <span className='block font-medium'>{player.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        Serye: {player.serye.trim() || "Missing"}
                      </span>
                    </li>
                  ))}
                </ul>
                <details className='mt-3 rounded-md border bg-gray-50 px-3 py-2'>
                  <summary className='cursor-pointer text-sm font-medium'>View match results</summary>
                  <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                    {["Round of 16", "Quarterfinals", "Semifinals", "Final"].map((roundName, roundIndex) => {
                      const auditPlayerById = new Map(audit.players.map((player) => [player.id, player]));
                      const matches = audit.rounds[roundIndex] || [];
                      if (!matches.length) return null;
                      return (
                        <div key={roundName}>
                          <h4 className='mb-1 text-xs font-bold uppercase text-muted-foreground'>
                            {roundName}
                          </h4>
                          <ul className='space-y-1 text-xs'>
                            {matches.map((match, matchIndex) => {
                              const contestants = match.players
                                .map((playerId) => (playerId ? auditPlayerById.get(playerId)?.name : null))
                                .filter((playerName): playerName is string => Boolean(playerName));
                              if (contestants.length === 0) return null;
                              const winner = match.winnerId
                                ? auditPlayerById.get(match.winnerId)?.name
                                : null;
                              return (
                                <li key={`${roundName}-${matchIndex}`}>
                                  {contestants.join(" vs. ")}
                                  {winner ? ` · Winner: ${winner}` : " · No winner"}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </details>
                {(audit.missing.length > 0 || audit.duplicates.length > 0) && (
                  <div className='mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                    {audit.missing.length > 0 && <p>Missing serye: {audit.missing.join(", ")}</p>}
                    {audit.duplicates.map(({ serye: duplicateSerye, players }) => (
                      <p key={duplicateSerye}>
                        Duplicate serye {duplicateSerye}: {players.join(", ")}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

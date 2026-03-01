import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('gameStore — phase transitions', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('defaults to preseason phase', () => {
    expect(useGameStore.getState().gamePhase).toBe('preseason');
  });

  it('transitions through all game phases', () => {
    const { setGamePhase } = useGameStore.getState();

    setGamePhase('simulating');
    expect(useGameStore.getState().gamePhase).toBe('simulating');

    setGamePhase('postseason');
    expect(useGameStore.getState().gamePhase).toBe('postseason');

    setGamePhase('offseason');
    expect(useGameStore.getState().gamePhase).toBe('offseason');

    setGamePhase('fired');
    expect(useGameStore.getState().gamePhase).toBe('fired');
  });
});

describe('gameStore — season phase', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('defaults to early season phase', () => {
    expect(useGameStore.getState().seasonPhase).toBe('early');
  });

  it('transitions through season phases', () => {
    const { setSeasonPhase } = useGameStore.getState();

    setSeasonPhase('allstar');
    expect(useGameStore.getState().seasonPhase).toBe('allstar');

    setSeasonPhase('deadline');
    expect(useGameStore.getState().seasonPhase).toBe('deadline');

    setSeasonPhase('stretch');
    expect(useGameStore.getState().seasonPhase).toBe('stretch');

    setSeasonPhase('complete');
    expect(useGameStore.getState().seasonPhase).toBe('complete');
  });
});

describe('gameStore — owner patience clamping', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('defaults to 70', () => {
    expect(useGameStore.getState().ownerPatience).toBe(70);
  });

  it('clamps setOwnerPatience to 0–100', () => {
    useGameStore.getState().setOwnerPatience(150);
    expect(useGameStore.getState().ownerPatience).toBe(100);

    useGameStore.getState().setOwnerPatience(-50);
    expect(useGameStore.getState().ownerPatience).toBe(0);
  });

  it('adjustOwnerPatience clamps to 0–100', () => {
    useGameStore.getState().setOwnerPatience(95);
    useGameStore.getState().adjustOwnerPatience(20);
    expect(useGameStore.getState().ownerPatience).toBe(100);

    useGameStore.getState().setOwnerPatience(5);
    useGameStore.getState().adjustOwnerPatience(-20);
    expect(useGameStore.getState().ownerPatience).toBe(0);
  });

  it('adjustOwnerPatience applies delta correctly', () => {
    useGameStore.getState().setOwnerPatience(50);
    useGameStore.getState().adjustOwnerPatience(-15);
    expect(useGameStore.getState().ownerPatience).toBe(35);

    useGameStore.getState().adjustOwnerPatience(10);
    expect(useGameStore.getState().ownerPatience).toBe(45);
  });
});

describe('gameStore — team morale clamping', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('defaults to 65', () => {
    expect(useGameStore.getState().teamMorale).toBe(65);
  });

  it('clamps setTeamMorale to 0–100', () => {
    useGameStore.getState().setTeamMorale(200);
    expect(useGameStore.getState().teamMorale).toBe(100);

    useGameStore.getState().setTeamMorale(-10);
    expect(useGameStore.getState().teamMorale).toBe(0);
  });

  it('adjustTeamMorale clamps to 0–100', () => {
    useGameStore.getState().setTeamMorale(95);
    useGameStore.getState().adjustTeamMorale(20);
    expect(useGameStore.getState().teamMorale).toBe(100);

    useGameStore.getState().setTeamMorale(5);
    useGameStore.getState().adjustTeamMorale(-20);
    expect(useGameStore.getState().teamMorale).toBe(0);
  });
});

describe('gameStore — incrementSeasonsManaged', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('starts at 0', () => {
    expect(useGameStore.getState().seasonsManaged).toBe(0);
  });

  it('increments by 1 each call', () => {
    useGameStore.getState().incrementSeasonsManaged();
    expect(useGameStore.getState().seasonsManaged).toBe(1);
    useGameStore.getState().incrementSeasonsManaged();
    expect(useGameStore.getState().seasonsManaged).toBe(2);
  });
});

describe('gameStore — resetAll', () => {
  it('resets all state to defaults', () => {
    const state = useGameStore.getState();
    state.setGamePhase('fired');
    state.setSeasonPhase('complete');
    state.setOwnerPatience(0);
    state.setTeamMorale(0);
    state.setSeason(2030);
    state.setGameStarted(true);
    state.incrementSeasonsManaged();

    state.resetAll();

    const reset = useGameStore.getState();
    expect(reset.gamePhase).toBe('preseason');
    expect(reset.seasonPhase).toBe('early');
    expect(reset.ownerPatience).toBe(70);
    expect(reset.teamMorale).toBe(65);
    expect(reset.season).toBe(2026);
    expect(reset.gameStarted).toBe(false);
    expect(reset.seasonsManaged).toBe(0);
  });
});

describe('gameStore — front office management', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('adds and removes FO staff', () => {
    const member = {
      id: 'scout-1', roleId: 'scout_dir' as const, name: 'Test Scout',
      ovr: 70, salary: 2, yearsLeft: 3, traitId: 'analytical' as const,
      backstory: 'Test', icon: '🔍', title: 'Scout Director', color: 'blue', tier: 'core' as const,
    };
    useGameStore.getState().addFOStaff(member);
    expect(useGameStore.getState().frontOffice).toHaveLength(1);
    expect(useGameStore.getState().frontOffice[0].id).toBe('scout-1');

    useGameStore.getState().removeFOStaff('scout-1');
    expect(useGameStore.getState().frontOffice).toHaveLength(0);
  });
});

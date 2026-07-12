# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore a 9,600-unit-wide, 2,200-unit-tall mechanical ruin with varied cross-room platforms, a two-entrance undercroft, enemies above and below the main floor, named region gates, a merchant concourse, and substantial upper regions reserved for later movement abilities. Defeating the boss reveals the first animated ability pickup, which unlocks vault movement.

## Run

```bash
npm start
```

Open http://127.0.0.1:4173.

## Controls

- `A` / `D`: move
- `W`: basic jump and aim up
- `Shift`: dash
- `S`: aim down
- `Space`: instant white slash in the current aim direction
- `E`: repair one missing shell for 30 electricity
- `O`: rest at the post-boss recovery station
- `W` + movement into a low obstacle: vault after collecting the post-boss upgrade
- `I`: reserved for the future inventory/map; currently unbound
- `Shift`, `Q`, `F`: implemented but locked at the beginning

## Test

```bash
npm test
```

The suite checks movement, jumping, vaulting, pickups, region transitions, dashing, wall interaction, cardinal melee combat, resources, powered abilities, enemy damage, traps, lives, enemy variety, proximity aggro, edge avoidance, two-way room connections, lower-loop recovery, ability gates, headroom, junk bypasses, and surface queries.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.

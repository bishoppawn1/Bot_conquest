# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore a 9,600-unit-wide, 1,800-unit-tall mechanical ruin whose lower route and six reversible vertical branches are traversable with the starting jump, with only three small optional caches reserved for later mobility. The world includes three 840-unit playable shafts, shorter upper stacks, readable braced walls, patrol encounters, salvage pockets, breakable junk, exhaustible conduits, a locking three-move boss encounter, and a post-boss recovery room.

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
- `I`: reserved for the future inventory/map; currently unbound
- `Shift`, `Q`, `F`: implemented but locked at the beginning
- `R`: restart

## Test

```bash
npm test
```

The suite checks movement, jumping, dashing, wall interaction, cardinal melee combat, resources, powered abilities, enemy damage, traps, lives, enemy variety, proximity aggro, edge avoidance, vertical-route reversibility, headroom, junk bypasses, and surface queries.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.

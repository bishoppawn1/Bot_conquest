# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore a 9,600-unit-wide, 2,200-unit-tall mechanical ruin with a dark descending Sunken Vault, a gated mini-boss encounter, enemies above and below the main floor, named region gates, sealed merchant rooms, and upper regions reserved for later movement abilities. Ability cores unlock Volt Jab in the vault and wall climbing after the Heavy Core.

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
- `E`: channel a short repair for 30 electricity; taking damage interrupts it
- `O`: interact with rest stations and unlocked merchant doors
- `F`: Volt Jab after collecting the blue Sunken Vault core
- Hold `W` at a wall to climb after collecting the post-boss upgrade; press the direction away from the wall to jump off
- `I`: reserved for the future inventory/map; currently unbound
- `Shift`, `Q`, `F`: locked at the beginning and unlocked through later pickups

## Test

```bash
npm test
```

The suite checks movement, jumping, wall climbing, merchant-room access, repair timing and interruption, pickups and tutorial popups, region transitions, bosses, cardinal melee combat, resources, enemy damage, traps, lives, aggro, edge avoidance, reversible Vault routes, ability gates, headroom, junk bypasses, and surface queries.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.

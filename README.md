# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore a 14,500-unit-wide, 2,200-unit-tall mechanical ruin with the dark descending Sunken Vault, two full bosses, an optional scrap mini-boss, the trap-heavy Shard Gauntlet, Quiet Drift, and the expansive Grand Exchange. Ability cores unlock Volt Jab after the Abyss Warden and wall climbing after the Heavy Core.

## Run

```bash
npm start
```

Open http://127.0.0.1:4175.

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

The Edge Forge merchant in the Grand Exchange sells one `+1` primary-slash damage upgrade for 100 scrap.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.

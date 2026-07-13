# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore a 9,600-unit-wide, 2,200-unit-tall mechanical ruin with varied cross-room platforms, a dark descending Sunken Vault, a gated mini-boss encounter, enemies above and below the main floor, named region gates, a merchant concourse, and substantial upper regions reserved for later movement abilities. Ability cores unlock Volt Jab in the vault and vault movement after the Heavy Core.

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
- `F`: Volt Jab after collecting the blue Sunken Vault core
- `W` + movement into a low obstacle: vault after collecting the post-boss upgrade
- `I`: reserved for the future inventory/map; currently unbound
- `Shift`, `Q`, `F`: locked at the beginning and unlocked through later pickups

## Test

```bash
npm test
```

The suite checks movement, jumping, vaulting, pickups and tutorial popups, region transitions, mini-boss gating and rewards, dashing, wall interaction, cardinal melee combat, resources, powered abilities, enemy damage, traps, lives, enemy variety, proximity aggro, edge avoidance, reversible vault routes, ability gates, headroom, junk bypasses, and surface queries.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.

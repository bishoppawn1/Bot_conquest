export const WORLD_WIDTH = 9600;
export const WORLD_TOP = -1000;
export const WORLD_BOTTOM = 1200;
export const WORLD_HEIGHT = WORLD_BOTTOM-WORLD_TOP;

export const SPAWN = { x:180, y:624 };

// The lower route is a reversible chain: every upward change is within the
// basic jump and every gap can be crossed in either direction.
export const FOUNDATION_BLOCKS = [
  {id:'west-floor',x:0,y:660,w:1200,h:140,kind:'foundation'},
  {id:'assembly-floor',x:1290,y:620,w:980,h:180,kind:'foundation'},
  {id:'vault-left',x:2360,y:680,w:280,h:120,kind:'foundation'},
  {id:'vault-center',x:2800,y:680,w:300,h:120,kind:'foundation'},
  {id:'vault-right',x:3260,y:680,w:200,h:120,kind:'foundation'},
  {id:'foundry-floor',x:3550,y:610,w:1300,h:190,kind:'foundation'},
  {id:'prearena-floor',x:4950,y:670,w:840,h:130,kind:'foundation'},
  {id:'boss-floor',x:5890,y:600,w:1300,h:200,kind:'foundation'},
  {id:'rest-floor',x:7350,y:660,w:980,h:140,kind:'foundation'},
  {id:'relay-floor',x:8400,y:590,w:1200,h:210,kind:'foundation'}
];

export const OVERHEAD_BLOCKS = [
  {x:0,y:-200,w:1200,h:80,kind:'ceiling'},
  {x:1290,y:-900,w:980,h:100,kind:'ceiling'},
  {x:2360,y:-400,w:1100,h:70,kind:'ceiling'},
  {x:3550,y:-900,w:1300,h:100,kind:'ceiling'},
  {x:4950,y:-300,w:840,h:100,kind:'ceiling'},
  {x:5890,y:250,w:1300,h:100,kind:'ceiling'},
  {x:7350,y:350,w:980,h:100,kind:'ceiling'},
  {x:8400,y:-900,w:1200,h:110,kind:'ceiling'}
];

// Every interior block sits flush on one foundation, is exactly one basic
// jump high, and leaves at least 80 units of exposed floor around it.
export const INTERIOR_BLOCKS = [
  {id:'west-step',x:430,y:590,w:180,h:70,kind:'interior'},
  {x:800,y:590,w:260,h:70,kind:'interior'},
  {id:'assembly-step',x:1400,y:550,w:220,h:70,kind:'interior'},
  {x:1950,y:550,w:180,h:70,kind:'interior'},
  {id:'vault-step',x:2440,y:610,w:120,h:70,kind:'interior'},
  {id:'foundry-step',x:3650,y:540,w:300,h:70,kind:'interior'},
  {x:4400,y:540,w:260,h:70,kind:'interior'},
  {id:'prearena-step',x:5100,y:600,w:200,h:70,kind:'interior'},
  {id:'relay-step',x:8600,y:520,w:260,h:70,kind:'interior'}
];

// Starting-kit exploration surfaces are scattered across rooms rather than
// arranged as staircases. Their varied spans create broad leaps, return drops,
// combat perches, and alternate lines through the same space.
export const BRANCH_BLOCKS = [
  {id:'start-loft',x:650,y:450,w:210,h:45,kind:'branch',zone:'west'},
  {id:'west-bridge',x:970,y:300,w:360,h:55,kind:'branch',zone:'west'},

  {id:'assembly-entry',x:1630,y:430,w:190,h:40,kind:'branch',zone:'assembly'},
  {id:'assembly-perch',x:1910,y:280,w:300,h:50,kind:'branch',zone:'assembly'},
  {id:'assembly-cross',x:1420,y:140,w:350,h:45,kind:'branch',zone:'assembly'},

  {id:'vault-ledge',x:2570,y:470,w:180,h:40,kind:'branch',zone:'vault'},
  {id:'vault-span',x:2850,y:350,w:380,h:55,kind:'branch',zone:'vault'},
  {id:'vault-high',x:3270,y:210,w:180,h:40,kind:'branch',zone:'vault'},

  {id:'foundry-platform',x:3960,y:400,w:310,h:60,kind:'branch',zone:'foundry'},
  {id:'foundry-mid',x:4350,y:280,w:220,h:40,kind:'branch',zone:'foundry'},
  {id:'foundry-east',x:4600,y:400,w:230,h:50,kind:'branch',zone:'foundry'},
  {id:'foundry-west',x:4120,y:140,w:220,h:45,kind:'branch',zone:'foundry'},
  {id:'foundry-high',x:3740,y:0,w:260,h:50,kind:'branch',zone:'foundry'},

  {id:'prearena-low',x:5310,y:460,w:170,h:40,kind:'branch',zone:'prearena'},
  {id:'prearena-wide',x:5480,y:310,w:300,h:55,kind:'branch',zone:'prearena'},
  {id:'prearena-high',x:5270,y:170,w:190,h:45,kind:'branch',zone:'prearena'},

  {id:'relay-entry',x:8870,y:380,w:210,h:40,kind:'branch',zone:'relay'},
  {id:'relay-east',x:9250,y:240,w:300,h:55,kind:'branch',zone:'relay'},
  {id:'relay-center',x:8840,y:100,w:260,h:45,kind:'branch',zone:'relay'},
  {id:'relay-west',x:8440,y:-40,w:310,h:50,kind:'branch',zone:'relay'}
];

// The undercroft is entered through two safe openings in the vault floor. It
// forms a lower loop rather than a fatal drop or one-way pit.
export const LOWER_BLOCKS = [
  {id:'under-entry',x:2640,y:850,w:160,h:45,kind:'lower'},
  {id:'under-bridge',x:2820,y:950,w:260,h:55,kind:'lower'},
  {id:'under-cache',x:2500,y:1080,w:300,h:60,kind:'lower'},
  {id:'under-exit',x:3100,y:840,w:160,h:40,kind:'lower'}
];

// Small alcoves exist only at the outer ends of the world, where their back
// walls cannot seal a through-route or strand the player.
export const POCKET_BLOCKS = [
  {x:40,y:430,w:300,h:70,kind:'pocket-ceiling'},
  {x:9300,y:380,w:300,h:70,kind:'pocket-ceiling'}
];

export const WALL_BLOCKS = [
  {x:40,y:500,w:60,h:160,kind:'wall'},
  {x:9540,y:450,w:60,h:140,kind:'wall'},
  {x:8340,y:-600,w:60,h:540,kind:'wall'}
];

// Three substantial optional regions remain unreachable with the starting
// kit. Their first platforms require double jump, dash, or wall movement;
// their remaining surfaces form explorable rooms beyond those entrances.
export const ABILITY_GATED_BLOCKS = [
  {id:'double-entry',x:1160,y:-80,w:190,h:45,kind:'cache',requires:'doubleJump',region:'upper-assembly',gateEntry:true},
  {id:'double-gallery',x:1480,y:-220,w:370,h:55,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-east',x:1960,y:-70,w:230,h:40,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-vault',x:1830,y:-390,w:280,h:50,kind:'cache',requires:'doubleJump',region:'upper-assembly'},
  {id:'double-cache',x:1330,y:-540,w:330,h:60,kind:'cache',requires:'doubleJump',region:'upper-assembly'},

  {id:'dash-entry',x:4430,y:80,w:180,h:40,kind:'cache',requires:'dash',region:'high-foundry',gateEntry:true},
  {id:'dash-pier',x:4700,y:-70,w:140,h:45,kind:'cache',requires:'dash',region:'high-foundry'},
  {id:'dash-cache',x:4320,y:-230,w:380,h:55,kind:'cache',requires:'dash',region:'high-foundry'},

  {id:'wall-entry',x:8420,y:-310,w:180,h:45,kind:'cache',requires:'wallClimb',region:'relay-crown',gateEntry:true},
  {id:'wall-gallery',x:8750,y:-470,w:340,h:60,kind:'cache',requires:'wallClimb',region:'relay-crown'},
  {id:'wall-east',x:9200,y:-320,w:180,h:45,kind:'cache',requires:'wallClimb',region:'relay-crown'},
  {id:'wall-cache',x:9000,y:-650,w:320,h:55,kind:'cache',requires:'wallClimb',region:'relay-crown'}
];

export const BOSS_ARENA = {
  x:5890,y:350,w:1300,h:250,floorY:600,
  triggerX:6000,leftGateX:5905,rightGateX:7133,gateWidth:42,
  gateStartY:80,gateClosedY:350,gateHeight:250,
  boss:{type:'boss',x:6500,y:500,w:120,h:100,health:18}
};

export const REST_AREA = {
  x:7420,y:450,w:650,h:210,floorY:660,
  station:{x:7520,y:594,w:64,h:66,interactionRadius:115}
};

export const RECESSES = [
  {x:110,y:-120,w:980,h:780,floorY:660,ceilingY:-120,openSide:'right'},
  {x:1340,y:-800,w:780,h:1420,floorY:620,ceilingY:-800,openSide:'left'},
  {x:2380,y:-330,w:1050,h:1010,floorY:680,ceilingY:-330,openSide:'right',floorOpenings:true},
  {x:3650,y:-800,w:1040,h:1410,floorY:610,ceilingY:-800,openSide:'left'},
  {x:5030,y:-200,w:690,h:870,floorY:670,ceilingY:-200,openSide:'right'},
  {x:5980,y:350,w:1100,h:250,floorY:600,ceilingY:350,openSide:'left'},
  {x:7440,y:450,w:800,h:210,floorY:660,ceilingY:450,openSide:'right'},
  {x:8500,y:-790,w:980,h:1380,floorY:590,ceilingY:-790,openSide:'left'},
  {x:100,y:500,w:240,h:160,floorY:660,ceilingY:500,openSide:'right',pocket:true},
  {x:9300,y:450,w:240,h:140,floorY:590,ceilingY:450,openSide:'left',pocket:true}
];

export const PLATFORMS = [
  ...FOUNDATION_BLOCKS,
  ...OVERHEAD_BLOCKS,
  ...INTERIOR_BLOCKS,
  ...BRANCH_BLOCKS,
  ...LOWER_BLOCKS,
  ...POCKET_BLOCKS,
  ...WALL_BLOCKS,
  ...ABILITY_GATED_BLOCKS
];

export const TRAPS = [
  {x:1200,y:690,w:90,h:110},
  {x:2270,y:710,w:90,h:90},
  {x:3460,y:700,w:90,h:100},
  {x:4850,y:700,w:100,h:100},
  {x:5790,y:700,w:100,h:100},
  {x:7190,y:700,w:160,h:100},
  {x:8330,y:700,w:70,h:100}
];

export const ENEMY_SPAWNS = [
  {type:'crawler',x:500,y:550,w:30,h:40,patrol:true,patrolRange:90},
  {type:'roller',x:700,y:632,w:46,h:28,patrol:true,patrolRange:55,patrolDirection:-1},
  {type:'hopper',x:1320,y:575,w:34,h:45},
  {type:'brute',x:2170,y:557,w:58,h:63},
  {type:'crawler',x:700,y:410,w:30,h:40,patrol:true,patrolRange:55},
  {type:'roller',x:1050,y:272,w:46,h:28,patrol:true,patrolRange:80,patrolDirection:-1},
  {type:'hopper',x:1950,y:235,w:34,h:45},
  {type:'drone',x:1450,y:300,w:42,h:30},
  {type:'roller',x:2365,y:652,w:46,h:28,patrol:true,patrolRange:45},
  {type:'crawler',x:2920,y:310,w:30,h:40,patrol:true,patrolRange:90},
  {type:'crawler',x:2860,y:910,w:30,h:40,patrol:true,patrolRange:55},
  {type:'brute',x:2600,y:1017,w:58,h:63},
  {type:'drone',x:2850,y:850,w:42,h:30},
  {type:'crawler',x:3570,y:570,w:30,h:40},
  {type:'brute',x:4720,y:547,w:58,h:63},
  {type:'roller',x:4020,y:372,w:46,h:28,patrol:true,patrolRange:90},
  {type:'hopper',x:4690,y:355,w:34,h:45},
  {type:'drone',x:4200,y:200,w:42,h:30},
  {type:'roller',x:4380,y:-258,w:46,h:28,patrol:true,patrolRange:90},
  {type:'roller',x:5000,y:642,w:46,h:28,patrol:true,patrolRange:70},
  {type:'hopper',x:5550,y:625,w:34,h:45},
  {type:'roller',x:5520,y:282,w:46,h:28,patrol:true,patrolRange:90},
  {type:'hopper',x:8460,y:545,w:34,h:45},
  {type:'brute',x:8140,y:597,w:58,h:63},
  {type:'crawler',x:9300,y:200,w:30,h:40,patrol:true,patrolRange:100},
  {type:'hopper',x:8800,y:-515,w:34,h:45},
  {type:'brute',x:9250,y:-383,w:58,h:63},
  {type:'drone',x:9000,y:0,w:42,h:30}
];

export const CONDUITS = [
  {x:330,y:608,w:28,h:52,charge:24,energyPerHit:4},
  {x:3770,y:488,w:28,h:52,charge:24,energyPerHit:4},
  {x:8500,y:538,w:28,h:52,charge:24,energyPerHit:4}
];

export const JUNK_PILES = [
  {x:500,y:544,w:76,h:46,health:5,scrapValue:24},
  {x:740,y:404,w:76,h:46,health:5,scrapValue:26},
  {x:1500,y:94,w:82,h:46,health:5,scrapValue:28},
  {x:2990,y:304,w:84,h:46,health:6,scrapValue:32},
  {x:2630,y:1034,w:88,h:46,health:6,scrapValue:34},
  {x:3820,y:-46,w:86,h:46,health:6,scrapValue:36},
  {x:4500,y:-276,w:90,h:46,health:6,scrapValue:38},
  {x:5600,y:264,w:80,h:46,health:5,scrapValue:28},
  {x:8940,y:54,w:78,h:46,health:5,scrapValue:30},
  {x:9040,y:-696,w:92,h:46,health:7,scrapValue:44},
  {x:9300,y:500,w:120,h:90,health:8,scrapValue:60,minimumDamage:2,gate:true}
];

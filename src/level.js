export const WORLD_WIDTH = 9600;
export const WORLD_TOP = -1000;
export const WORLD_BOTTOM = 800;
export const WORLD_HEIGHT = WORLD_BOTTOM-WORLD_TOP;

export const SPAWN = { x:180, y:624 };

// The lower route is a reversible chain: every upward change is within the
// basic jump and every gap can be crossed in either direction.
export const FOUNDATION_BLOCKS = [
  {x:0,y:660,w:1200,h:140,kind:'foundation'},
  {x:1290,y:620,w:980,h:180,kind:'foundation'},
  {x:2360,y:680,w:1100,h:120,kind:'foundation'},
  {x:3550,y:610,w:1300,h:190,kind:'foundation'},
  {x:4950,y:670,w:840,h:130,kind:'foundation'},
  {x:5890,y:600,w:1300,h:200,kind:'foundation'},
  {x:7350,y:660,w:980,h:140,kind:'foundation'},
  {x:8400,y:590,w:1200,h:210,kind:'foundation'}
];

export const OVERHEAD_BLOCKS = [
  {x:0,y:120,w:1200,h:90,kind:'ceiling'},
  {x:1290,y:-900,w:980,h:100,kind:'ceiling'},
  {x:2360,y:50,w:1100,h:100,kind:'ceiling'},
  {x:3550,y:-900,w:1300,h:100,kind:'ceiling'},
  {x:4950,y:0,w:840,h:100,kind:'ceiling'},
  {x:5890,y:250,w:1300,h:100,kind:'ceiling'},
  {x:7350,y:350,w:980,h:100,kind:'ceiling'},
  {x:8400,y:-900,w:1200,h:110,kind:'ceiling'}
];

// Every interior block sits flush on one foundation, is exactly one basic
// jump high, and leaves at least 80 units of exposed floor around it.
export const INTERIOR_BLOCKS = [
  {x:430,y:590,w:240,h:70,kind:'interior'},
  {x:800,y:590,w:260,h:70,kind:'interior'},
  {x:1380,y:550,w:200,h:70,kind:'interior'},
  {x:1980,y:550,w:180,h:70,kind:'interior'},
  {x:2630,y:610,w:360,h:70,kind:'interior'},
  {x:3120,y:610,w:240,h:70,kind:'interior'},
  {x:3650,y:540,w:470,h:70,kind:'interior'},
  {x:5140,y:600,w:300,h:70,kind:'interior'},
  {x:8660,y:520,w:420,h:70,kind:'interior'}
];

// These are real vertical routes rather than shelves placed directly over the
// lower floor. Consecutive blocks meet at exposed side edges, rise by exactly
// 70 units, and remain reversible with the starting jump.
export const BRANCH_BLOCKS = [
  {x:680,y:450,w:250,h:70,kind:'branch',branch:'west-stack',step:0},
  {x:940,y:310,w:250,h:70,kind:'branch',branch:'west-stack',step:1},

  {x:1590,y:410,w:220,h:70,kind:'branch',branch:'assembly-shaft',step:0},
  {x:1820,y:270,w:220,h:70,kind:'branch',branch:'assembly-shaft',step:1},
  {x:2050,y:130,w:210,h:70,kind:'branch',branch:'assembly-shaft',step:2},
  {x:1810,y:-10,w:230,h:70,kind:'branch',branch:'assembly-shaft',step:3},
  {x:1570,y:-150,w:230,h:70,kind:'branch',branch:'assembly-shaft',step:4},
  {x:1300,y:-290,w:260,h:70,kind:'branch',branch:'assembly-shaft',step:5},
  {x:1570,y:-430,w:240,h:70,kind:'branch',branch:'assembly-shaft',step:6},

  {x:3000,y:470,w:250,h:70,kind:'branch',branch:'lower-vault',step:0},
  {x:3260,y:330,w:190,h:70,kind:'branch',branch:'lower-vault',step:1},
  {x:3000,y:190,w:250,h:70,kind:'branch',branch:'lower-vault',step:2},

  {x:4130,y:400,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:0},
  {x:4380,y:260,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:1},
  {x:4630,y:120,w:210,h:70,kind:'branch',branch:'foundry-shaft',step:2},
  {x:4380,y:-20,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:3},
  {x:4130,y:-160,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:4},
  {x:3880,y:-300,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:5},
  {x:3630,y:-440,w:240,h:70,kind:'branch',branch:'foundry-shaft',step:6},

  {x:5450,y:460,w:270,h:70,kind:'branch',branch:'pre-arena-stack',step:0},
  {x:5170,y:320,w:270,h:70,kind:'branch',branch:'pre-arena-stack',step:1},
  {x:5450,y:180,w:270,h:70,kind:'branch',branch:'pre-arena-stack',step:2},

  {x:9090,y:380,w:200,h:70,kind:'branch',branch:'relay-shaft',step:0},
  {x:8830,y:240,w:250,h:70,kind:'branch',branch:'relay-shaft',step:1},
  {x:8560,y:100,w:260,h:70,kind:'branch',branch:'relay-shaft',step:2},
  {x:8830,y:-40,w:250,h:70,kind:'branch',branch:'relay-shaft',step:3},
  {x:9090,y:-180,w:250,h:70,kind:'branch',branch:'relay-shaft',step:4},
  {x:9350,y:-320,w:240,h:70,kind:'branch',branch:'relay-shaft',step:5},
  {x:9090,y:-460,w:250,h:70,kind:'branch',branch:'relay-shaft',step:6}
];

// Small alcoves exist only at the outer ends of the world, where their back
// walls cannot seal a through-route or strand the player.
export const POCKET_BLOCKS = [
  {x:40,y:430,w:300,h:70,kind:'pocket-ceiling'},
  {x:40,y:500,w:60,h:160,kind:'wall'},
  {x:9300,y:380,w:300,h:70,kind:'pocket-ceiling'},
  {x:9540,y:450,w:60,h:140,kind:'wall'}
];

// Three small optional caches are the only spaces outside the starting jump.
// They never interrupt or gate the main traversal route.
export const ABILITY_GATED_BLOCKS = [
  {x:1820,y:-650,w:260,h:70,kind:'cache',requires:'doubleJump'},
  {x:3880,y:-660,w:280,h:70,kind:'cache',requires:'doubleJump'},
  {x:8800,y:-680,w:280,h:70,kind:'cache',requires:'doubleJump'}
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
  {x:110,y:210,w:980,h:450,floorY:660,ceilingY:210,openSide:'right'},
  {x:1340,y:-800,w:780,h:1420,floorY:620,ceilingY:-800,openSide:'left'},
  {x:2460,y:150,w:850,h:530,floorY:680,ceilingY:150,openSide:'right'},
  {x:3650,y:-800,w:1040,h:1410,floorY:610,ceilingY:-800,openSide:'left'},
  {x:5030,y:100,w:690,h:570,floorY:670,ceilingY:100,openSide:'right'},
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
  ...POCKET_BLOCKS,
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
  {type:'brute',x:1830,y:557,w:58,h:63},
  {type:'drone',x:1450,y:450,w:42,h:30},
  {type:'roller',x:2500,y:652,w:46,h:28,patrol:true,patrolRange:90},
  {type:'crawler',x:3060,y:640,w:30,h:40,patrol:true,patrolRange:30,patrolDirection:-1},
  {type:'crawler',x:3570,y:570,w:30,h:40},
  {type:'brute',x:4460,y:547,w:58,h:63},
  {type:'drone',x:4200,y:350,w:42,h:30},
  {type:'roller',x:5000,y:642,w:46,h:28,patrol:true,patrolRange:70},
  {type:'hopper',x:5550,y:625,w:34,h:45},
  {type:'hopper',x:8460,y:545,w:34,h:45},
  {type:'brute',x:8140,y:597,w:58,h:63},
  {type:'drone',x:9150,y:330,w:42,h:30}
];

export const CONDUITS = [
  {x:330,y:608,w:28,h:52,charge:24,energyPerHit:4},
  {x:3990,y:488,w:28,h:52,charge:24,energyPerHit:4},
  {x:8500,y:538,w:28,h:52,charge:24,energyPerHit:4}
];

export const JUNK_PILES = [
  {x:500,y:544,w:76,h:46,health:5,scrapValue:24},
  {x:1650,y:-476,w:82,h:46,health:5,scrapValue:26},
  {x:2720,y:564,w:84,h:46,health:6,scrapValue:32},
  {x:3270,y:564,w:76,h:46,health:5,scrapValue:26},
  {x:3720,y:-486,w:86,h:46,health:6,scrapValue:34},
  {x:5200,y:554,w:80,h:46,health:5,scrapValue:28},
  {x:8620,y:54,w:90,h:46,health:6,scrapValue:38},
  {x:9170,y:-506,w:88,h:46,health:6,scrapValue:36},
  {x:9430,y:-366,w:78,h:46,health:5,scrapValue:28},
  {x:9300,y:500,w:120,h:90,health:8,scrapValue:60,minimumDamage:2,gate:true}
];

# gcode-toolpath

### Tool path extraction

- When given below input gcode
```
    N1 G17 G20 G90 G94 G54
    N2 G0 Z0.25
    N3 X-0.5 Y0.
    N4 Z0.1
    N5 G01 Z0. F5.
    N6 G02 X0. Y0.5 I0.5 J0. F2.5
    N7 X0.5 Y0. I0. J-0.5
    N8 X0. Y-0.5 I-0.5 J0.
    N9 X-0.5 Y0. I0. J0.5
    N10 G01 Z0.1 F5.
    N11 G00 X0. Y0. Z0.25
```
- Response with JSON vector seed data
```json
[
  {
    "block": "N1",
    "nc": [ "G17", "G20", "G90", "G94", "G54" ]
  },
  {
    "block": "N2",
    "nc": [ "G0" ],
    "point": { "Z": 0.25 }
  },
  {
    "block": "N3",
    "nc": [ "G0" ],
    "point": { "X": -0.5, "Y": 0 }
  },
  {
    "block": "N4",
    "nc": [ "G0" ],
    "point": { "Z": 0.1 }
  },
  {
    "block": "N5",
    "nc": [ "G1" ],
    "point": { "Z": 0 }
  },
  {
    "block": "N6",
    "nc": [ "G2" ],
    "point": { "X": 0, "Y": 0.5, "I": 0.5, "J": 0 }
  },
  {
    "block": "N7",
    "nc": [ "G2" ],
    "point": { "X": 0.5, "Y": 0, "I": 0, "J": -0.5 }
  },
  {
    "block": "N8",
    "nc": [ "G2" ],
    "point": { "X": 0, "Y": -0.5, "I": -0.5, "J": 0 }
  },
  {
    "block": "N9",
    "nc": [ "G2" ],
    "point": { "X": -0.5, "Y": 0, "I": 0, "J": 0.5 }
  },
  {
    "block": "N10",
    "nc": [ "G1" ],
    "point": { "Z": 0.1 }
  },
  {
    "block": "N11",
    "nc": [ "G0" ],
    "point": { "X": 0, "Y": 0, "Z": 0.25 }
  }
]
```


### parser

### interpreter

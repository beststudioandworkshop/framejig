// Published geometry charts, typed in by hand from the maker's own tables.
// Millimeters and degrees. A chart that arrived without a model name has
// `model: null` until the user says which bike it is. Nothing in the tool reads
// these yet except the tests that check the geometry maths against them.

export interface ReferenceChart {
  id: string
  maker: string
  /** Null when the chart was sent without a name. */
  model: string | null
  /** Where the user wants it filed. Null until they say. */
  category: string | null
  /** Notes from the chart itself, or about how it was typed in. */
  notes: string[]
  sizes: string[]
  /** One value per size, or a single value when it is the same for every size. */
  rows: Partial<Record<ChartRow, number | number[]>>
}

export type ChartRow =
  | "seatTubeCT"
  | "seatTubeCC"
  | "frontCenter"
  | "topTubeCC"
  | "effectiveTopTube"
  | "headTubeAngle"
  | "seatTubeAngle"
  | "bbDrop"
  | "bbHeight"
  | "chainstay"
  | "forkAxleToCrown"
  | "forkOffset"
  | "wheelbase"
  | "standover"
  | "headTubeLength"
  | "stack"
  | "reach"
  | "trail"
  | "crankLength"

const IN = 25.4
const inch = (values: number[]) => values.map((v) => Math.round(v * IN * 10) / 10)
const inchOne = (v: number) => Math.round(v * IN * 10) / 10

export const REFERENCE_CHARTS: ReferenceChart[] = [
  {
    id: "surly-steamroller",
    maker: "Surly",
    model: "Steamroller (Anxious Lavender)",
    category: "track",
    notes: ["", "BB height 271 mm, so the axles sit 341 mm off the ground."],
    sizes: ["49", "53", "56", "59", "62"],
    rows: {
      effectiveTopTube: [529.5, 547, 568, 587, 608],
      standover: [748.5, 780.5, 807.9, 835.2, 865.3],
      reach: [388.1, 394, 402.3, 408.2, 420.6],
      stack: [504.9, 531.3, 558.8, 586.4, 618.1],
      seatTubeCT: [490, 530, 560, 590, 620],
      headTubeLength: [83, 109, 136, 163, 196],
      headTubeAngle: [72.5, 73, 73.5, 74, 74],
      seatTubeAngle: [74.5, 74, 73.5, 73, 73],
      bbDrop: 70,
      bbHeight: 271,
      chainstay: 398,
      forkAxleToCrown: 375,
      forkOffset: 38,
      wheelbase: [956.8, 966.5, 978.6, 987.5, 1009.1],
    },
  },
  {
    id: "surly-pugsley",
    maker: "Surly",
    model: "Pugsley",
    category: null,
    notes: ["Sent in inches; converted here. Sizes 14 to 22 inch (xS to xL)."],
    sizes: ["xS (14)", "S (16)", "M (18)", "L (20)", "xL (22)"],
    rows: {
      seatTubeCT: inch([14, 16, 18, 20, 22]),
      topTubeCC: inch([21.5, 21.8, 22.3, 22.9, 23.6]),
      effectiveTopTube: inch([22.0, 22.9, 23.4, 24.0, 24.6]),
      headTubeAngle: [70, 70.5, 70.5, 70.5, 70.5],
      seatTubeAngle: [73, 72, 72, 72, 72],
      bbDrop: inchOne(2.2),
      chainstay: inchOne(17.6),
      wheelbase: inch([41.8, 42.0, 42.6, 43.2, 43.8]),
      standover: inch([28.9, 29.9, 31.0, 32.3, 33.6]),
      headTubeLength: inch([3.7, 4.0, 4.4, 5.1, 5.9]),
      forkAxleToCrown: inchOne(17.6),
      forkOffset: inchOne(1.7),
      stack: inch([22.0, 22.3, 22.7, 23.4, 24.1]),
      reach: inch([15.3, 15.6, 16.0, 16.4, 16.7]),
    },
  },
  {
    id: "surly-krampus",
    maker: "Surly",
    model: "Krampus",
    category: null,
    notes: ["Marked preliminary on the chart: dimensions subject to change.", "Handlebar 720 to 780, stem 70 mm at 7 degrees."],
    sizes: ["SM", "MD", "LG"],
    rows: {
      bbDrop: 65,
      chainstay: 435,
      forkAxleToCrown: 483,
      forkOffset: 47,
      headTubeAngle: 69,
      headTubeLength: [90, 100, 110],
      reach: [404, 426, 448],
      seatTubeAngle: 73,
      seatTubeCT: [328, 379, 430],
      stack: [593, 602, 612],
      standover: [770, 797, 825],
      effectiveTopTube: [585, 610, 635],
      wheelbase: [1086.8, 1112.6, 1138.3],
      crankLength: [170, 175, 175],
    },
  },
  {
    id: "surly-ogre",
    maker: "Surly",
    model: "Ogre",
    category: null,
    notes: [],
    sizes: ["SM", "MD", "LG", "XL"],
    rows: {
      seatTubeCT: [406.4, 457.2, 508, 558],
      topTubeCC: [545.6, 560.7, 580.2, 607],
      effectiveTopTube: [575, 595, 615, 640],
      headTubeAngle: [71.5, 72, 72, 72],
      seatTubeAngle: 73,
      bbDrop: 68,
      chainstay: 440,
      wheelbase: [1049.4, 1064.5, 1084.6, 1110],
      standover: [763.5, 795.7, 824.5, 857.85],
      headTubeLength: [110, 120, 130, 150],
      forkAxleToCrown: 447,
      forkOffset: 43,
      stack: [592, 603.4, 613, 632],
      reach: [395.5, 410.5, 427.6, 447],
    },
  },
  {
    id: "surly-karate-monkey",
    maker: "Surly",
    model: "Karate Monkey",
    category: null,
    notes: ["Standover is measured from the top of the top tube, at the center, with a tire about 749 mm across."],
    sizes: ["XS", "SM", "MD", "LG", "XL"],
    rows: {
      seatTubeCT: [330, 368, 419, 470, 521],
      topTubeCC: [557, 568, 582, 604, 630],
      effectiveTopTube: [560, 585, 610, 635, 660],
      headTubeAngle: 69,
      seatTubeAngle: 73,
      bbDrop: 55,
      chainstay: 423,
      wheelbase: [1053, 1078, 1103, 1129, 1155],
      standover: [743, 761, 783, 811, 840],
      headTubeLength: [100, 100, 100, 110, 120],
      forkAxleToCrown: 483,
      forkOffset: 47,
      stack: [597, 597, 597, 606, 615],
      reach: [377, 402, 427, 450, 472],
    },
  },
  {
    id: "salsa-timberjack",
    maker: "Salsa (assumed from the chart's style)",
    model: "Timberjack",
    category: null,
    notes: [
      "Marked preliminary on the chart: dimensions subject to change.",
      "Chainstay is a range, 420 to 437 mm, so the middle (428.5) is typed in; the wheelbase ranges are typed in as their middles too.",
    ],
    sizes: ["XS", "SM", "MD", "LG", "XL"],
    rows: {
      bbDrop: 63,
      chainstay: 428.5,
      forkAxleToCrown: 482,
      forkOffset: 42,
      headTubeAngle: 68.7,
      headTubeLength: [100, 100, 110, 120, 135],
      reach: [401, 421, 438, 465, 491],
      seatTubeAngle: 74.3,
      seatTubeCT: [355.6, 381, 431.8, 482.6, 533.4],
      stack: [594, 594, 603, 612, 625],
      standover: [670, 687, 727, 765, 802],
      effectiveTopTube: [568, 588, 608, 638, 668],
      wheelbase: [1076.5, 1096.25, 1117.25, 1148.5, 1180],
    },
  },
  {
    id: "surly-cross-check",
    maker: "Surly",
    model: "Cross-Check",
    category: null,
    notes: ["Seat tube length is center-to-center (corrected by the user; first said center-to-top).", "Stem 70 to 120 mm at 7 degrees, bars 400 to 460 mm."],
    sizes: ["42", "46", "50", "52", "54", "56", "58", "60", "62", "64"],
    rows: {
      reach: [378.7, 380.8, 389.1, 389.7, 394.8, 394.3, 398.3, 407.3, 411, 424.5],
      stack: [528, 528, 528, 528, 538.4, 556.5, 575.7, 593.6, 612.7, 630.9],
      headTubeAngle: 72,
      headTubeLength: [91, 91, 91, 91, 102, 121, 141, 160, 180, 200],
      seatTubeCC: [420, 460, 500, 520, 540, 560, 580, 600, 620, 665],
      bbDrop: 66,
      wheelbase: [989.8, 991.9, 1005.2, 1005.9, 1014.3, 1019.7, 1029.9, 1044.7, 1054.7, 1074.6],
      chainstay: [420, 420, 425, 425, 425, 425, 425, 425, 425, 425],
      topTubeCC: [505, 515, 535.1, 545.1, 559.9, 569.9, 579.8, 599.8, 609.9, 630],
      effectiveTopTube: [522, 528.8, 541.8, 547.1, 560, 570, 580, 600, 610, 630],
      seatTubeAngle: [75, 74.5, 74, 73.5, 73, 72.5, 72.5, 72, 72, 72],
      standover: [747.9, 766.7, 784.4, 794.4, 809, 826.7, 845.9, 863.4, 882.2, 901.8],
      crankLength: [170, 170, 170, 170, 175, 175, 175, 175, 175, 175],
      forkAxleToCrown: 400,
      forkOffset: 44,
    },
  },
  {
    id: "surly-disc-trucker-26",
    maker: "Surly",
    model: "Disc Trucker (26-inch wheels)",
    category: null,
    notes: ["Sizes 42 to 56 come with 26-inch wheels, 56 to 64 with 700c; the two are separate charts here.", "No fork length given.", "Seat tube length is center-to-top (confirmed).", "The Long Haul Trucker has the same geometry; only the brake type differs."],
    sizes: ["42", "46", "50", "52", "54", "56"],
    rows: {
      effectiveTopTube: [500, 515, 530, 545, 560, 575],
      chainstay: 450,
      bbDrop: 50,
      headTubeLength: [125, 130, 170, 185, 205, 225],
      headTubeAngle: [70, 70, 71, 71, 71, 71],
      seatTubeCT: [420, 460, 500, 520, 540, 560],
      seatTubeAngle: [75, 74.5, 74, 73.5, 73, 73],
      forkOffset: 45,
      reach: [362, 371, 369, 374.5, 378, 387.5],
      stack: [515, 520, 561, 575.5, 594.5, 613],
      wheelbase: [1026, 1037, 1040, 1050, 1060.5, 1076],
      standover: [710, 731, 766, 782, 800, 819.5],
    },
  },
  {
    id: "surly-disc-trucker-700c",
    maker: "Surly",
    model: "Disc Trucker (700c wheels)",
    category: null,
    notes: ["Sizes 56 to 64 come with 700c wheels.", "No fork length given.", "Seat tube length is center-to-top (confirmed).", "The Long Haul Trucker has the same geometry; only the brake type differs."],
    sizes: ["56", "58", "60", "62", "64"],
    rows: {
      effectiveTopTube: [575, 590, 605, 620, 635],
      chainstay: 450,
      bbDrop: 80,
      headTubeLength: [175, 195, 215, 235, 250],
      headTubeAngle: 72,
      seatTubeCT: [560, 580, 600, 620, 640],
      seatTubeAngle: [73, 72.5, 72.5, 72, 72],
      forkOffset: 45,
      reach: [387.5, 391, 400, 402, 412.5],
      stack: [613, 632, 651.5, 670.5, 685],
      wheelbase: [1051, 1060, 1075.5, 1084, 1090],
      standover: [813, 832, 851, 869, 885.5],
    },
  },
  {
    id: "specialized-stumpjumper-1996",
    maker: "Specialized",
    model: "Stumpjumper (1996), 17 inch",
    category: null,
    notes: [
      "One size only. A reference for the retro mountain bike style.",
      "Seat tube is center-to-center. Top tube is the actual, center-to-center length.",
      "26-inch wheels; the tire size is not given. Stem 130 mm, seatpost 30.9 mm.",
      "No stack, reach, effective top tube, chainstay or BB drop given. Rear center works out to 1052.7 - 625.9 = 426.8 mm.",
    ],
    sizes: ['17"'],
    rows: {
      topTubeCC: 550.5,
      seatTubeCC: 430,
      headTubeAngle: 71,
      seatTubeAngle: 73,
      headTubeLength: 110,
      wheelbase: 1052.7,
      frontCenter: 625.9,
      standover: 761.4,
      bbHeight: 290,
      forkOffset: 42,
      forkAxleToCrown: 405,
    },
  },
  {
    id: "crust-scapegoat",
    maker: "Crust",
    model: "Scapegoat",
    category: null,
    notes: ["Sloping top tube, 16 to 12 degrees by size. No fork length given.", "BB height 310 mm and drop 58 mm, so the axles sit 368 mm off the ground."],
    sizes: ["S", "M", "L", "XL"],
    rows: {
      effectiveTopTube: [560, 590, 620, 650],
      topTubeCC: [533, 562, 591, 621],
      seatTubeCT: [430, 470, 520, 560],
      headTubeAngle: 71,
      seatTubeAngle: 72,
      headTubeLength: [110, 143, 188, 220],
      stack: [563, 594, 637, 667],
      reach: [376, 396, 412, 433],
      chainstay: 451,
      bbHeight: 310,
      bbDrop: 58,
      standover: [745, 778, 822, 857],
      forkOffset: 48,
      trail: 77,
      wheelbase: [1048, 1079, 1110, 1140],
    },
  },
]

/** The value of one row for one size index. */
export function chartValue(chart: ReferenceChart, row: ChartRow, sizeIndex: number): number | undefined {
  const v = chart.rows[row]
  return Array.isArray(v) ? v[sizeIndex] : v
}

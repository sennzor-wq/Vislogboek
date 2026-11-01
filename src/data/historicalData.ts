import { FishingLocation, FishingSession, CatchItem } from '../types';

/**
 * Historische data geïmporteerd uit vislogboek-backup-2026-10-26_50803f8b.json
 * - 5 stekken / locaties
 * - 10 sessies (normale gebruikerssessies, isBenchmark: false)
 * - 16 vangsten (alle gewichten behouden als null, nooit 0 kg)
 * - Bevat de 26 sept sessie zonder spot_id
 * - Bevat de twee afzonderlijke 15 sept sessies
 * - 3 nulvangstsessies correct gemarkeerd als 'skunk_confirmed'
 */

export const HISTORICAL_LOCATIONS: FishingLocation[] = [
  {
    "id": "spot-mvp1dxvd-rd877l",
    "name": "Lokkershoek speelplek",
    "latitude": 51.943588,
    "longitude": 5.191197,
    "waterDepth": 2,
    "notes": "Bodem: Zand | Voorkeurstechniek: Feeder",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:10:46.969Z",
    "updatedAt": "2026-10-26T09:12:06.091Z"
  },
  {
    "id": "spot-mvp1g19d-dfemr2",
    "name": "Lokkershoek Pier",
    "latitude": 51.944861,
    "longitude": 5.19234,
    "waterDepth": 2,
    "notes": "Bodem: Zand | Voorkeurstechniek: Feeder",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:12:24.674Z",
    "updatedAt": "2026-10-26T09:12:56.130Z"
  },
  {
    "id": "spot-mvp1liml-qzjqsp",
    "name": "Kanaal schapen #1",
    "latitude": 51.948939,
    "longitude": 5.189031,
    "notes": "Bodem: Modder met bedekken gras",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:16:40.461Z",
    "updatedAt": "2026-10-26T09:17:49.556Z"
  },
  {
    "id": "spot-mvp1navc-s34eqc",
    "name": "Vijver achter Kanaal schapen #1",
    "latitude": 51.948647,
    "longitude": 5.189778,
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:18:03.720Z",
    "updatedAt": "2026-10-26T09:18:35.252Z"
  },
  {
    "id": "spot-mvp2zd2i-a0dxhk",
    "name": "Bomedikke speeltuin",
    "latitude": 51.954158,
    "longitude": 5.22951,
    "waterDepth": 2,
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:55:26.058Z",
    "updatedAt": "2026-10-26T09:55:58.758Z"
  }
];

export const HISTORICAL_SESSIONS: FishingSession[] = [
  {
    "id": "session-mvp17b3r-s8s5ij",
    "locationName": "Lokkershoek speelplek",
    "startTime": "2026-09-26T12:00:00",
    "endTime": "2026-09-26T17:00:00",
    "durationMinutes": 300,
    "outcome": "catch",
    "targetSpecies": [
      "Brasem",
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 8,
    "baitAndFeed": "Aas: Pellets | Voer: Wafter",
    "notes": "4 feeder hengels 2 karper hengels — Steklocatie: Lokkershoek speelplek",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:05:37.527Z",
    "updatedAt": "2026-10-26T09:13:32.191Z"
  },
  {
    "id": "session-mvp1iq4l-ymoh0z",
    "locationId": "spot-mvp1dxvd-rd877l",
    "locationName": "Lokkershoek speelplek",
    "startTime": "2026-08-25T19:00:00",
    "endTime": "2026-08-25T22:30:00",
    "durationMinutes": 210,
    "outcome": "catch",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 6,
    "baitAndFeed": "Aas: Pallets | Voer: Wafter",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:14:30.213Z",
    "updatedAt": "2026-10-26T09:16:00.825Z"
  },
  {
    "id": "session-mvp2anzw-bzvu1m",
    "locationId": "spot-mvp1liml-qzjqsp",
    "locationName": "Kanaal schapen #1",
    "startTime": "2026-09-12T19:00:00",
    "endTime": "2026-09-12T22:00:00",
    "durationMinutes": 180,
    "outcome": "catch",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 6,
    "baitAndFeed": "Aas: Pallets | Voer: Wafters",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:36:13.820Z",
    "updatedAt": "2026-10-26T09:38:03.678Z"
  },
  {
    "id": "session-mvp2etyr-ba73ao",
    "locationId": "spot-mvp1liml-qzjqsp",
    "locationName": "Kanaal schapen #1",
    "startTime": "2026-09-15T16:30:00",
    "endTime": "2026-09-15T22:30:00",
    "durationMinutes": 360,
    "outcome": "catch",
    "targetSpecies": [
      "Brasem",
      "Zeelt"
    ],
    "technique": "Karper hengel",
    "rodCount": 2,
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:39:28.179Z",
    "updatedAt": "2026-10-26T09:48:39.325Z"
  },
  {
    "id": "session-mvp2jenl-d1h9ib",
    "locationId": "spot-mvp1navc-s34eqc",
    "locationName": "Vijver achter Kanaal schapen #1",
    "startTime": "2026-09-15T16:30:00",
    "endTime": "2026-09-15T22:30:00",
    "durationMinutes": 360,
    "outcome": "catch",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 2,
    "baitAndFeed": "Aas: Pallets | Voer: Wafter",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:43:01.617Z",
    "updatedAt": "2026-10-26T09:48:44.806Z"
  },
  {
    "id": "session-mvp2rr5h-nfp14w",
    "locationId": "spot-mvp1navc-s34eqc",
    "locationName": "Vijver achter Kanaal schapen #1",
    "startTime": "2026-09-18T13:30:00",
    "endTime": "2026-09-18T22:00:00",
    "durationMinutes": 510,
    "outcome": "catch",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 4,
    "baitAndFeed": "Aas: Pallets | Voer: Wafter bollies",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:49:31.061Z",
    "updatedAt": "2026-10-26T09:51:20.598Z"
  },
  {
    "id": "session-mvp2u5mq-r5xcpl",
    "locationId": "spot-mvp1liml-qzjqsp",
    "locationName": "Kanaal schapen #1",
    "startTime": "2026-09-19T13:00:00",
    "endTime": "2026-09-19T17:00:00",
    "durationMinutes": 240,
    "outcome": "catch",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder",
    "rodCount": 6,
    "baitAndFeed": "Aas: Pallets wafter bolies",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:51:23.138Z",
    "updatedAt": "2026-10-26T09:53:25.804Z"
  },
  {
    "id": "session-mvp3043y-36ftj3",
    "locationId": "spot-mvp2zd2i-a0dxhk",
    "locationName": "Bomedikke speeltuin",
    "startTime": "2026-10-24T13:00:00",
    "endTime": "2026-10-24T17:00:00",
    "durationMinutes": 240,
    "outcome": "skunk_confirmed",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder en karper",
    "rodCount": 8,
    "baitAndFeed": "Aas: Pallets | Voer: Wafters",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:56:01.102Z",
    "updatedAt": "2026-10-26T09:56:34.437Z"
  },
  {
    "id": "session-mvp31qnz-zhqq0b",
    "locationId": "spot-mvp1g19d-dfemr2",
    "locationName": "Lokkershoek Pier",
    "startTime": "2026-10-22T19:00:00",
    "endTime": "2026-10-22T21:00:00",
    "durationMinutes": 120,
    "outcome": "skunk_confirmed",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feeder en karper",
    "rodCount": 6,
    "baitAndFeed": "Aas: Pallets | Voer: Bollies",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:57:16.991Z",
    "updatedAt": "2026-10-26T09:57:54.214Z"
  },
  {
    "id": "session-mvp32tvq-jvqktp",
    "locationId": "spot-mvp1dxvd-rd877l",
    "locationName": "Lokkershoek speelplek",
    "startTime": "2026-10-18T13:00:00",
    "endTime": "2026-10-18T16:30:00",
    "durationMinutes": 210,
    "outcome": "skunk_confirmed",
    "targetSpecies": [
      "Karper"
    ],
    "technique": "Feede  en karper",
    "rodCount": 6,
    "baitAndFeed": "Aas: Pallets | Voer: Wafter bollies",
    "isBenchmark": false,
    "createdAt": "2026-10-26T09:58:07.814Z",
    "updatedAt": "2026-10-26T09:59:22.170Z"
  }
];

export const HISTORICAL_CATCHES: CatchItem[] = [
  {
    "id": "catch-mvp19s93-u577z1",
    "sessionId": "session-mvp17b3r-s8s5ij",
    "species": "Brasem",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-26T14:00:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Bert",
    "createdAt": "2026-10-26T09:05:37.527Z"
  },
  {
    "id": "catch-mvp1avq5-khjf8a",
    "sessionId": "session-mvp17b3r-s8s5ij",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-26T14:35:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Bert",
    "createdAt": "2026-10-26T09:05:37.527Z"
  },
  {
    "id": "catch-mvp1julb-kko5y1",
    "sessionId": "session-mvp1iq4l-ymoh0z",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-08-25T21:15:00",
    "bait": "Pallets",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Edwin graskarper ",
    "createdAt": "2026-10-26T09:14:30.213Z"
  },
  {
    "id": "catch-mvp2bprv-behngp",
    "sessionId": "session-mvp2anzw-bzvu1m",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-12T21:15:00",
    "bait": "Pallets",
    "technique": "Feeder",
    "rod": "Wafter",
    "createdAt": "2026-10-26T09:36:13.820Z"
  },
  {
    "id": "catch-mvp2c445-ysbvvn",
    "sessionId": "session-mvp2anzw-bzvu1m",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-12T21:47:00",
    "bait": "Pallets",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Tibor",
    "createdAt": "2026-10-26T09:36:13.820Z"
  },
  {
    "id": "catch-mvp2kkqh-xhsibb",
    "sessionId": "session-mvp2etyr-ba73ao",
    "species": "Brasem",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T17:08:00",
    "bait": "pallets",
    "technique": "Karper hengel",
    "rod": "Karler",
    "notes": "Edwin",
    "createdAt": "2026-10-26T09:39:28.179Z"
  },
  {
    "id": "catch-mvp2mn5z-mucs95",
    "sessionId": "session-mvp2etyr-ba73ao",
    "species": "Zeelt",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T19:50:00",
    "bait": "Pallets",
    "technique": "Karper hengel",
    "rod": "Feeder",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:39:28.179Z"
  },
  {
    "id": "catch-mvp2ofbk-zh5o9y",
    "sessionId": "session-mvp2etyr-ba73ao",
    "species": "Brasem",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T20:00:00",
    "bait": "Pallets ",
    "technique": "Karper hengel",
    "rod": "Feeder ",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:39:28.179Z"
  },
  {
    "id": "catch-mvp2q3kg-d6v1p2",
    "sessionId": "session-mvp2etyr-ba73ao",
    "species": "Brasem",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T20:45:00",
    "bait": "Pallets",
    "technique": "Karper hengel",
    "rod": "Feeder",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:39:28.179Z"
  },
  {
    "id": "catch-mvp2lgbo-kcqx8r",
    "sessionId": "session-mvp2jenl-d1h9ib",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T18:32:00",
    "bait": "Pallets",
    "technique": "Feeder",
    "rod": "Feede ",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:43:01.617Z"
  },
  {
    "id": "catch-mvp2nq46-yhs116",
    "sessionId": "session-mvp2jenl-d1h9ib",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T20:00:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:43:01.617Z"
  },
  {
    "id": "catch-mvp2pbyj-tobsvr",
    "sessionId": "session-mvp2jenl-d1h9ib",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-15T20:37:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:43:01.617Z"
  },
  {
    "id": "catch-mvp2sp5j-i54ub7",
    "sessionId": "session-mvp2rr5h-nfp14w",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-18T14:51:00",
    "bait": "Pallets",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:49:31.061Z"
  },
  {
    "id": "catch-mvp2t7qi-zln4oy",
    "sessionId": "session-mvp2rr5h-nfp14w",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-18T20:31:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder ",
    "notes": "Ricardo ",
    "createdAt": "2026-10-26T09:49:31.061Z"
  },
  {
    "id": "catch-mvp2v1mm-2wy3cd",
    "sessionId": "session-mvp2u5mq-r5xcpl",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-19T15:06:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Tibor",
    "createdAt": "2026-10-26T09:51:23.138Z"
  },
  {
    "id": "catch-mvp2vif5-ga2qvr",
    "sessionId": "session-mvp2u5mq-r5xcpl",
    "species": "Karper",
    "count": 1,
    "weightKg": null,
    "lengthCm": null,
    "timestamp": "2026-09-19T15:39:00",
    "bait": "Pallets ",
    "technique": "Feeder",
    "rod": "Feeder",
    "notes": "Tibor",
    "createdAt": "2026-10-26T09:51:23.138Z"
  }
];

export type Pulsar = {
  id: string;
  name: string;
  f0_hz: number;
  period_ms: number;
  difficulty: "easy" | "medium" | "hard";
  fold_png_url?: string;
};

// NOTE:
// - This list contains ONLY real pulsar-style designations (no "DEMO", no synthetic IDs).
// - f0_hz and period_ms are kept approximately consistent (f0 ≈ 1000 / period_ms).
// - difficulty is for gameplay tuning, not scientific classification.

export const PULSARS: Pulsar[] = [
  // --- Your existing set (unchanged) ---
  { id: "J0030+0451", name: "PSR J0030+0451", f0_hz: 205.6, period_ms: 4.86, difficulty: "easy" },
  { id: "J0108-1431", name: "PSR J0108−1431", f0_hz: 1.24, period_ms: 806.5, difficulty: "medium" },
  { id: "J0218+4232", name: "PSR J0218+4232", f0_hz: 430.2, period_ms: 2.32, difficulty: "hard" },
  { id: "J0340+4130", name: "PSR J0340+4130", f0_hz: 116.3, period_ms: 8.60, difficulty: "medium" },
  { id: "J0437-4715", name: "PSR J0437−4715", f0_hz: 173.7, period_ms: 5.76, difficulty: "easy" },
  { id: "J0534+2200", name: "PSR J0534+2200", f0_hz: 29.7, period_ms: 33.7, difficulty: "easy" },
  { id: "J0613-0200", name: "PSR J0613−0200", f0_hz: 326.6, period_ms: 3.06, difficulty: "medium" },
  { id: "J0636+5128", name: "PSR J0636+5128", f0_hz: 348.6, period_ms: 2.87, difficulty: "hard" },
  { id: "J0740+6620", name: "PSR J0740+6620", f0_hz: 346.5, period_ms: 2.89, difficulty: "medium" },
  { id: "J0751+1807", name: "PSR J0751+1807", f0_hz: 287.4, period_ms: 3.48, difficulty: "medium" },
  { id: "J0952-0607", name: "PSR J0952−0607", f0_hz: 707.0, period_ms: 1.41, difficulty: "hard" },
  { id: "J1012+5307", name: "PSR J1012+5307", f0_hz: 190.3, period_ms: 5.25, difficulty: "easy" },
  { id: "J1023+0038", name: "PSR J1023+0038", f0_hz: 592.4, period_ms: 1.69, difficulty: "hard" },
  { id: "J1048+2339", name: "PSR J1048+2339", f0_hz: 214.7, period_ms: 4.66, difficulty: "medium" },
  { id: "J1124-3653", name: "PSR J1124−3653", f0_hz: 167.1, period_ms: 5.98, difficulty: "easy" },
  { id: "J1216-6410", name: "PSR J1216−6410", f0_hz: 73.4, period_ms: 13.62, difficulty: "medium" },
  { id: "J1227-4853", name: "PSR J1227−4853", f0_hz: 592.0, period_ms: 1.69, difficulty: "hard" },
  { id: "J1300+1240", name: "PSR J1300+1240", f0_hz: 160.8, period_ms: 6.22, difficulty: "easy" },
  { id: "J1311-3430", name: "PSR J1311−3430", f0_hz: 390.6, period_ms: 2.56, difficulty: "hard" },
  { id: "J1327-0755", name: "PSR J1327−0755", f0_hz: 202.0, period_ms: 4.95, difficulty: "medium" },
  { id: "J1417-4402", name: "PSR J1417−4402", f0_hz: 226.7, period_ms: 4.41, difficulty: "medium" },
  { id: "J1431-4715", name: "PSR J1431−4715", f0_hz: 276.9, period_ms: 3.61, difficulty: "hard" },
  { id: "J1455-3330", name: "PSR J1455−3330", f0_hz: 125.3, period_ms: 7.98, difficulty: "easy" },
  { id: "J1518+4904", name: "PSR J1518+4904", f0_hz: 23.3, period_ms: 42.9, difficulty: "medium" },
  { id: "J1537+1155", name: "PSR J1537+1155", f0_hz: 26.4, period_ms: 37.9, difficulty: "medium" },
  { id: "J1600-3053", name: "PSR J1600−3053", f0_hz: 277.9, period_ms: 3.60, difficulty: "easy" },
  { id: "J1614-2230", name: "PSR J1614−2230", f0_hz: 317.3, period_ms: 3.15, difficulty: "medium" },
  { id: "J1652-4838", name: "PSR J1652−4838", f0_hz: 51.2, period_ms: 19.53, difficulty: "hard" },
  { id: "J1713+0747", name: "PSR J1713+0747", f0_hz: 218.8, period_ms: 4.57, difficulty: "easy" },
  { id: "J1723-2837", name: "PSR J1723−2837", f0_hz: 285.0, period_ms: 3.51, difficulty: "medium" },
  { id: "J1738+0333", name: "PSR J1738+0333", f0_hz: 170.0, period_ms: 5.88, difficulty: "easy" },
  { id: "J1740-5340", name: "PSR J1740−5340", f0_hz: 274.0, period_ms: 3.65, difficulty: "medium" },
  { id: "J1748-2446ad", name: "PSR J1748−2446ad", f0_hz: 716.4, period_ms: 1.40, difficulty: "hard" },
  { id: "J1751-2857", name: "PSR J1751−2857", f0_hz: 358.1, period_ms: 2.79, difficulty: "hard" },
  { id: "J1802-2124", name: "PSR J1802−2124", f0_hz: 79.5, period_ms: 12.58, difficulty: "medium" },
  { id: "J1811-1736", name: "PSR J1811−1736", f0_hz: 44.0, period_ms: 22.73, difficulty: "medium" },
  { id: "J1824-2452A", name: "PSR J1824−2452A", f0_hz: 327.4, period_ms: 3.05, difficulty: "hard" },
  { id: "J1832-0836", name: "PSR J1832−0836", f0_hz: 178.1, period_ms: 5.61, difficulty: "easy" },
  { id: "J1843-1113", name: "PSR J1843−1113", f0_hz: 541.6, period_ms: 1.85, difficulty: "hard" },
  { id: "J1903+0327", name: "PSR J1903+0327", f0_hz: 465.0, period_ms: 2.15, difficulty: "hard" },
  { id: "J1909-3744", name: "PSR J1909−3744", f0_hz: 339.3, period_ms: 2.95, difficulty: "easy" },
  { id: "J1910+1256", name: "PSR J1910+1256", f0_hz: 200.0, period_ms: 5.00, difficulty: "medium" },
  { id: "J1911-5958A", name: "PSR J1911−5958A", f0_hz: 203.0, period_ms: 4.93, difficulty: "medium" },
  { id: "J1918-0642", name: "PSR J1918−0642", f0_hz: 131.9, period_ms: 7.58, difficulty: "easy" },
  { id: "J1939+2134", name: "PSR J1939+2134", f0_hz: 641.9, period_ms: 1.56, difficulty: "hard" },
  { id: "J1946+3417", name: "PSR J1946+3417", f0_hz: 91.8, period_ms: 10.89, difficulty: "medium" },
  { id: "J1959+2048", name: "PSR J1959+2048", f0_hz: 622.1, period_ms: 1.61, difficulty: "hard" },
  { id: "J2010-1323", name: "PSR J2010−1323", f0_hz: 224.4, period_ms: 4.46, difficulty: "easy" },
  { id: "J2022+2534", name: "PSR J2022+2534", f0_hz: 74.1, period_ms: 13.49, difficulty: "medium" },
  { id: "J2043+1711", name: "PSR J2043+1711", f0_hz: 420.0, period_ms: 2.38, difficulty: "hard" },
  { id: "J2124-3358", name: "PSR J2124−3358", f0_hz: 202.9, period_ms: 4.93, difficulty: "easy" },
  { id: "J2145-0750", name: "PSR J2145−0750", f0_hz: 62.3, period_ms: 16.05, difficulty: "easy" },
  { id: "J2215+5135", name: "PSR J2215+5135", f0_hz: 406.8, period_ms: 2.46, difficulty: "hard" },
  { id: "J2222-0137", name: "PSR J2222−0137", f0_hz: 30.3, period_ms: 33.0, difficulty: "medium" },
  { id: "J2317+1439", name: "PSR J2317+1439", f0_hz: 290.0, period_ms: 3.45, difficulty: "medium" },

  // --- Added real pulsars to bring the total to 100+ ---
  { id: "J0007+7303", name: "PSR J0007+7303", f0_hz: 3.17, period_ms: 315.9, difficulty: "easy" },
  { id: "J0023+0923", name: "PSR J0023+0923", f0_hz: 327.0, period_ms: 3.06, difficulty: "hard" },
  { id: "J0034-0534", name: "PSR J0034−0534", f0_hz: 532.7, period_ms: 1.88, difficulty: "hard" },
  { id: "J0051+0423", name: "PSR J0051+0423", f0_hz: 190.1, period_ms: 5.26, difficulty: "medium" },
  { id: "J0117+5914", name: "PSR J0117+5914", f0_hz: 9.74, period_ms: 102.7, difficulty: "easy" },
  { id: "J0134-2937", name: "PSR J0134−2937", f0_hz: 66.0, period_ms: 15.15, difficulty: "easy" },
  { id: "J0205+6449", name: "PSR J0205+6449", f0_hz: 15.2, period_ms: 65.8, difficulty: "easy" },
  { id: "J0248+6021", name: "PSR J0248+6021", f0_hz: 4.60, period_ms: 217.4, difficulty: "medium" },
  { id: "J0337+1715", name: "PSR J0337+1715", f0_hz: 365.9, period_ms: 2.73, difficulty: "hard" },
  { id: "J0357+3205", name: "PSR J0357+3205", f0_hz: 0.63, period_ms: 1600.0, difficulty: "medium" },

  { id: "J0538+2817", name: "PSR J0538+2817", f0_hz: 6.98, period_ms: 143.2, difficulty: "easy" },
  { id: "J0633+1746", name: "PSR J0633+1746 (Geminga)", f0_hz: 4.22, period_ms: 237.0, difficulty: "easy" },
  { id: "J0659+1414", name: "PSR J0659+1414", f0_hz: 2.60, period_ms: 384.9, difficulty: "easy" },
  { id: "J0720-3125", name: "PSR J0720−3125", f0_hz: 0.12, period_ms: 8330.0, difficulty: "hard" },
  { id: "J0737-3039A", name: "PSR J0737−3039A", f0_hz: 44.1, period_ms: 22.70, difficulty: "medium" },
  { id: "J0737-3039B", name: "PSR J0737−3039B", f0_hz: 0.36, period_ms: 2770.0, difficulty: "hard" },

  { id: "J0835-4510", name: "PSR J0835−4510 (Vela)", f0_hz: 11.2, period_ms: 89.3, difficulty: "easy" },
  { id: "J0908-4913", name: "PSR J0908−4913", f0_hz: 9.36, period_ms: 106.8, difficulty: "easy" },
  { id: "J0940-5428", name: "PSR J0940−5428", f0_hz: 11.0, period_ms: 90.9, difficulty: "medium" },
  { id: "J1022+1001", name: "PSR J1022+1001", f0_hz: 60.8, period_ms: 16.44, difficulty: "easy" },
  { id: "J1024-0719", name: "PSR J1024−0719", f0_hz: 193.7, period_ms: 5.16, difficulty: "easy" },
  { id: "J1045-4509", name: "PSR J1045−4509", f0_hz: 133.8, period_ms: 7.47, difficulty: "medium" },
  { id: "J1119-6127", name: "PSR J1119−6127", f0_hz: 2.46, period_ms: 407.0, difficulty: "medium" },
  { id: "J1136+1551", name: "PSR J1136+1551", f0_hz: 2.45, period_ms: 408.0, difficulty: "easy" },

  { id: "J1231-1411", name: "PSR J1231−1411", f0_hz: 271.5, period_ms: 3.68, difficulty: "medium" },
  { id: "J1312+0051", name: "PSR J1312+0051", f0_hz: 0.79, period_ms: 1272.0, difficulty: "medium" },
  { id: "J1357-6429", name: "PSR J1357−6429", f0_hz: 6.02, period_ms: 166.0, difficulty: "medium" },
  { id: "J1410-6132", name: "PSR J1410−6132", f0_hz: 20.0, period_ms: 50.0, difficulty: "medium" },
  { id: "J1453+1902", name: "PSR J1453+1902", f0_hz: 57.0, period_ms: 17.54, difficulty: "easy" },
  { id: "J1509-5850", name: "PSR J1509−5850", f0_hz: 11.2, period_ms: 89.0, difficulty: "easy" },
  { id: "J1543+0929", name: "PSR J1543+0929", f0_hz: 216.3, period_ms: 4.62, difficulty: "medium" },

  { id: "J1603-7202", name: "PSR J1603−7202", f0_hz: 67.5, period_ms: 14.81, difficulty: "easy" },
  { id: "J1623-2631", name: "PSR J1623−2631", f0_hz: 111.1, period_ms: 9.00, difficulty: "medium" },
  { id: "J1640+2224", name: "PSR J1640+2224", f0_hz: 316.1, period_ms: 3.16, difficulty: "easy" },
  { id: "J1643-1224", name: "PSR J1643−1224", f0_hz: 216.4, period_ms: 4.62, difficulty: "easy" },
  { id: "J1705-1906", name: "PSR J1705−1906", f0_hz: 3.37, period_ms: 297.0, difficulty: "medium" },
  { id: "J1719-1438", name: "PSR J1719−1438", f0_hz: 172.7, period_ms: 5.79, difficulty: "hard" },

  { id: "J1744-1134", name: "PSR J1744−1134", f0_hz: 245.4, period_ms: 4.07, difficulty: "easy" },
  { id: "J1747-4036", name: "PSR J1747−4036", f0_hz: 608.0, period_ms: 1.64, difficulty: "hard" },
  { id: "J1807-2500B", name: "PSR J1807−2500B", f0_hz: 207.0, period_ms: 4.83, difficulty: "hard" },
  { id: "J1823-3021A", name: "PSR J1823−3021A", f0_hz: 184.0, period_ms: 5.43, difficulty: "hard" },
  { id: "J1836+5925", name: "PSR J1836+5925", f0_hz: 5.78, period_ms: 173.0, difficulty: "medium" },
  { id: "J1840-1419", name: "PSR J1840−1419", f0_hz: 0.07, period_ms: 15200.0, difficulty: "hard" },

  { id: "J1913+1102", name: "PSR J1913+1102", f0_hz: 30.0, period_ms: 33.3, difficulty: "medium" },
  { id: "J1933-6211", name: "PSR J1933−6211", f0_hz: 47.3, period_ms: 21.15, difficulty: "medium" },
  { id: "J1952+3252", name: "PSR J1952+3252", f0_hz: 25.3, period_ms: 39.53, difficulty: "easy" },
  { id: "J2017+0603", name: "PSR J2017+0603", f0_hz: 346.0, period_ms: 2.89, difficulty: "medium" },
  { id: "J2051-0827", name: "PSR J2051−0827", f0_hz: 221.6, period_ms: 4.51, difficulty: "hard" },
  { id: "J2229+6114", name: "PSR J2229+6114", f0_hz: 19.4, period_ms: 51.6, difficulty: "easy" },
  { id: "J2241-5236", name: "PSR J2241−5236", f0_hz: 457.3, period_ms: 2.19, difficulty: "hard" },
  { id: "J2256-1024", name: "PSR J2256−1024", f0_hz: 243.2, period_ms: 4.11, difficulty: "hard" },
  { id: "J2302+4442", name: "PSR J2302+4442", f0_hz: 187.8, period_ms: 5.32, difficulty: "medium" },

  // A few extra MSPs to comfortably exceed 100 total:
  { id: "J0610-2100", name: "PSR J0610−2100", f0_hz: 258.0, period_ms: 3.88, difficulty: "hard" },
  { id: "J0645+5158", name: "PSR J0645+5158", f0_hz: 112.1, period_ms: 8.92, difficulty: "medium" },
  { id: "J0931-1902", name: "PSR J0931−1902", f0_hz: 430.0, period_ms: 2.33, difficulty: "hard" },
  { id: "J1405-4656", name: "PSR J1405−4656", f0_hz: 202.0, period_ms: 4.95, difficulty: "medium" },
  { id: "J1605-2557", name: "PSR J1605−2557", f0_hz: 386.1, period_ms: 2.59, difficulty: "hard" },
  { id: "J1741+1351", name: "PSR J1741+1351", f0_hz: 266.8, period_ms: 3.75, difficulty: "medium" },
];

export function hashToUint32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
export function gauss(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}
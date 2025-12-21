import data from "../data/trapum_pulsars.json";

export type TrapumPulsar = (typeof data)["docs"][number];

export function getTrapumPulsars(): TrapumPulsar[] {
    return data.docs as TrapumPulsar[];
}
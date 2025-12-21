// src/lib/publications.ts
export type PubType = "journal" | "preprint" | "conference" | "thesis" | "other";

export type PublicationItem = {
    id: string;              // stable id (orcid put-code or derived)
    title: string;
    year?: number;
    venue?: string;
    doi?: string;
    url?: string;
    authors?: string;
    type: PubType;
    source: "orcid" | "ads" | "manual";
};

function pickYear(dateStr?: string): number | undefined {
    if (!dateStr) return undefined;
    const m = String(dateStr).match(/^(\d{4})/);
    return m ? Number(m[1]) : undefined;
}

function isProbablyPreprint(venue?: string) {
    const v = (venue || "").toLowerCase();
    return v.includes("arxiv") || v.includes("preprint");
}

export async function fetchOrcidPublications(orcid: string): Promise<PublicationItem[]> {
    const url = `https://pub.orcid.org/v3.0/${orcid}/works`;

    try {
        const res = await fetch(url, {
            headers: { Accept: "application/json" },
        });

        if (!res.ok) {
            throw new Error(`ORCID request failed: ${res.status}`);
        }

        const data = await res.json();

        const items: PublicationItem[] = [];
        const groups = data?.group || [];
        for (const g of groups) {
            const summaries = g?.["work-summary"] || g?.workSummary || [];
            for (const w of summaries) {
                const putCode = w?.["put-code"] ?? w?.putCode;
                const title = w?.title?.title?.value || w?.title?.title?.["value"] || "Untitled";
                const year = pickYear(w?.["publication-date"]?.year?.value || w?.publicationDate?.year?.value);
                const typeRaw = String(w?.type || "").toLowerCase();

                const extIds = w?.["external-ids"]?.["external-id"] || w?.externalIds?.externalId || [];
                const doiObj = extIds.find(
                    (x: any) => String(x?.["external-id-type"] || x?.externalIdType).toLowerCase() === "doi"
                );
                const doi = doiObj ? (doiObj?.["external-id-value"] || doiObj?.externalIdValue) : undefined;

                const urlVal = w?.url?.value || w?.url?.["value"];
                const venue = w?.["journal-title"]?.value || w?.journalTitle?.value;

                let type: PubType = "other";
                if (typeRaw.includes("journal")) type = "journal";
                else if (typeRaw.includes("conference")) type = "conference";
                else if (isProbablyPreprint(venue) || typeRaw.includes("preprint")) type = "preprint";

                items.push({
                    id: putCode ? `orcid:${putCode}` : `orcid:${title}:${year ?? ""}`,
                    title,
                    year,
                    venue,
                    doi,
                    url: urlVal || (doi ? `https://doi.org/${doi}` : undefined),
                    type,
                    source: "orcid",
                });
            }
        }

        items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        return items;
    } catch (err: any) {
        const isCorsLike =
            err instanceof TypeError && (err.message || "").toLowerCase().includes("failed to fetch");

        // Surface a clear message to your UI (Publications.tsx already shows `err`)
        if (isCorsLike) {
            throw new Error(
                "Could not reach ORCID from the browser (CORS / network). " +
                "You may need a small server-side proxy or Vite dev proxy."
            );
        }

        throw err;
    }
}


export function searchPublications(items: PublicationItem[], q: string) {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) => {
        const hay = `${p.title} ${p.venue ?? ""} ${p.doi ?? ""} ${p.authors ?? ""}`.toLowerCase();
        return hay.includes(s);
    });
}
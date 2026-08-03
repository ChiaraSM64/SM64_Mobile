/*
 * admin.js
 * ----------------
 * Gère le formulaire d'ajout/modification de run :
 *  - construit l'entrée JSON (catégorie + détail)
 *  - va chercher data/runs.json sur GitHub via l'API Contents
 *  - insère/remplace l'entrée et repousse (commit) le fichier automatiquement
 *
 * Rien n'est envoyé nulle part ailleurs qu'à l'API GitHub (api.github.com),
 * avec le token que tu saisis toi-même dans le formulaire.
 */

const CATEGORY_PREFIXES = {
    "120_Star": "120",
    "70_Star": "70",
    "16_Star_No_LBLJ": "16NoLBLJ",
    "16_Star_LBLJ": "16LBLJ",
    "1_Star": "1",
    "0_Star": "0",
};

const CATEGORY_NAMES = {
    "120_Star": "120 Star",
    "70_Star": "70 Star",
    "16_Star_No_LBLJ": "16 Star No LBLJ",
    "16_Star_LBLJ": "16 Star LBLJ",
    "1_Star": "1 Star",
    "0_Star": "0 Star",
};

function sanitizeForId(name) {
    return name
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")
        .replace(/[^a-zA-Z0-9]/g, "");
}

function buildRunId(categoryKey, player) {
    const prefix = CATEGORY_PREFIXES[categoryKey] || categoryKey;
    return `${prefix}pb${sanitizeForId(player || "")}`;
}

function pad2(n) {
    return String(n).padStart(2, "0");
}

function buildTimeString(h, m, s) {
    h = parseInt(h, 10) || 0;
    m = parseInt(m, 10) || 0;
    s = parseInt(s, 10) || 0;
    if (h > 0) {
        return `${h}h ${pad2(m)}m ${pad2(s)}s`;
    }
    return `${m}m ${pad2(s)}s`;
}

/** Convertit un lien YouTube "watch"/"share" en lien embed utilisable dans un <iframe>. */
function toEmbedUrl(url) {
    if (!url) return "";
    url = url.trim();
    if (url.includes("/embed/")) return url; // déjà au bon format

    try {
        const u = new URL(url);
        let videoId = null;
        let si = u.searchParams.get("si");

        if (u.hostname.includes("youtu.be")) {
            videoId = u.pathname.slice(1);
        } else if (u.searchParams.has("v")) {
            videoId = u.searchParams.get("v");
        }

        if (videoId) {
            return si ? `https://www.youtube.com/embed/${videoId}?si=${si}` : `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (e) {
        // URL invalide, on la laisse telle quelle
    }
    return url;
}

// --- Encodage/décodage base64 compatible UTF-8 (pour les accents dans les pseudos) ---
function b64EncodeUnicode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}
function b64DecodeUnicode(b64) {
    const binary = atob(b64.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
}

function setStatus(type, message) {
    const el = document.getElementById("statusMsg");
    el.className = type;
    el.textContent = message;
}

// Pré-remplit l'ID automatiquement quand catégorie/joueur changent (sauf si l'utilisateur l'a déjà modifié à la main)
let idManuallyEdited = false;
document.getElementById("runId").addEventListener("input", () => { idManuallyEdited = true; });

function refreshAutoId() {
    if (idManuallyEdited) return;
    const category = document.getElementById("category").value;
    const player = document.getElementById("player").value;
    document.getElementById("runId").value = buildRunId(category, player);
}
document.getElementById("category").addEventListener("input", refreshAutoId);
document.getElementById("player").addEventListener("input", refreshAutoId);

// Date du jour par défaut
document.getElementById("date").valueAsDate = new Date();

document.getElementById("submitBtn").addEventListener("click", async () => {
    const token = document.getElementById("token").value.trim();
    const repo = document.getElementById("repoOwner").value.trim();
    const branch = document.getElementById("branch").value.trim() || "main";
    const categoryKey = document.getElementById("category").value;
    const player = document.getElementById("player").value.trim();
    const flag = document.getElementById("flag").value.trim().toLowerCase();
    const hours = document.getElementById("hours").value;
    const minutes = document.getElementById("minutes").value;
    const seconds = document.getElementById("seconds").value;
    const date = document.getElementById("date").value;
    const verified = document.getElementById("verified").checked;
    const verifier = document.getElementById("verifier").value.trim();
    const videoRaw = document.getElementById("video").value.trim();
    const description = document.getElementById("description").value.trim();
    const runId = document.getElementById("runId").value.trim() || buildRunId(categoryKey, player);

    if (!token) {
        setStatus("error", "❌ Merci de renseigner ton token GitHub.");
        return;
    }
    if (!player) {
        setStatus("error", "❌ Merci de renseigner le nom du joueur.");
        return;
    }

    const time = buildTimeString(hours, minutes, seconds);
    const video = toEmbedUrl(videoRaw);
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;

    try {
        setStatus("loading", "⏳ Récupération de data/runs.json depuis GitHub...");

        const apiUrl = `https://api.github.com/repos/${repo}/contents/data/runs.json`;
        const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
            },
        });

        if (!getRes.ok) {
            const errBody = await getRes.json().catch(() => ({}));
            throw new Error(`Impossible de lire runs.json (${getRes.status}) : ${errBody.message || getRes.statusText}`);
        }

        const getData = await getRes.json();
        const sha = getData.sha;
        const currentJson = JSON.parse(b64DecodeUnicode(getData.content));

        // --- Mise à jour de la section "categories" ---
        if (!currentJson.categories[categoryKey]) {
            currentJson.categories[categoryKey] = {
                name: CATEGORY_NAMES[categoryKey] || categoryKey,
                entries: [],
            };
        }
        const entries = currentJson.categories[categoryKey].entries;
        const existingIdx = entries.findIndex(e => e.id === runId);
        const newEntry = {
            id: runId,
            player: player,
            flag: flag ? `${flag}.png` : null,
            colorKey: null, // laissé vide : la couleur est déduite automatiquement du nom par leaderboard.js
            time: time,
            date: date || "Unknown",
            verified: verified,
        };
        if (existingIdx >= 0) {
            entries[existingIdx] = newEntry;
        } else {
            entries.push(newEntry);
        }

        // --- Mise à jour de la section "runsDetail" ---
        currentJson.runsDetail[runId] = {
            id: runId,
            categoryName: CATEGORY_NAMES[categoryKey] || categoryKey,
            categoryKey: categoryKey,
            date: date || "Unknown",
            time: time,
            player: player,
            playerColorKey: null,
            verifier: verifier || null,
            verifierColorKey: null,
            video: video,
            description: description,
        };

        setStatus("loading", "⏳ Envoi de la mise à jour sur GitHub...");

        const newContentB64 = b64EncodeUnicode(JSON.stringify(currentJson, null, 2));
        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Ajout/màj run : ${player} (${CATEGORY_NAMES[categoryKey] || categoryKey})`,
                content: newContentB64,
                sha: sha,
                branch: branch,
            }),
        });

        if (!putRes.ok) {
            const errBody = await putRes.json().catch(() => ({}));
            throw new Error(`Échec de l'envoi (${putRes.status}) : ${errBody.message || putRes.statusText}`);
        }

        setStatus("success", `✅ Run ajoutée avec succès ! (id: ${runId}) — le site se mettra à jour d'ici 1-2 minutes.`);
    } catch (err) {
        setStatus("error", `❌ Erreur : ${err.message}`);
    } finally {
        submitBtn.disabled = false;
    }
});

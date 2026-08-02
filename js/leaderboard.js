/*
 * leaderboard.js
 * ----------------
 * Lit ../data/runs.json et génère dynamiquement :
 *   - le tableau de classement d'une catégorie (trié automatiquement par temps)
 *   - le contenu d'une page de détail de run (rang, temps, joueur, vidéo, etc.)
 *
 * Pour ajouter/modifier une run : éditer uniquement data/runs.json.
 * Tout le reste (classement, pages de détail) se met à jour tout seul.
 */

// Points de coupure pour les pseudos "bicolores" (2 classes CSS distinctes).
// clé = colorKey tel que stocké dans le JSON (ex: "major1-major2")
// valeur = nombre de caractères du pseudo affectés à la 1ère couleur.
const TWO_TONE_SPLITS = {
    "major1-major2": 2,   // "Ma" + "jor"
    "chillo1-chillo2": 2, // "Ch" + "illo"
};

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

/** Génère le HTML coloré d'un pseudo à partir de son colorKey (ex: "awbryy", "major1-major2", "default"). */
function renderPlayerName(name, colorKey) {
    if (!name) return "";
    const key = colorKey || "default";
    const parts = key.split("-");

    if (parts.length === 1) {
        return `<strong class="playerColor ${parts[0]}">${escapeHtml(name)}</strong>`;
    }

    const splitAt = TWO_TONE_SPLITS[key];
    if (splitAt != null) {
        const first = name.slice(0, splitAt);
        const rest = name.slice(splitAt);
        return `<strong class="playerColor ${parts[0]}">${escapeHtml(first)}</strong><strong class="playerColor ${parts[1]}">${escapeHtml(rest)}</strong>`;
    }

    // Pseudo bicolore inconnu (nouveau joueur) : fallback couleur par défaut.
    return `<strong class="playerColor default">${escapeHtml(name)}</strong>`;
}

/** Convertit "15m 27s" / "1h 02m 03s" / "Unknown" en secondes pour le tri. */
function timeToSeconds(t) {
    if (!t || String(t).toLowerCase() === "unknown") return Infinity;
    let h = 0, m = 0, s = 0;
    const hm = t.match(/(\d+)\s*h/);
    const mm = t.match(/(\d+)\s*m(?!s)/); // "m" mais pas suivi de "s" (pour ne pas capturer "ms")
    const sm = t.match(/(\d+)\s*s/);
    if (hm) h = parseInt(hm[1], 10);
    if (mm) m = parseInt(mm[1], 10);
    if (sm) s = parseInt(sm[1], 10);
    return h * 3600 + m * 60 + s;
}

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

let _dataCache = null;
async function loadData() {
    if (_dataCache) return _dataCache;
    const res = await fetch("../data/runs.json");
    if (!res.ok) throw new Error("Impossible de charger data/runs.json");
    _dataCache = await res.json();
    return _dataCache;
}

function sortedEntries(cat) {
    return [...cat.entries].sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));
}

/** Génère le tableau de classement pour la catégorie donnée (clé = nom de fichier sans .html). */
async function renderCategoryTable(categoryKey) {
    const data = await loadData();
    const cat = data.categories[categoryKey];
    const table = document.querySelector(".leaderboardBox table");
    if (!cat || !table) return;

    const sorted = sortedEntries(cat);

    const headerRow = table.querySelector("tr");
    table.innerHTML = "";
    table.appendChild(headerRow);

    sorted.forEach((entry, idx) => {
        const rank = idx + 1;
        const tr = document.createElement("tr");

        if (entry.id) {
            tr.dataset.href = `../runs/view.html?id=${encodeURIComponent(entry.id)}`;
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => {
                window.location.href = tr.dataset.href;
            });
        }

        const flagImg = entry.flag
            ? `<img src="../images/${entry.flag}" width="22rem" style="border-radius: 0.15rem; margin-right: 0.2rem;">`
            : "";

        tr.innerHTML = `
            <td>${rank}</td>
            <td style="text-align: left;">${flagImg}${renderPlayerName(entry.player, entry.colorKey)}</td>
            <td>${escapeHtml(entry.time)}</td>
            <td>${escapeHtml(entry.date)}</td>
            <td>${entry.verified ? "Yes" : "No"}</td>
        `;
        table.appendChild(tr);
    });
}

/** Remplit la page de détail d'une run à partir de son id (= nom de fichier sans .html). */
async function renderRunDetail(runId) {
    const data = await loadData();
    const run = data.runsDetail[runId];
    if (!run) return;

    let rank = null;
    const cat = data.categories[run.categoryKey];
    if (cat) {
        const sorted = sortedEntries(cat);
        const i = sorted.findIndex(e => e.id === runId);
        if (i >= 0) rank = i + 1;
    }

    document.title = `${run.categoryName} in ${run.time} by ${run.player}`;

    const breadcrumb = document.getElementById("run-breadcrumb");
    if (breadcrumb) {
        breadcrumb.innerHTML = `<a href="../index.html">Leaderboards</a> / <a href="../categories/${run.categoryKey}.html">${run.categoryName}</a>`;
    }

    const summary = document.getElementById("run-summary");
    if (summary) {
        summary.innerHTML = `<strong>${run.categoryName}</strong> in <strong>${run.time}</strong> by ${renderPlayerName(run.player, run.playerColorKey)}`;
    }

    const video = document.getElementById("run-video");
    if (video && run.video) video.src = run.video;

    const desc = document.getElementById("run-description");
    if (desc) desc.textContent = run.description || "";

    setText("stat-category", run.categoryName);
    setText("stat-date", run.date);
    setText("stat-rank", rank ? ordinal(rank) : "N/A");
    setText("stat-time", run.time);
    setHtml("stat-player", renderPlayerName(run.player, run.playerColorKey));
    setHtml("stat-verifier", run.verifier ? renderPlayerName(run.verifier, run.verifierColorKey) : "N/A");
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
}
function setHtml(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val ?? "";
}

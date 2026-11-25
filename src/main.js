import "./styles.css";
import { COPY, LINKS, META, VIDEOS } from "./i18n.js";
import { ICONS } from "./icons.js";
import { esc, renderA } from "./pageA.js";
import { buildBrief, renderB } from "./pageB.js";
import "./a.css";
import "./b.css";

const VARIANT_COOKIE = "ha_variant";
const LANG_KEY = "ha_lang";
const VARIANTS = ["a", "b"];

/* ---------- storage helpers (never let storage errors break the page) ---------- */

function readCookie(name) {
	try {
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
		return match ? decodeURIComponent(match[1]) : null;
	} catch {
		return null;
	}
}

function writeCookie(name, value, days) {
	try {
		const expires = new Date(Date.now() + days * 864e5).toUTCString();
		document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
	} catch {
		/* ignore */
	}
}

function readStorage(key) {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key, value) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		/* ignore */
	}
}

/* ---------- A/B variant ---------- */

/**
 * URL structure for the experiment (Johan, #1157):
 *   A: https://humanauthn.com/            (primary canonical URL)
 *   B: https://humanauthn.com/?variant=b  (canonical points to /)
 *
 * Visitors to / get a sticky 50/50 split (ha_variant cookie, 90 days); returning visitors keep their variant.
 * ?variant=a|b (and old links ?v=a|b, /a, /b) force a variant without saving it, so QA links don't skew the split.
 * The address bar is then rewritten to the structure above.
 */
function resolveVariant() {
	const url = new URL(window.location.href);
	const fromQuery = (url.searchParams.get("variant") || url.searchParams.get("v") || "").toLowerCase();
	const fromPath = url.pathname.replace(/\/+$/, "").split("/").pop()?.toLowerCase();

	let variant;
	let forced = true;
	if (VARIANTS.includes(fromQuery)) variant = fromQuery;
	else if (VARIANTS.includes(fromPath)) variant = fromPath;
	else {
		forced = false;
		variant = readCookie(VARIANT_COOKIE);
		if (!VARIANTS.includes(variant)) {
			variant = Math.random() < 0.5 ? "a" : "b";
			writeCookie(VARIANT_COOKIE, variant, 90);
		}
	}

	url.searchParams.delete("v");
	url.searchParams.delete("variant");
	if (VARIANTS.includes(fromPath)) url.pathname = url.pathname.replace(/\/(a|b)\/*$/i, "/");
	if (variant === "b") url.searchParams.set("variant", "b");
	if (url.href !== window.location.href) window.history.replaceState(null, "", url);

	// A returning visitor reloading their own variant's URL (e.g. B on /?variant=b) is not a forced view.
	if (forced && readCookie(VARIANT_COOKIE) === variant) forced = false;

	return { variant, forced };
}

/* ---------- language ---------- */

function resolveLang() {
	const params = new URLSearchParams(window.location.search);
	const fromQuery = (params.get("lang") || "").toLowerCase();
	if (fromQuery === "es" || fromQuery === "en") return fromQuery;

	const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
	if (firstSegment === "es" || firstSegment === "en") return firstSegment;

	const stored = readStorage(LANG_KEY);
	if (stored === "es" || stored === "en") return stored;

	const browser = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
	return browser.startsWith("es") ? "es" : "en";
}

/* ---------- analytics hook (GTM / GA4 if present) ---------- */

function track(event, data = {}) {
	const payload = { event, ...data, ha_variant: state.variant, ha_lang: state.lang };
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push(payload);
	if (typeof window.gtag === "function") window.gtag("event", event, payload);
}

/* ---------- rendering ---------- */

let state;

function modal(t) {
	return `
	<div class="modal" data-modal hidden role="dialog" aria-modal="true" aria-label="${esc(t.how.videoTitle)}">
		<span class="modal__sentinel" tabindex="0" data-focus-sentinel="start" aria-hidden="true"></span>
		<div class="modal__backdrop" data-close-video></div>
		<div class="modal__body">
			<button type="button" class="modal__close" data-close-video aria-label="${esc(t.modal.close)}">${ICONS.close}</button>
			<div class="modal__frame" data-frame></div>
		</div>
		<span class="modal__sentinel" tabindex="0" data-focus-sentinel="end" aria-hidden="true"></span>
	</div>`;
}

function videoId() {
	return VIDEOS[state.lang] || VIDEOS.es;
}

function render() {
	const t = COPY[state.lang];
	const links = LINKS[state.lang];
	const meta = META[state.lang];

	document.documentElement.lang = state.lang;
	document.documentElement.dataset.variant = state.variant;
	document.title = meta.title;
	document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
	document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
	document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);

	// Both variants follow the Figma file: A = "humanauthn.com V1.0 (A)", B = "humanauthn.com V1.0 (B)".
	document.body.classList.add("va");
	const page = state.variant === "a" ? renderA(state.lang, links).html : renderB(state.lang, links);
	document.getElementById("app").innerHTML = page + modal(t);
}

/* ---------- interactions ---------- */

let videoOpener = null;
let videoOpenedWithPointer = false;
let focusReclaim = 0;

function youtubeEmbedId(value) {
	const id = String(value || "").trim();
	return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : "";
}

function setPageInert(inert) {
	const modalEl = document.querySelector("[data-modal]");
	if (!modalEl?.parentElement) return;
	for (const child of modalEl.parentElement.children) {
		if (child !== modalEl) child.inert = inert;
	}
}

function openVideo(opener, viaPointer = false) {
	const modalEl = document.querySelector("[data-modal]");
	if (!modalEl) return;
	const frame = modalEl.querySelector("[data-frame]");
	const requested = youtubeEmbedId(opener?.getAttribute?.("data-video-id"));
	const id = requested || videoId();
	const title = opener?.getAttribute?.("data-video-title") || COPY[state.lang].how.videoTitle;
	const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&hl=${encodeURIComponent(state.lang)}`;
	frame.replaceChildren();
	const iframe = document.createElement("iframe");
	iframe.src = src;
	iframe.title = title;
	iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
	iframe.allowFullscreen = true;
	// Card films stay out of the tab order. A focused cross-origin player swallows Escape,
	// so those dialogs keep focus on the close button and pull it back if the player takes it.
	const cardFilm = Boolean(requested);
	iframe.tabIndex = cardFilm ? -1 : 0;
	frame.appendChild(iframe);
	modalEl.setAttribute("aria-label", title);
	videoOpener = opener && typeof opener.focus === "function" ? opener : null;
	videoOpenedWithPointer = Boolean(viaPointer);
	modalEl.hidden = false;
	setPageInert(true);
	document.body.classList.add("no-scroll");
	modalEl.querySelector(".modal__close").focus();
	window.clearInterval(focusReclaim);
	focusReclaim = 0;
	if (cardFilm) {
		focusReclaim = window.setInterval(() => {
			if (modalEl.hidden) return;
			if (document.activeElement?.tagName === "IFRAME") modalEl.querySelector(".modal__close")?.focus();
		}, 200);
	}
}

function closeVideo() {
	const modalEl = document.querySelector("[data-modal]");
	if (!modalEl || modalEl.hidden) return;
	window.clearInterval(focusReclaim);
	focusReclaim = 0;
	modalEl.querySelector("[data-frame]").replaceChildren();
	modalEl.hidden = true;
	setPageInert(false);
	document.body.classList.remove("no-scroll");
	const opener = videoOpener;
	const viaPointer = videoOpenedWithPointer;
	videoOpener = null;
	videoOpenedWithPointer = false;
	if (!opener || !document.contains(opener)) return;
	// A pointer open must not leave the card in its lifted state. Keyboard opens return
	// focus with a visible ring (:focus-visible), including after Escape.
	if (viaPointer) opener.blur();
	else opener.focus({ focusVisible: true });
}

function trapModalFocus(event) {
	if (event.key !== "Tab") return;
	const modalEl = document.querySelector("[data-modal]");
	if (!modalEl || modalEl.hidden) return;
	const close = modalEl.querySelector(".modal__close");
	const iframe = modalEl.querySelector("iframe");
	const active = document.activeElement;
	if (!close) return;
	if (!iframe || iframe.tabIndex < 0) {
		if (active === close) event.preventDefault();
		return;
	}
	if (event.shiftKey && active === close) {
		event.preventDefault();
		iframe.focus();
	} else if (!event.shiftKey && active === iframe) {
		event.preventDefault();
		close.focus();
	}
}

function setLang(lang) {
	if (lang === state.lang) return;
	state.lang = lang;
	writeStorage(LANG_KEY, lang);
	const url = new URL(window.location.href);
	url.searchParams.set("lang", lang);
	window.history.replaceState(null, "", url);
	track("ha_language_change");
	render();
}

function closeDropdowns(except) {
	document.querySelectorAll("[data-dropdown][aria-expanded='true']").forEach((btn) => {
		if (btn !== except) btn.setAttribute("aria-expanded", "false");
	});
}

function applyFilter(button) {
	const filter = button.dataset.filter;
	document.querySelectorAll("[data-filter]").forEach((b) => {
		b.classList.toggle("is-active", b === button);
		b.setAttribute("aria-pressed", String(b === button));
	});
	document.querySelectorAll(".va-post").forEach((post) => {
		post.hidden = filter !== "all" && post.dataset.cat !== filter;
	});
}

function downloadBrief(form) {
	const { file, text } = buildBrief(state.lang, form.focus.value, form.challenge.value, LINKS[state.lang].demo);
	const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = file;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1000);
	track("ha_demo_brief", { focus: form.focus.value });
}

function moveCarousel(direction) {
	const track_ = document.querySelector("[data-carousel-track]");
	const card = track_?.querySelector(".vb-sec__card");
	if (!card) return;
	track_.scrollBy({ left: direction * (card.offsetWidth + 24), behavior: "smooth" });
}

document.addEventListener("submit", (event) => {
	const brief = event.target.closest("[data-brief-form]");
	if (brief) {
		event.preventDefault();
		downloadBrief(brief);
		return;
	}
	const form = event.target.closest("[data-demo-form]");
	if (!form) return;
	event.preventDefault();
	if (!form.reportValidity()) return;
	// No backend yet: record the intent (no personal data) and send people to the booking calendar.
	track("ha_demo_request", { interest: form.interest.value });
	form.querySelector("[data-form-sent]").hidden = false;
	window.setTimeout(() => window.open(LINKS[state.lang].demo, "_blank", "noopener"), 600);
});

document.addEventListener("click", (event) => {
	const dropdown = event.target.closest("[data-dropdown]");
	closeDropdowns(dropdown);
	if (dropdown) {
		dropdown.setAttribute("aria-expanded", String(dropdown.getAttribute("aria-expanded") !== "true"));
		return;
	}
	const filterBtn = event.target.closest("[data-filter]");
	if (filterBtn) applyFilter(filterBtn);
	const arrow = event.target.closest("[data-carousel]");
	if (arrow) moveCarousel(Number(arrow.dataset.carousel));

	const target = event.target.closest("[data-lang],[data-open-video],[data-close-video],[data-menu],[data-track],.nav__mobile a,.va-nav__mobile a");
	if (!target) return;

	if (target.dataset.track) track("ha_cta_click", { cta: target.dataset.track });
	if (target.dataset.lang) setLang(target.dataset.lang);
	if (target.hasAttribute("data-open-video")) openVideo(target, event.detail > 0);
	if (target.hasAttribute("data-close-video")) closeVideo();

	const menu = document.querySelector("[data-mobile-menu]");
	if (target.hasAttribute("data-menu")) {
		menu.hidden = !menu.hidden;
		target.setAttribute("aria-expanded", String(!menu.hidden));
	} else if (target.closest(".nav__mobile, .va-nav__mobile")) {
		menu.hidden = true;
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Tab") trapModalFocus(event);
	if (event.key === "Escape") {
		closeVideo();
		closeDropdowns();
	}
});

document.addEventListener("focusin", (event) => {
	const modalEl = document.querySelector("[data-modal]");
	if (!modalEl || modalEl.hidden) return;
	const which = event.target?.getAttribute?.("data-focus-sentinel");
	if (which === "end" || which === "start") {
		const iframe = modalEl.querySelector("iframe");
		const close = modalEl.querySelector(".modal__close");
		if (which === "start" && iframe && iframe.tabIndex >= 0) iframe.focus();
		else close?.focus();
		return;
	}
	if (!modalEl.contains(event.target)) modalEl.querySelector(".modal__close")?.focus();
});

function bootLanding() {
	state = { ...resolveVariant(), lang: resolveLang() };
	render();
	track("ha_variant_view", { forced: state.forced });
}

function routePath() {
	return window.location.pathname.replace(/\/+$/, "") || "/";
}

/** Path language wins over ?lang=, saved choice, and the browser language. */
function bookMeetingLang(pathname = routePath()) {
	if (pathname === "/en/book-meeting") return "en";
	if (pathname === "/es/book-meeting") return "es";
	return null;
}

function meetingConfirmedLang(pathname = routePath()) {
	if (pathname === "/en/meeting-confirmed") return "en";
	if (pathname === "/es/meeting-confirmed") return "es";
	return null;
}

let landingBooted = false;

function restoreLandingHead() {
	document.body.classList.remove("page-book", "page-confirm");
	document.documentElement.lang = state?.lang || "en";
	const robots = document.querySelector('meta[name="robots"]');
	if (robots && /noindex/i.test(robots.getAttribute("content") || "")) robots.remove();
	document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
	let canonical = document.querySelector('link[rel="canonical"]');
	if (!canonical) {
		canonical = document.createElement("link");
		canonical.rel = "canonical";
		document.head.appendChild(canonical);
	}
	canonical.href = "https://humanauthn.com/";
	let ogUrl = document.querySelector('meta[property="og:url"]');
	if (!ogUrl) {
		ogUrl = document.createElement("meta");
		ogUrl.setAttribute("property", "og:url");
		document.head.appendChild(ogUrl);
	}
	ogUrl.setAttribute("content", "https://humanauthn.com/");
}

function showLanding() {
	document.body.classList.remove("page-book", "page-confirm");
	if (!landingBooted) {
		landingBooted = true;
		bootLanding();
		return;
	}
	restoreLandingHead();
	render();
}

function showRoute() {
	const path = routePath();
	const confirmedLang = meetingConfirmedLang(path);
	const bookLang = bookMeetingLang(path);
	const app = document.getElementById("app");
	if (confirmedLang) {
		if (app) app.innerHTML = "";
		return import("./meeting-confirmed.js").then(({ mountMeetingConfirmed }) => mountMeetingConfirmed(confirmedLang));
	}
	if (bookLang) {
		if (app) app.innerHTML = "";
		return import("./book-meeting.js").then(({ mountBookMeeting }) => mountBookMeeting(bookLang));
	}
	return showLanding();
}

document.addEventListener("click", (event) => {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	const link = event.target.closest("a[href]");
	if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
	const url = new URL(link.href, window.location.href);
	if (url.origin !== window.location.origin) return;
	const path = url.pathname.replace(/\/+$/, "") || "/";
	if (!meetingConfirmedLang(path) && !bookMeetingLang(path)) return;
	event.preventDefault();
	if (path === routePath()) return;
	history.pushState(null, "", url.pathname + url.search + url.hash);
	showRoute();
});

window.addEventListener("popstate", () => showRoute());

// These routes skip the A/B rewrite and the saved/browser language so /en/ and /es/ stay as written.
showRoute();

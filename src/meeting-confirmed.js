import "./styles.css";
import "./a.css";
import "./meeting-confirmed.css";

const ORIGIN = "https://humanauthn.com";

const COPY = {
	en: {
		lang: "en",
		title: "Meeting confirmed | HumanAuthn",
		description: "You have a reservation with HumanAuthn. An invitation has been sent to you by email.",
		heading: "Booking confirmed",
		leadBefore: "You have a reservation with ",
		leadAfter: ". An invitation has been sent to you by email.",
		button: "Go to home",
		otherHref: "/es/meeting-confirmed/",
		otherLabel: "View in Spanish",
		home: "/",
		homeLabel: "HumanAuthn home",
		rights: "All rights reserved.",
		built: "Built by",
	},
	es: {
		lang: "es",
		title: "Reunión confirmada | HumanAuthn",
		description: "Tienes una llamada con HumanAuthn. Se te ha enviado una invitación por correo electrónico con todos los detalles.",
		heading: "Sesión confirmada",
		leadBefore: "Tienes una llamada con ",
		leadAfter: ". Se te ha enviado una invitación por correo electrónico con todos los detalles.",
		button: "Ir al inicio",
		otherHref: "/en/meeting-confirmed/",
		otherLabel: "Ver en inglés",
		home: "/?lang=es",
		homeLabel: "Inicio de HumanAuthn",
		rights: "Todos los derechos reservados.",
		built: "Creado por",
	},
};

const logo = `<span class="va-logo__text">Human<span class="va-logo__lambda">Λ</span>uthn</span>`;

const icon = `<svg class="confirm-icon__svg" width="88" height="88" viewBox="0 0 96 96" fill="none" aria-hidden="true">
	<circle cx="48" cy="48" r="48" fill="#efeaff"/>
	<path fill="#6a2cf5" d="M43.6 63.2c-1.6 0-3.1-.6-4.2-1.8L28.8 50.6a3.4 3.4 0 0 1 4.9-4.7l9.2 9.6 20.2-23.4a3.4 3.4 0 1 1 5.1 4.5L48.1 61.2a5.4 5.4 0 0 1-4.1 2z"/>
</svg>`;

export function meetingConfirmedLang(pathname = window.location.pathname) {
	const path = pathname.replace(/\/+$/, "");
	if (path === "/en/meeting-confirmed") return "en";
	if (path === "/es/meeting-confirmed") return "es";
	return null;
}

function pageUrl(lang) {
	return `${ORIGIN}/${lang}/meeting-confirmed/`;
}

function ensureMeta(selector, create) {
	let el = document.head.querySelector(selector);
	if (!el) {
		el = create();
		document.head.appendChild(el);
	}
	return el;
}

function upsertLink(rel, href, hreflang) {
	const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
	const link = ensureMeta(selector, () => {
		const el = document.createElement("link");
		el.rel = rel;
		if (hreflang) el.hreflang = hreflang;
		return el;
	});
	link.href = href;
}

/** The path decides the language, so a leftover ?lang= must not change this page. */
function dropLangParam() {
	const url = new URL(window.location.href);
	if (!url.searchParams.has("lang")) return;
	url.searchParams.delete("lang");
	history.replaceState(null, "", url.pathname + url.search + url.hash);
}

function markup(page) {
	const year = new Date().getFullYear();
	return `
	<div class="confirm" data-confirm-lang="${page.lang}">
		<header class="confirm-header">
			<a class="va-logo" href="${page.home}" aria-label="${page.homeLabel}">${logo}</a>
		</header>
		<main class="confirm-stage">
			<div class="confirm-float confirm-float--tr" aria-hidden="true"><img src="/img/avatar-man.webp" alt="" width="96" height="96" /></div>
			<div class="confirm-float confirm-float--ml" aria-hidden="true"><img src="/img/avatar-welcome.webp" alt="" width="112" height="112" /></div>
			<div class="confirm-float confirm-float--br" aria-hidden="true"><img src="/img/hero-avatar-r.webp" alt="" width="84" height="84" /></div>
			<section class="confirm-card" aria-labelledby="confirm-title">
				<div class="confirm-icon">${icon}</div>
				<h1 id="confirm-title">${page.heading}</h1>
				<p>${page.leadBefore}<a href="${page.home}">HumanAuthn</a>${page.leadAfter}</p>
				<p class="confirm-switch"><a href="${page.otherHref}">${page.otherLabel}</a></p>
				<a class="va-btn va-btn--violet confirm-home" href="${page.home}">${page.button}</a>
			</section>
		</main>
		<footer class="va-foot">
			<div class="confirm-foot">
				<div class="confirm-foot__brand">
					<a class="va-logo" href="${page.home}" aria-label="${page.homeLabel}">${logo}</a>
					<address>30 N Gould St Ste 30338, Sheridan, WY 82801</address>
					<p>© ${year} HumanAuthn. ${page.rights}</p>
				</div>
				<p class="confirm-foot__by">${page.built} <a href="https://verifik.co" target="_blank" rel="noopener">Verifik</a></p>
			</div>
		</footer>
	</div>`;
}

/** @param {"en" | "es"} lang Language from the /en/ or /es/ path, never from storage or ?lang=. */
export function mountMeetingConfirmed(lang) {
	dropLangParam();
	const page = COPY[lang] || COPY.en;
	document.documentElement.lang = page.lang;
	document.title = page.title;
	document.body.classList.remove("page-book");
	document.body.classList.add("va", "page-confirm");

	const robots = ensureMeta('meta[name="robots"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("name", "robots");
		return meta;
	});
	robots.setAttribute("content", "noindex, nofollow");
	document.querySelector('script[type="application/ld+json"]')?.remove();

	const description = ensureMeta('meta[name="description"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("name", "description");
		return meta;
	});
	description.setAttribute("content", page.description);
	const ogTitle = ensureMeta('meta[property="og:title"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:title");
		return meta;
	});
	ogTitle.setAttribute("content", page.title);
	const ogDescription = ensureMeta('meta[property="og:description"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:description");
		return meta;
	});
	ogDescription.setAttribute("content", page.description);
	const ogUrl = ensureMeta('meta[property="og:url"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:url");
		return meta;
	});
	ogUrl.setAttribute("content", pageUrl(page.lang));

	document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
	upsertLink("canonical", pageUrl(page.lang));
	upsertLink("alternate", pageUrl("en"), "en");
	upsertLink("alternate", pageUrl("es"), "es");
	upsertLink("alternate", pageUrl("en"), "x-default");

	const app = document.getElementById("app");
	const current = app?.querySelector("[data-confirm-lang]");
	if (app && current?.dataset.confirmLang !== page.lang) app.innerHTML = markup(page);
}

if (document.body.classList.contains("page-confirm") && !document.body.classList.contains("page-book")) {
	mountMeetingConfirmed(meetingConfirmedLang() || (document.documentElement.lang === "es" ? "es" : "en"));
}

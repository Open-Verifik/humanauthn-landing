import "./styles.css";
import "./a.css";
import "./meeting-confirmed.css";
import "./book-meeting.css";

const ORIGIN = "https://humanauthn.com";
const EMBED_SRC = "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js";

const COPY = {
	en: {
		lang: "en",
		title: "Book a meeting | HumanAuthn",
		description: "Book a meeting with HumanAuthn. Choose a time and we will send a calendar invitation to your email.",
		heading: "Book a meeting with HumanAuthn",
		lead: "Choose a time that works for you. A calendar invitation will be sent to your email.",
		otherHref: "/es/book-meeting/",
		otherLabel: "View in Spanish",
		home: "/",
		homeLabel: "HumanAuthn home",
		rights: "All rights reserved.",
		built: "Built by",
		calendar: "Open the calendar",
		embed: "https://meetings.hubspot.com/johan-castellanos/linkhuman-general-eng?embed=true",
		direct: "https://meetings.hubspot.com/johan-castellanos/linkhuman-general-eng",
	},
	es: {
		lang: "es",
		title: "Agenda una reunión | HumanAuthn",
		description: "Agenda una reunión con HumanAuthn. Elige un horario y te enviaremos la invitación al calendario por correo.",
		heading: "Agenda una reunión con HumanAuthn",
		lead: "Elige el día y la hora que mejor te queden. Te enviaremos la invitación al calendario por correo.",
		otherHref: "/en/book-meeting/",
		otherLabel: "Ver en inglés",
		home: "/?lang=es",
		homeLabel: "Inicio de HumanAuthn",
		rights: "Todos los derechos reservados.",
		built: "Creado por",
		calendar: "Abrir el calendario",
		embed: "https://meetings.hubspot.com/johan-castellanos/humanauthncomesbook-meeting?embed=true",
		direct: "https://meetings.hubspot.com/johan-castellanos/humanauthncomesbook-meeting",
	},
};

const logo = `<span class="va-logo__text">Human<span class="va-logo__lambda">Λ</span>uthn</span>`;

export function bookMeetingLang(pathname = window.location.pathname) {
	const path = pathname.replace(/\/+$/, "");
	if (path === "/en/book-meeting") return "en";
	if (path === "/es/book-meeting") return "es";
	return null;
}

function pageUrl(lang) {
	return `${ORIGIN}/${lang}/book-meeting/`;
}

function upsertMeta(selector, create) {
	let el = document.head.querySelector(selector);
	if (!el) {
		el = create();
		document.head.appendChild(el);
	}
	return el;
}

function upsertLink(rel, href, hreflang) {
	const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
	const link = upsertMeta(selector, () => {
		const el = document.createElement("link");
		el.rel = rel;
		if (hreflang) el.hreflang = hreflang;
		return el;
	});
	link.href = href;
}

function markup(page) {
	const year = new Date().getFullYear();
	return `
	<div class="confirm" data-book-lang="${page.lang}">
		<header class="confirm-header">
			<a class="va-logo" href="${page.home}" aria-label="${page.homeLabel}">${logo}</a>
		</header>
		<main class="confirm-stage">
			<section class="book-card" aria-labelledby="book-title">
				<h1 id="book-title">${page.heading}</h1>
				<p class="book-lead">${page.lead}</p>
				<p class="book-switch"><a href="${page.otherHref}">${page.otherLabel}</a></p>
				<div class="meetings-iframe-container" data-src="${page.embed}"></div>
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

/** Load HubSpot only after the container is in the DOM. Re-scan if the script is already on the page. */
export function ensureMeetingsEmbed() {
	const containers = document.querySelectorAll(".meetings-iframe-container");
	if (!containers.length) return;
	if ([...containers].every((el) => el.querySelector("iframe"))) return;
	if (window.hbspt?.meetings?.create) {
		window.hbspt.meetings.create(".meetings-iframe-container");
		return;
	}
	if (document.querySelector("script[data-ha-meetings]")) return;
	const script = document.createElement("script");
	script.src = EMBED_SRC;
	script.type = "text/javascript";
	script.async = false;
	script.dataset.haMeetings = "true";
	script.addEventListener("load", () => ensureMeetingsEmbed());
	document.body.appendChild(script);
}

/** The path decides the language, so a leftover ?lang= must not reach the page or the scheduler. */
function dropLangParam() {
	const url = new URL(window.location.href);
	if (!url.searchParams.has("lang")) return;
	url.searchParams.delete("lang");
	history.replaceState(null, "", url.pathname + url.search + url.hash);
}

/** @param {"en" | "es"} lang Language from the /en/ or /es/ path, never from storage or ?lang=. */
export function mountBookMeeting(lang) {
	dropLangParam();
	const page = COPY[lang] || COPY.en;
	document.documentElement.lang = page.lang;
	document.title = page.title;
	document.body.classList.remove("page-confirm");
	document.body.classList.add("va", "page-book");

	const robots = document.querySelector('meta[name="robots"]');
	if (robots && /noindex/i.test(robots.getAttribute("content") || "")) robots.remove();
	document.querySelector('script[type="application/ld+json"]')?.remove();

	const description = upsertMeta('meta[name="description"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("name", "description");
		return meta;
	});
	description.setAttribute("content", page.description);

	const ogTitle = upsertMeta('meta[property="og:title"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:title");
		return meta;
	});
	ogTitle.setAttribute("content", page.title);
	const ogDescription = upsertMeta('meta[property="og:description"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:description");
		return meta;
	});
	ogDescription.setAttribute("content", page.description);
	const ogUrl = upsertMeta('meta[property="og:url"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "og:url");
		return meta;
	});
	ogUrl.setAttribute("content", pageUrl(page.lang));

	upsertLink("canonical", pageUrl(page.lang));
	upsertLink("alternate", pageUrl("en"), "en");
	upsertLink("alternate", pageUrl("es"), "es");
	upsertLink("alternate", pageUrl("en"), "x-default");

	const app = document.getElementById("app");
	const current = app?.querySelector("[data-book-lang]");
	if (app && current?.dataset.bookLang !== page.lang) app.innerHTML = markup(page);
	ensureMeetingsEmbed();
}

if (document.body.classList.contains("page-book")) {
	mountBookMeeting(bookMeetingLang() || (document.documentElement.lang === "es" ? "es" : "en"));
}

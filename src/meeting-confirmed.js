import "./styles.css";
import "./a.css";
import "./meeting-confirmed.css";

const TITLE = "Meeting confirmed | HumanAuthn";
const HOME = "/";

const logo = `<span class="va-logo__text">Human<span class="va-logo__lambda">Λ</span>uthn</span>`;

const icon = `<svg class="confirm-icon__svg" width="88" height="88" viewBox="0 0 96 96" fill="none" aria-hidden="true">
	<circle cx="48" cy="48" r="48" fill="#efeaff"/>
	<path fill="#6a2cf5" d="M43.6 63.2c-1.6 0-3.1-.6-4.2-1.8L28.8 50.6a3.4 3.4 0 0 1 4.9-4.7l9.2 9.6 20.2-23.4a3.4 3.4 0 1 1 5.1 4.5L48.1 61.2a5.4 5.4 0 0 1-4.1 2z"/>
</svg>`;

function markup() {
	const year = new Date().getFullYear();
	return `
	<div class="confirm">
		<header class="confirm-header">
			<a class="va-logo" href="${HOME}" aria-label="HumanAuthn home">${logo}</a>
		</header>
		<main class="confirm-stage">
			<div class="confirm-float confirm-float--tr" aria-hidden="true"><img src="/img/avatar-man.webp" alt="" width="96" height="96" /></div>
			<div class="confirm-float confirm-float--ml" aria-hidden="true"><img src="/img/avatar-welcome.webp" alt="" width="112" height="112" /></div>
			<div class="confirm-float confirm-float--br" aria-hidden="true"><img src="/img/hero-avatar-r.webp" alt="" width="84" height="84" /></div>
			<section class="confirm-card" aria-labelledby="confirm-title">
				<div class="confirm-icon">${icon}</div>
				<h1 id="confirm-title">Booking confirmed</h1>
				<p>You have a reservation with <a href="${HOME}">HumanAuthn</a>. An invitation has been sent to you by email.</p>
				<a class="va-btn va-btn--violet confirm-home" href="${HOME}">Go to home</a>
			</section>
		</main>
		<footer class="va-foot">
			<div class="confirm-foot">
				<div class="confirm-foot__brand">
					<a class="va-logo" href="${HOME}" aria-label="HumanAuthn home">${logo}</a>
					<address>30 N Gould St Ste 30338, Sheridan, WY 82801</address>
					<p>© ${year} HumanAuthn. All rights reserved.</p>
				</div>
				<p class="confirm-foot__by">Built by <a href="https://verifik.co" target="_blank" rel="noopener">Verifik</a></p>
			</div>
		</footer>
	</div>`;
}

function ensureMeta(selector, create) {
	let el = document.head.querySelector(selector);
	if (!el) {
		el = create();
		document.head.appendChild(el);
	}
	return el;
}

/** Renders the thank-you page and forces noindex, including when the SPA shell is served at this URL. */
export function mountMeetingConfirmed() {
	document.documentElement.lang = "en";
	document.title = TITLE;
	document.body.classList.add("va", "page-confirm");

	const robots = ensureMeta('meta[name="robots"]', () => {
		const meta = document.createElement("meta");
		meta.setAttribute("name", "robots");
		return meta;
	});
	robots.setAttribute("content", "noindex, nofollow");

	document.querySelector('link[rel="canonical"]')?.remove();
	document.querySelector('meta[property="og:url"]')?.remove();
	document.querySelector('script[type="application/ld+json"]')?.remove();

	const description = "You have a reservation with HumanAuthn. An invitation has been sent to you by email.";
	const desc = document.querySelector('meta[name="description"]');
	desc?.setAttribute("content", description);
	document.querySelector('meta[property="og:title"]')?.setAttribute("content", TITLE);
	document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);

	const app = document.getElementById("app");
	if (app && !app.querySelector(".confirm")) app.innerHTML = markup();
}

if (document.body.classList.contains("page-confirm")) {
	mountMeetingConfirmed();
}

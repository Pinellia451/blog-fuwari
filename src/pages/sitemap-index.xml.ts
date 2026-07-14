import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	if (!site) {
		throw new Error("The sitemap requires Astro's site configuration.");
	}

	const sitemapUrl = new URL("sitemap-0.xml", site).href;
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		`<sitemap><loc>${sitemapUrl}</loc></sitemap>`,
		"</sitemapindex>",
	].join("");

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
};

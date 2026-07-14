import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { PAGE_SIZE } from "../constants/constants";
import {
	getSortedPosts,
	getSortedPostsForArchive,
} from "../utils/content-utils";
import { formatDateToYYYYMMDD } from "../utils/date-utils";

type SitemapEntry = {
	path: string;
	lastmod?: Date;
};

function escapeXml(value: string): string {
	return value.replace(
		/[<>&'"]/g,
		(character) =>
			({
				"<": "&lt;",
				">": "&gt;",
				"&": "&amp;",
				"'": "&apos;",
				'"': "&quot;",
			})[character] ?? character,
	);
}

function getPostLastmod(post: {
	data: { published: Date; updated?: Date };
}): Date {
	return post.data.updated ?? post.data.published;
}

function getLatestDate(
	posts: { data: { published: Date; updated?: Date } }[],
): Date | undefined {
	return posts.reduce<Date | undefined>((latest, post) => {
		const date = getPostLastmod(post);
		return !latest || date > latest ? date : latest;
	}, undefined);
}

export async function GET({ site }: APIContext): Promise<Response> {
	if (!site) {
		throw new Error("The sitemap requires Astro's site configuration.");
	}

	const [homePosts, archivePosts, contentPages] = await Promise.all([
		getSortedPosts(),
		getSortedPostsForArchive(),
		getCollection("pages"),
	]);

	const entries: SitemapEntry[] = [
		{ path: "/", lastmod: getLatestDate(homePosts.slice(0, PAGE_SIZE)) },
		{ path: "/about/" },
		{ path: "/archive/", lastmod: getLatestDate(archivePosts) },
		{ path: "/friends/" },
	];

	for (
		let pageNumber = 2;
		pageNumber <= Math.ceil(homePosts.length / PAGE_SIZE);
		pageNumber++
	) {
		const pagePosts = homePosts.slice(
			(pageNumber - 1) * PAGE_SIZE,
			pageNumber * PAGE_SIZE,
		);
		entries.push({
			path: `/${pageNumber}/`,
			lastmod: getLatestDate(pagePosts),
		});
	}

	for (const page of contentPages) {
		if (page.slug !== "about" && page.slug !== "friends") {
			entries.push({ path: `/${page.slug}/` });
		}
	}

	for (const post of archivePosts) {
		entries.push({
			path: `/posts/${post.slug}/`,
			lastmod: getPostLastmod(post),
		});
	}

	const uniqueEntries = Array.from(
		new Map(entries.map((entry) => [entry.path, entry])).values(),
	);
	const urls = uniqueEntries
		.map((entry) => {
			const location = escapeXml(new URL(entry.path, site).href);
			const lastmod = entry.lastmod
				? `<lastmod>${formatDateToYYYYMMDD(entry.lastmod)}</lastmod>`
				: "";
			return `<url><loc>${location}</loc>${lastmod}</url>`;
		})
		.join("");
	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		"</urlset>",
	].join("");

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}

import { visit } from "unist-util-visit";

/**
 * Keep the post title as the page's only h1 while preserving the existing
 * appearance of Markdown h1 headings through the post-content-h1 class.
 */
export function rehypeDemotePostH1() {
	return (tree, file) => {
		const filePath = String(file.path ?? "").replaceAll("\\", "/");
		if (!filePath.includes("/content/posts/")) return;

		visit(tree, "element", (node) => {
			if (node.tagName !== "h1") return;

			node.tagName = "h2";
			node.properties ??= {};
			const classNames = Array.isArray(node.properties.className)
				? node.properties.className
				: [];
			node.properties.className = [...classNames, "post-content-h1"];
		});
	};
}

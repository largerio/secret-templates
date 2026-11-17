import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { appInfoSchema } from "@runtipi/common/schemas";
import { type } from "arktype";
import { load } from "js-yaml";

const root = process.cwd();
const appsDir = path.join(root, "apps");
const apps = fs
	.readdirSync(appsDir)
	.filter((name) => fs.statSync(path.join(appsDir, name)).isDirectory());

const read = (...parts: string[]) => fs.readFileSync(path.join(root, ...parts), "utf8");

type Compose = {
	services: Record<string, { image?: string; "x-runtipi"?: { is_main?: boolean; internal_port?: unknown } }>;
	"x-runtipi"?: { schema_version?: number };
};

describe.each(apps)("Runtipi app %s", (app) => {
	test("has its files", () => {
		for (const file of ["config.json", "docker-compose.yml", "metadata/logo.jpg", "metadata/description.md"]) {
			expect(fs.existsSync(path.join(appsDir, app, file)), file).toBe(true);
		}
	});

	test("has a valid config.json, named after its folder", () => {
		const config = JSON.parse(read("apps", app, "config.json"));
		const parsed = appInfoSchema.omit("urn")(config);
		if (parsed instanceof type.errors) throw new Error(parsed.summary);
		expect(config.id).toBe(app);
	});

	test("has a docker-compose.yml in schema 2, with one main service", () => {
		const compose = load(read("apps", app, "docker-compose.yml")) as Compose;
		expect(compose["x-runtipi"]?.schema_version).toBe(2);

		const main = Object.values(compose.services).filter((service) => service["x-runtipi"]?.is_main);
		expect(main).toHaveLength(1);
		expect(typeof main[0]?.["x-runtipi"]?.internal_port).toBe("number");
	});

	test("pins every image to the version config.json announces", () => {
		const { version } = JSON.parse(read("apps", app, "config.json"));
		const compose = load(read("apps", app, "docker-compose.yml")) as Compose;
		for (const service of Object.values(compose.services)) {
			expect(service.image).toMatch(/:[\w.-]+$/);
			expect(service.image).not.toMatch(/:latest$/);
		}
		const images = Object.values(compose.services).map((service) => service.image);
		expect(images.some((image) => image?.endsWith(`:${version}`))).toBe(true);
	});
});

const templates = fs.readdirSync(path.join(root, "unraid")).filter((name) => name.endsWith(".xml"));

describe.each(templates)("Unraid template %s", (file) => {
	const xml = read("unraid", file);
	const tag = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(xml)?.[1];

	test("names an image, an overview and a category", () => {
		expect(xml.startsWith('<?xml version="1.0"?>\n<Container version="2">')).toBe(true);
		expect(tag("Repository")).toMatch(/^[\w./-]+:[\w.-]+$/);
		expect(tag("Overview")?.length).toBeGreaterThan(0);
		expect(tag("Category")?.length).toBeGreaterThan(0);
	});

	test("points TemplateURL at itself and Icon at a file of this repository", () => {
		const base = "https://raw.githubusercontent.com/largerio/secret-templates/main/";
		expect(tag("TemplateURL")).toBe(`${base}unraid/${file}`);
		const icon = tag("Icon") ?? "";
		expect(icon.startsWith(base)).toBe(true);
		expect(fs.existsSync(path.join(root, icon.slice(base.length)))).toBe(true);
	});
});

test("ca_profile.xml has a profile", () => {
	expect(read("ca_profile.xml")).toMatch(/<Profile>[^<]+<\/Profile>/);
});

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "src/content/docs");

export type Doc = {
    slug: string[];
    meta: {
        title?: string;
        description?: string;
        section?: string;
        order?: number;
        [key: string]: any;
    };
    content: string;
};

export function getAllDocs(): Doc[] {
    const filePaths = getFilesRecursively(contentDirectory);

    return filePaths.map((filePath) => {
        const relativePath = path.relative(contentDirectory, filePath);
        const slug = relativePath.replace(/\.mdx?$/, "").split(path.sep);

        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(fileContent);

        return {
            slug,
            meta: data,
            content,
        };
    }).sort((a, b) => (a.meta.order || 99) - (b.meta.order || 99));
}

export function getDocBySlug(slug: string[]): Doc | null {
    const realSlug = slug.join("/");
    const fullPath = path.join(contentDirectory, `${realSlug}.mdx`);

    try {
        if (!fs.existsSync(fullPath)) return null;

        const fileContent = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContent);

        return {
            slug,
            meta: data,
            content,
        };
    } catch (e) {
        return null;
    }
}

function getFilesRecursively(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
        .filter((file) => !file.isDirectory())
        .map((file) => path.join(dir, file.name));
    const folders = entries.filter((folder) => folder.isDirectory());

    for (const folder of folders) {
        files.push(...getFilesRecursively(path.join(dir, folder.name)));
    }

    return files;
}
